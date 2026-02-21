const User = require('../models/User');
const generateToken = require('../utils/generateToken');

exports.register = async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'User already exists' });
    const user = await User.create({ name, email, password, role: role || 'intern', phone });
    res.status(201).json({
      _id: user._id, name: user.name, email: user.email, role: user.role,
      token: generateToken(user._id)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).populate('team', 'name');
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    if (!user.isActive) return res.status(403).json({ message: 'Account deactivated' });
    res.json({
      _id: user._id, name: user.name, email: user.email, role: user.role,
      team: user.team, faceRegistered: user.faceRegistered,
      token: generateToken(user._id)
    });
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
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Name is required' });
    }
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.name = name.trim();
    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      team: user.team,
      faceRegistered: user.faceRegistered,
      isActive: user.isActive,
      phone: user.phone,
    });
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
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const matched = await user.matchPassword(currentPassword);
    if (!matched) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

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
