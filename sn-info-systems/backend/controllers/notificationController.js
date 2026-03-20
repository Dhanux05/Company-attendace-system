const Notification = require('../models/Notification');
const Team = require('../models/Team');
const User = require('../models/User');
const { createManyNotifications } = require('../services/notificationService');

const resolveCurrentTeam = async (userId) => {
  const me = await User.findById(userId).select('role team');
  if (!me) return null;

  const fallbackTeam = me.role === 'teamlead'
    ? await Team.findOne({ leader: userId, isActive: true }).select('_id')
    : null;

  return me.team || fallbackTeam?._id || null;
};

exports.getMyNotifications = async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit || 50), 200);
    const notifications = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(limit);
    const unreadCount = await Notification.countDocuments({ user: req.user._id, isRead: false });
    res.json({ unreadCount, notifications });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const updated = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { isRead: true, readAt: new Date() },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: 'Notification not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.markAllRead = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { user: req.user._id, isRead: false },
      { isRead: true, readAt: new Date() }
    );
    res.json({ message: 'All notifications marked as read', updated: result.modifiedCount || 0 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getTeamAnnouncements = async (req, res) => {
  try {
    const teamId = await resolveCurrentTeam(req.user._id);
    if (!teamId) return res.status(404).json({ message: 'No team assigned' });

    const limit = Math.min(Number(req.query.limit || 50), 100);
    const announcements = await Notification.find({
      user: req.user._id,
      type: 'team_announcement',
      'meta.teamId': String(teamId),
    })
      .sort({ createdAt: -1 })
      .limit(limit);

    res.json(announcements);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createTeamAnnouncement = async (req, res) => {
  try {
    const teamId = await resolveCurrentTeam(req.user._id);
    if (!teamId) return res.status(404).json({ message: 'No team assigned' });

    const team = await Team.findById(teamId).populate('leader', 'name');
    if (!team || !team.isActive) return res.status(404).json({ message: 'Team not found' });

    const title = String(req.body.title || '').trim() || 'Team announcement';
    const message = String(req.body.message || '').trim();
    if (!message) return res.status(400).json({ message: 'Announcement message is required' });

    const recipients = await User.find({
      team: team._id,
      isActive: true,
      role: { $ne: 'admin' },
    }).select('_id');

    const recipientIds = [...new Set(recipients.map((member) => String(member._id)).concat(String(req.user._id)))];

    const created = await createManyNotifications(recipientIds, {
      type: 'team_announcement',
      title,
      message,
      meta: {
        teamId: String(team._id),
        teamName: team.name,
        announcedBy: {
          _id: String(req.user._id),
          name: req.user.name,
        },
      },
    });

    const authorCopy = created.find((item) => String(item.user) === String(req.user._id)) || created[0] || null;
    res.status(201).json(authorCopy);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
