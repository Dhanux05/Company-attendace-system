const Leave = require('../models/Leave');
const User = require('../models/User');
const { logAudit } = require('../services/auditService');
const { createNotification, createManyNotifications } = require('../services/notificationService');

const validLeaveTypes = ['Sick Leave', 'Casual Leave', 'Emergency Leave', 'Personal Leave', 'Other'];

exports.applyLeave = async (req, res) => {
  try {
    const { leaveType, startDate, endDate, reason } = req.body;
    if (!validLeaveTypes.includes(leaveType)) {
      return res.status(400).json({ message: 'Invalid leave type' });
    }
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Start date and end date are required' });
    }
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return res.status(400).json({ message: 'Invalid leave dates' });
    }
    if (end < start) {
      return res.status(400).json({ message: 'End date must be on/after start date' });
    }
    if (!reason || !reason.trim()) {
      return res.status(400).json({ message: 'Reason is required' });
    }

    const overlap = await Leave.findOne({
      user: req.user._id,
      status: { $in: ['Pending', 'Approved'] },
      $or: [
        { startDate: { $lte: endDate }, endDate: { $gte: startDate } },
      ],
    });
    if (overlap) {
      return res.status(400).json({ message: 'Overlapping leave request already exists' });
    }

    const leave = await Leave.create({
      user: req.user._id,
      leaveType,
      startDate: start,
      endDate: end,
      reason: reason.trim(),
    });

    // Notify admins and teamlead (if exists)
    const me = await User.findById(req.user._id).select('team name');
    const admins = await User.find({ role: 'admin', isActive: true }).select('_id');
    const approverIds = admins.map((a) => a._id);
    if (me?.team) {
      const tl = await User.findOne({ team: me.team, role: 'teamlead', isActive: true }).select('_id');
      if (tl) approverIds.push(tl._id);
    }
    await createManyNotifications([...new Set(approverIds.map(String))], {
      type: 'leave',
      title: 'New leave request',
      message: `${me?.name || 'User'} applied for ${leaveType} leave (${start.toISOString().slice(0, 10)} to ${end.toISOString().slice(0, 10)}).`,
      meta: { leaveId: leave._id },
    });

    await logAudit(req, {
      action: 'apply_leave',
      module: 'leave',
      targetType: 'leave',
      targetId: String(leave._id),
      message: 'Leave request submitted',
      changes: { leaveType, startDate: start, endDate: end },
    });

    res.status(201).json(leave);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMyLeaves = async (req, res) => {
  try {
    const leaves = await Leave.find({ user: req.user._id }).populate('reviewedBy', 'name').sort({ createdAt: -1 });
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
    const memberIds = teamMembers.map((m) => m._id);
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
    const { status, userId, startDate, endDate } = req.query;
    const query = {};
    if (status) query.status = status;
    if (userId) query.user = userId;
    if (startDate && endDate) {
      query.$or = [{ startDate: { $lte: endDate }, endDate: { $gte: startDate } }];
    }
    const leaves = await Leave.find(query).populate('user', 'name email team').populate('reviewedBy', 'name').sort({ createdAt: -1 });
    res.json(leaves);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.reviewLeave = async (req, res) => {
  try {
    const { status, reviewNote } = req.body;
    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Use Approved/Rejected' });
    }

    const leave = await Leave.findById(req.params.id);
    if (!leave) return res.status(404).json({ message: 'Leave not found' });

    if (req.user.role === 'teamlead') {
      const intern = await User.findById(leave.user);
      const leader = await User.findById(req.user._id);
      if (!intern.team || intern.team.toString() !== leader.team?.toString()) {
        return res.status(403).json({ message: 'Not your team member' });
      }
    }

    const before = { status: leave.status, reviewedBy: leave.reviewedBy, reviewedAt: leave.reviewedAt };
    leave.status = status;
    leave.reviewedBy = req.user._id;
    leave.reviewNote = reviewNote;
    leave.reviewedAt = new Date();
    await leave.save();

    const updated = await Leave.findById(leave._id).populate('user', 'name email').populate('reviewedBy', 'name');

    await createNotification({
      user: leave.user,
      type: 'leave',
      title: `Leave ${status}`,
      message: `Your leave request (${leave.startDate} to ${leave.endDate}) has been ${status.toLowerCase()}.`,
      meta: { leaveId: leave._id, status },
    });

    await logAudit(req, {
      action: 'review_leave',
      module: 'leave',
      targetType: 'leave',
      targetId: String(leave._id),
      message: `Leave ${status.toLowerCase()}`,
      changes: { before, after: { status, reviewNote } },
    });

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
