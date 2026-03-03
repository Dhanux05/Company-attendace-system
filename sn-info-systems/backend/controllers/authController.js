const jwt = require('jsonwebtoken');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const generateRefreshToken = require('../utils/generateRefreshToken');
const { validatePasswordPolicy } = require('../utils/passwordPolicy');
const { logAudit } = require('../services/auditService');
const { createNotification } = require('../services/notificationService');

const MAX_LOGIN_ATTEMPTS = Number(process.env.MAX_LOGIN_ATTEMPTS || 5);
const LOCK_MINUTES = Number(process.env.ACCOUNT_LOCK_MINUTES || 15);

const baseUserPayload = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  team: user.team,
  profilePhoto: user.profilePhoto,
  faceRegistered: user.faceRegistered,
  isActive: user.isActive,
  phone: user.phone,
  joinDate: user.joinDate,
  lastProfileUpdateAt: user.lastProfileUpdateAt,
  emailVerified: user.emailVerified,
  phoneVerified: user.phoneVerified,
  twoFactorEnabled: user.twoFactorEnabled,
});

const generateTwoFactorCode = () => String(Math.floor(100000 + Math.random() * 900000));

exports.register = async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;
    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(400).json({ message: 'User already exists' });

    const passwordCheck = validatePasswordPolicy(password);
    if (!passwordCheck.ok) return res.status(400).json({ message: passwordCheck.message });

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: role || 'intern',
      phone,
    });

    await createNotification({
      user: user._id,
      type: 'account',
      title: 'Welcome to SN Info Systems',
      message: 'Your account has been created successfully.',
    });

    res.status(201).json({
      ...baseUserPayload(user),
      token: generateToken(user._id),
      refreshToken: generateRefreshToken(user._id, user.tokenVersion || 0),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() }).populate('team', 'name');

    if (!user || !(await user.matchPassword(password))) {
      if (user) {
        user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
        if (user.failedLoginAttempts >= MAX_LOGIN_ATTEMPTS) {
          user.lockUntil = new Date(Date.now() + LOCK_MINUTES * 60 * 1000);
        }
        await user.save();
      }
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (user.lockUntil && new Date(user.lockUntil) > new Date()) {
      return res.status(423).json({
        message: `Account temporarily locked. Try again after ${new Date(user.lockUntil).toLocaleTimeString()}`,
      });
    }

    if (!user.isActive) return res.status(403).json({ message: 'Account deactivated' });

    user.failedLoginAttempts = 0;
    user.lockUntil = null;
    await user.save();

    if (['teamlead'].includes(user.role) && user.twoFactorEnabled) {
      const code = generateTwoFactorCode();
      user.twoFactorCode = code;
      user.twoFactorCodeExpires = new Date(Date.now() + 10 * 60 * 1000);
      await user.save();

      await createNotification({
        user: user._id,
        type: 'security',
        title: '2FA code generated',
        message: `Your one-time login code is ${code}. Expires in 10 minutes.`,
      });

      const tempToken = jwt.sign(
        { id: user._id, purpose: '2fa-login' },
        process.env.JWT_SECRET,
        { expiresIn: '10m' }
      );
      return res.json({
        requires2FA: true,
        tempToken,
        message: '2FA code sent to your notifications.',
      });
    }

    res.json({
      ...baseUserPayload(user),
      token: generateToken(user._id),
      refreshToken: generateRefreshToken(user._id, user.tokenVersion || 0),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.verifyLogin2FA = async (req, res) => {
  try {
    const { tempToken, code } = req.body;
    const decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
    if (decoded.purpose !== '2fa-login') {
      return res.status(400).json({ message: 'Invalid 2FA token' });
    }

    const user = await User.findById(decoded.id).populate('team', 'name');
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!user.twoFactorCode || !user.twoFactorCodeExpires || new Date(user.twoFactorCodeExpires) < new Date()) {
      return res.status(400).json({ message: '2FA code expired. Please login again.' });
    }
    if (String(code) !== String(user.twoFactorCode)) {
      return res.status(400).json({ message: 'Invalid 2FA code' });
    }

    user.twoFactorCode = null;
    user.twoFactorCodeExpires = null;
    await user.save();

    res.json({
      ...baseUserPayload(user),
      token: generateToken(user._id),
      refreshToken: generateRefreshToken(user._id, user.tokenVersion || 0),
    });
  } catch (err) {
    res.status(400).json({ message: '2FA verification failed' });
  }
};

exports.refreshAccessToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ message: 'Refresh token required' });

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
    if (decoded.type !== 'refresh') return res.status(400).json({ message: 'Invalid refresh token type' });

    const user = await User.findById(decoded.id).populate('team', 'name');
    if (!user || !user.isActive) return res.status(401).json({ message: 'Invalid refresh token user' });
    if ((user.tokenVersion || 0) !== (decoded.tokenVersion || 0)) {
      return res.status(401).json({ message: 'Refresh token revoked' });
    }

    res.json({
      ...baseUserPayload(user),
      token: generateToken(user._id),
      refreshToken: generateRefreshToken(user._id, user.tokenVersion || 0),
    });
  } catch (err) {
    res.status(401).json({ message: 'Refresh token failed' });
  }
};

