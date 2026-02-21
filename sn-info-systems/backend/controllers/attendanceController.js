const Attendance = require('../models/Attendance');
const User = require('../models/User');
const Team = require('../models/Team');
const { isWithinOffice } = require('../utils/geoFence');

const getToday = () => new Date().toISOString().split('T')[0];

exports.markLogin = async (req, res) => {
  try {
    const { lat, lng, faceVerified } = req.body;
    if (!lat || !lng) return res.status(400).json({ message: 'Location required' });

    const { withinRange, distance } = isWithinOffice(lat, lng);
    const allowedRadius = Number(process.env.OFFICE_RADIUS || 100);
    if (!withinRange) {
      return res.status(400).json({ message: `You are ${distance}m away from office. Must be within ${allowedRadius}m.` });
    }
    if (!faceVerified) {
      return res.status(400).json({ message: 'Face verification required' });
    }

    const date = getToday();
    const existing = await Attendance.findOne({ user: req.user._id, date });
    if (existing && existing.loginTime) {
      return res.status(400).json({ message: 'Already logged in today' });
    }

    const now = new Date();
    const hour = now.getHours();
    const status = hour >= 10 ? 'Late' : 'Present';

    const attendance = await Attendance.findOneAndUpdate(
      { user: req.user._id, date },
      { loginTime: now, status, loginLocation: { lat, lng }, faceVerifiedLogin: true },
      { new: true, upsert: true }
    );

    res.json({ message: 'Login marked successfully', attendance, status });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.markLogout = async (req, res) => {
  try {
    const { lat, lng, faceVerified } = req.body;
    if (!lat || !lng) return res.status(400).json({ message: 'Location required' });

    const { withinRange, distance } = isWithinOffice(lat, lng);
    if (!withinRange) {
      return res.status(400).json({ message: `You are ${distance}m away from office.` });
    }
    if (!faceVerified) return res.status(400).json({ message: 'Face verification required' });

    const date = getToday();
    const attendance = await Attendance.findOne({ user: req.user._id, date });
    if (!attendance || !attendance.loginTime) {
      return res.status(400).json({ message: 'No login found for today' });
    }
    if (attendance.logoutTime) {
      return res.status(400).json({ message: 'Already logged out today' });
    }

    const now = new Date();
    const totalHours = parseFloat(((now - attendance.loginTime) / (1000 * 60 * 60)).toFixed(2));

    attendance.logoutTime = now;
    attendance.totalHours = totalHours;
    attendance.logoutLocation = { lat, lng };
    attendance.faceVerifiedLogout = true;
    if (totalHours < 4) attendance.status = 'Half Day';
    await attendance.save();

    res.json({ message: 'Logout marked successfully', attendance });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMyAttendance = async (req, res) => {
  try {
    const { month, year } = req.query;
    let query = { user: req.user._id };
    if (month && year) {
      const start = `${year}-${String(month).padStart(2, '0')}-01`;
      const end = `${year}-${String(month).padStart(2, '0')}-31`;
      query.date = { $gte: start, $lte: end };
    }
    const records = await Attendance.find(query).sort({ date: -1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getTodayStatus = async (req, res) => {
  try {
    const date = getToday();
    const record = await Attendance.findOne({ user: req.user._id, date });
    res.json(record || null);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getTeamAttendance = async (req, res) => {
  try {
    const { date, month, year } = req.query;
    const leader = await User.findById(req.user._id).populate('team');
    const fallbackTeam = await Team.findOne({ leader: req.user._id, isActive: true });
    const teamId = leader?.team?._id || fallbackTeam?._id;
    if (!teamId) return res.status(400).json({ message: 'No team assigned to this team leader' });

    const teamMembers = await User.find({ team: teamId, isActive: true, role: { $ne: 'admin' } });
    const memberIds = teamMembers.map(m => m._id);

    if (memberIds.length === 0) {
      return res.json([]);
    }

    let query = { user: { $in: memberIds } };
    if (date) query.date = date;
    else if (month && year) {
      const start = `${year}-${String(month).padStart(2, '0')}-01`;
      const end = `${year}-${String(month).padStart(2, '0')}-31`;
      query.date = { $gte: start, $lte: end };
    }

    const records = await Attendance.find(query).populate('user', 'name email').sort({ date: -1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAllAttendance = async (req, res) => {
  try {
    const { date, userId, month, year } = req.query;
    let query = {};
    if (date) query.date = date;
    if (userId) query.user = userId;
    if (month && year) {
      const start = `${year}-${String(month).padStart(2, '0')}-01`;
      const end = `${year}-${String(month).padStart(2, '0')}-31`;
      query.date = { $gte: start, $lte: end };
    }
    const records = await Attendance.find(query).populate('user', 'name email role team').sort({ date: -1 }).limit(500);
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAnalytics = async (req, res) => {
  try {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const start = `${year}-${String(month).padStart(2, '0')}-01`;
    const end = `${year}-${String(month).padStart(2, '0')}-31`;

    const totalUsers = await User.countDocuments({ role: 'intern', isActive: true });
    const records = await Attendance.find({ date: { $gte: start, $lte: end } });

    const stats = { Present: 0, Late: 0, Absent: 0, 'Half Day': 0 };
    records.forEach(r => { stats[r.status] = (stats[r.status] || 0) + 1; });

    const avgHours = records.length > 0
      ? (records.reduce((sum, r) => sum + r.totalHours, 0) / records.filter(r => r.totalHours > 0).length || 0).toFixed(2)
      : 0;

    // Daily breakdown for chart
    const dailyMap = {};
    records.forEach(r => {
      if (!dailyMap[r.date]) dailyMap[r.date] = { date: r.date, present: 0, late: 0, absent: 0 };
      if (r.status === 'Present') dailyMap[r.date].present++;
      else if (r.status === 'Late') dailyMap[r.date].late++;
    });
    const daily = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));

    res.json({ totalUsers, stats, avgHours, daily, totalRecords: records.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
