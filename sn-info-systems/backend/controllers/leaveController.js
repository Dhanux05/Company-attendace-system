const Leave = require('../models/Leave');
const User = require('../models/User');

exports.applyLeave = async (req, res) => {
  try {
    const { leaveType, startDate, endDate, reason } = req.body;
    const leave = await Leave.create({
      user: req.user._id, leaveType, startDate, endDate, reason
    });
    res.status(201).json(leave);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMyLeaves = async (req, res) => {
  try {
    const leaves = await Leave.find({ user: req.user._id })
      .populate('reviewedBy', 'name')
      .sort({ createdAt: -1 });
    res.json(leaves);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getTeamLeaves = async (req, res) => {
  try {
    const leader = await User.findById(req.user._id);
    if (!leader.team) return res.status(400).json({ message: 'No team assigned' });
    const teamMembers = await User.find({ team: leader.team, role: 'intern' });
    const memberIds = teamMembers.map(m => m._id);
    const leaves = await Leave.find({ user: { $in: memberIds } })
      .populate('user', 'name email')
      .populate('reviewedBy', 'name')
      .sort({ createdAt: -1 });
    res.json(leaves);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAllLeaves = async (req, res) => {
  try {
    const { status } = req.query;
    const query = status ? { status } : {};
    const leaves = await Leave.find(query)
      .populate('user', 'name email team')
      .populate('reviewedBy', 'name')
      .sort({ createdAt: -1 });
    res.json(leaves);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.reviewLeave = async (req, res) => {
  try {
    const { status, reviewNote } = req.body;
    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    const leave = await Leave.findById(req.params.id);
    if (!leave) return res.status(404).json({ message: 'Leave not found' });

    // TL can only review own team's leaves
    if (req.user.role === 'teamlead') {
      const intern = await User.findById(leave.user);
      const leader = await User.findById(req.user._id);
      if (!intern.team || intern.team.toString() !== leader.team?.toString()) {
        return res.status(403).json({ message: 'Not your team member' });
      }
    }

    leave.status = status;
    leave.reviewedBy = req.user._id;
    leave.reviewNote = reviewNote;
    leave.reviewedAt = new Date();
    await leave.save();

    const updated = await Leave.findById(leave._id)
      .populate('user', 'name email')
      .populate('reviewedBy', 'name');
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getLeaveStats = async (req, res) => {
  try {
    const total = await Leave.countDocuments();
    const pending = await Leave.countDocuments({ status: 'Pending' });
    const approved = await Leave.countDocuments({ status: 'Approved' });
    const rejected = await Leave.countDocuments({ status: 'Rejected' });
    res.json({ total, pending, approved, rejected });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