exports.logoutAllSessions = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { $inc: { tokenVersion: 1 } });
    await logAudit(req, {
      action: 'logout_all_sessions',
      module: 'auth',
      targetType: 'user',
      targetId: String(req.user._id),
      message: 'User revoked all refresh sessions',
    });
    res.json({ message: 'Logged out from all sessions' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.enable2FA = async (req, res) => {
  try {
    if (!['admin', 'teamlead'].includes(req.user.role)) {
      return res.status(403).json({ message: '2FA setup is available only for admin/teamlead' });
    }
    const user = await User.findById(req.user._id);
    user.twoFactorEnabled = true;
    await user.save();

    await logAudit(req, {
      action: 'enable_2fa',
      module: 'auth',
      targetType: 'user',
      targetId: String(user._id),
      message: 'Two-factor authentication enabled',
    });
    res.json({ message: '2FA enabled' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.disable2FA = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.twoFactorEnabled = false;
    user.twoFactorCode = null;
    user.twoFactorCodeExpires = null;
    await user.save();

    await logAudit(req, {
      action: 'disable_2fa',
      module: 'auth',
      targetType: 'user',
      targetId: String(user._id),
      message: 'Two-factor authentication disabled',
    });
    res.json({ message: '2FA disabled' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMe = async (req, res) => {
  const user = await User.findById(req.user._id).select('-password -faceEmbedding').populate('team', 'name');
  res.json(user);
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, email, phone, profilePhoto } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Name is required' });
    }
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const changes = {};
    const trimmedName = name.trim();
    if (user.name !== trimmedName) changes.name = { from: user.name, to: trimmedName };
    user.name = trimmedName;

    if (typeof email === 'string') {
      const normalizedEmail = email.trim().toLowerCase();
      if (!normalizedEmail) {
        return res.status(400).json({ message: 'Email is required' });
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(normalizedEmail)) {
        return res.status(400).json({ message: 'Please enter a valid email address' });
      }
      if (normalizedEmail !== user.email) {
        const emailExists = await User.findOne({ email: normalizedEmail, _id: { $ne: user._id } });
        if (emailExists) return res.status(400).json({ message: 'Email is already in use' });
        changes.email = { from: user.email, to: normalizedEmail };
      }
      user.email = normalizedEmail;
    }

    if (typeof phone === 'string') {
      const phoneValue = phone.trim();
      if (phoneValue && !/^[+()\-.\d\s]{7,20}$/.test(phoneValue)) {
        return res.status(400).json({ message: 'Please enter a valid phone number' });
      }
      if ((user.phone || '') !== phoneValue) changes.phone = { from: user.phone || '', to: phoneValue };
      user.phone = phoneValue;
    }

    if (profilePhoto === null || profilePhoto === '') {
      if (user.profilePhoto) changes.profilePhoto = { from: 'set', to: 'removed' };
      user.profilePhoto = '';
    } else if (typeof profilePhoto === 'string') {
      if (user.profilePhoto !== profilePhoto) changes.profilePhoto = { from: user.profilePhoto ? 'set' : 'empty', to: 'set' };
      user.profilePhoto = profilePhoto;
    }

    user.lastProfileUpdateAt = new Date();
    await user.save();

    await logAudit(req, {
      action: 'update_profile',
      module: 'profile',
      targetType: 'user',
      targetId: String(user._id),
      message: 'User updated profile',
      changes,
    });
    await createNotification({
      user: user._id,
      type: 'profile',
      title: 'Profile updated',
      message: 'Your account profile was updated successfully.',
      meta: { fields: Object.keys(changes) },
    });

    res.json(baseUserPayload(user));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new password are required' });
    }
    const passwordCheck = validatePasswordPolicy(newPassword);
    if (!passwordCheck.ok) {
      return res.status(400).json({ message: passwordCheck.message });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const matched = await user.matchPassword(currentPassword);
    if (!matched) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    await logAudit(req, {
      action: 'change_password',
      module: 'auth',
      targetType: 'user',
      targetId: String(user._id),
      message: 'User changed password',
    });
    await createNotification({
      user: user._id,
      type: 'security',
      title: 'Password changed',
      message: 'Your account password was changed successfully.',
    });

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.saveFaceEmbedding = async (req, res) => {
  try {
    const { embedding } = req.body;
    if (!embedding || !Array.isArray(embedding)) {
      return res.status(400).json({ message: 'Invalid embedding data' });
    }
    await User.findByIdAndUpdate(req.user._id, { faceEmbedding: embedding, faceRegistered: true });
    res.json({ message: 'Face registered successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getFaceEmbedding = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('faceEmbedding faceRegistered');
    if (!user.faceRegistered) return res.status(404).json({ message: 'Face not registered' });
    res.json({ embedding: user.faceEmbedding });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

