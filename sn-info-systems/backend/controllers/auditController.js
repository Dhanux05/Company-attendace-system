const AuditLog = require('../models/AuditLog');
const User = require('../models/User');

exports.getAuditLogs = async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit || 100), 500);
    const query = {};
    if (req.query.actor) query.actor = req.query.actor;
    if (req.query.module) query.module = req.query.module;
    if (req.query.action) query.action = req.query.action;
    if (req.query.startDate && req.query.endDate) {
      query.createdAt = {
        $gte: new Date(`${req.query.startDate}T00:00:00.000Z`),
        $lte: new Date(`${req.query.endDate}T23:59:59.999Z`),
      };
    }

    const logs = await AuditLog.find(query)
      .populate('actor', 'name email role')
      .sort({ createdAt: -1 })
      .limit(limit);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getTodayTimeline = async (req, res) => {
  try {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const query = { createdAt: { $gte: start, $lte: end } };
    if (req.user.role === 'teamlead') {
      const me = await User.findById(req.user._id).select('team');
      const members = await User.find({ team: me?.team, isActive: true }).select('_id');
      query.actor = { $in: [req.user._id, ...members.map((m) => m._id)] };
    }

    const timeline = await AuditLog.find(query).populate('actor', 'name role').sort({ createdAt: -1 }).limit(200);
    res.json(timeline);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
