const Attendance = require('../models/Attendance');
const User = require('../models/User');
const Team = require('../models/Team');
const { isWithinOffice } = require('../utils/geoFence');
const { logAudit } = require('../services/auditService');
const { createNotification, createManyNotifications } = require('../services/notificationService');

const getToday = () => new Date().toISOString().split('T')[0];
const formatDate = (d) => d.toISOString().split('T')[0];
const LOGIN_LATE_AFTER = process.env.LOGIN_LATE_AFTER || '09:30';
const LOGOUT_EXPECTED_TIME = process.env.LOGOUT_EXPECTED_TIME || '18:30';

const timeToMinutes = (value, fallback) => {
  const source = value || fallback;
  const [hRaw, mRaw] = String(source).split(':');
  const h = Number(hRaw);
  const m = Number(mRaw);
  if (Number.isNaN(h) || Number.isNaN(m)) {
    const [fh, fm] = String(fallback).split(':').map(Number);
    return fh * 60 + fm;
  }
  return h * 60 + m;
};

const ensureLocation = (lat, lng) => {
  const nLat = Number(lat);
  const nLng = Number(lng);
  if (Number.isNaN(nLat) || Number.isNaN(nLng)) return null;
  if (nLat < -90 || nLat > 90 || nLng < -180 || nLng > 180) return null;
  return { lat: nLat, lng: nLng };
};

const parsePeriod = (query) => {
  if (query.startDate && query.endDate) {
    return { start: query.startDate, end: query.endDate };
  }
  if (query.month && query.year) {
    return {
      start: `${query.year}-${String(query.month).padStart(2, '0')}-01`,
      end: `${query.year}-${String(query.month).padStart(2, '0')}-31`,
    };
  }
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  return {
    start: `${y}-${String(m).padStart(2, '0')}-01`,
    end: `${y}-${String(m).padStart(2, '0')}-31`,
  };
};

exports.markLogin = async (req, res) => {
  try {
    const { lat, lng, faceVerified } = req.body;
    const location = ensureLocation(lat, lng);
    if (!location) return res.status(400).json({ message: 'Valid location is required' });

    const { withinRange, distance } = isWithinOffice(location.lat, location.lng);
    const allowedRadius = Number(process.env.OFFICE_RADIUS || 100);
    if (!withinRange) {
      return res.status(400).json({ message: `You are ${distance}m away from office. Must be within ${allowedRadius}m.` });
    }
    if (!faceVerified) return res.status(400).json({ message: 'Face verification required' });

    const date = getToday();
    const existing = await Attendance.findOne({ user: req.user._id, date });
    if (existing && existing.loginTime) {
      return res.status(400).json({ message: 'Already logged in today' });
    }

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const lateCutoffMinutes = timeToMinutes(LOGIN_LATE_AFTER, '09:30');
    const status = currentMinutes > lateCutoffMinutes ? 'Late' : 'Present';

    const attendance = await Attendance.findOneAndUpdate(
      { user: req.user._id, date },
      { loginTime: now, status, loginLocation: location, faceVerifiedLogin: true },
      { new: true, upsert: true }
    );

    // Missed logout alert for previous day
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayRecord = await Attendance.findOne({ user: req.user._id, date: formatDate(yesterday) });
    if (yesterdayRecord?.loginTime && !yesterdayRecord.logoutTime) {
      await createNotification({
        user: req.user._id,
        type: 'attendance',
        title: 'Missed logout detected',
        message: `No logout was recorded for ${yesterdayRecord.date}.`,
      });
    }

    if (status === 'Late') {
      await createNotification({
        user: req.user._id,
        type: 'attendance',
        title: 'Late check-in',
        message: `You checked in late on ${date}. Late cutoff is ${LOGIN_LATE_AFTER}.`,
      });
    }

    await logAudit(req, {
      action: 'mark_login',
      module: 'attendance',
      targetType: 'attendance',
      targetId: String(attendance._id),
      message: `Attendance login marked as ${status}`,
      changes: { status },
    });

    res.json({
      message: 'Login marked successfully',
      attendance,
      status,
      policy: { lateAfter: LOGIN_LATE_AFTER, expectedLogout: LOGOUT_EXPECTED_TIME },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.markLogout = async (req, res) => {
  try {
    const { lat, lng, faceVerified } = req.body;
    const location = ensureLocation(lat, lng);
    if (!location) return res.status(400).json({ message: 'Valid location is required' });

    const { withinRange, distance } = isWithinOffice(location.lat, location.lng);
    if (!withinRange) return res.status(400).json({ message: `You are ${distance}m away from office.` });
    if (!faceVerified) return res.status(400).json({ message: 'Face verification required' });

    const date = getToday();
    const attendance = await Attendance.findOne({ user: req.user._id, date });
    if (!attendance || !attendance.loginTime) {
      return res.status(400).json({ message: 'No login found for today' });
    }
    if (attendance.logoutTime) return res.status(400).json({ message: 'Already logged out today' });

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const expectedLogoutMinutes = timeToMinutes(LOGOUT_EXPECTED_TIME, '18:30');
    const totalHours = parseFloat(((now - attendance.loginTime) / (1000 * 60 * 60)).toFixed(2));
    const prevStatus = attendance.status;
    const earlyLogout = currentMinutes < expectedLogoutMinutes;

    attendance.logoutTime = now;
    attendance.totalHours = totalHours;
    attendance.logoutLocation = location;
    attendance.faceVerifiedLogout = true;
    if (totalHours < 4) attendance.status = 'Half Day';
    await attendance.save();

    if (earlyLogout) {
      await createNotification({
        user: req.user._id,
        type: 'attendance',
        title: 'Early logout',
        message: `You logged out before expected time (${LOGOUT_EXPECTED_TIME}).`,
      });
    }

    await logAudit(req, {
      action: 'mark_logout',
      module: 'attendance',
      targetType: 'attendance',
      targetId: String(attendance._id),
      message: 'Attendance logout marked',
      changes: { prevStatus, newStatus: attendance.status, totalHours, earlyLogout },
    });

    res.json({
      message: 'Logout marked successfully',
      attendance,
      policy: { lateAfter: LOGIN_LATE_AFTER, expectedLogout: LOGOUT_EXPECTED_TIME, earlyLogout },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.editAttendance = async (req, res) => {
  try {
    const { status, notes, loginTime, logoutTime } = req.body;
    const allowed = ['Present', 'Late', 'Absent', 'Half Day'];
    if (status && !allowed.includes(status)) {
      return res.status(400).json({ message: 'Invalid attendance status' });
    }

    const attendance = await Attendance.findById(req.params.id);
    if (!attendance) return res.status(404).json({ message: 'Attendance record not found' });

    const before = {
      status: attendance.status,
      loginTime: attendance.loginTime,
      logoutTime: attendance.logoutTime,
      notes: attendance.notes,
    };

    if (status) attendance.status = status;
    if (typeof notes === 'string') attendance.notes = notes.trim();
    if (loginTime) attendance.loginTime = new Date(loginTime);
    if (logoutTime) attendance.logoutTime = new Date(logoutTime);

    if (attendance.loginTime && attendance.logoutTime) {
      attendance.totalHours = parseFloat(((attendance.logoutTime - attendance.loginTime) / (1000 * 60 * 60)).toFixed(2));
    }

    await attendance.save();

    await logAudit(req, {
      action: 'edit_attendance',
      module: 'attendance',
      targetType: 'attendance',
      targetId: String(attendance._id),
      message: 'Admin edited attendance record',
      changes: { before, after: attendance.toObject() },
    });

    await createNotification({
      user: attendance.user,
      type: 'attendance',
      title: 'Attendance record updated',
      message: `Your attendance on ${attendance.date} was updated by admin.`,
      meta: { attendanceId: attendance._id },
    });

    res.json(attendance);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMyAttendance = async (req, res) => {
  try {
    const { month, year } = req.query;
    const query = { user: req.user._id };
    if (month && year) {
      query.date = {
        $gte: `${year}-${String(month).padStart(2, '0')}-01`,
        $lte: `${year}-${String(month).padStart(2, '0')}-31`,
      };
    }
    const records = await Attendance.find(query).sort({ date: -1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getTodayStatus = async (req, res) => {
  try {
    const record = await Attendance.findOne({ user: req.user._id, date: getToday() });
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
    const memberIds = teamMembers.map((m) => m._id);
    if (memberIds.length === 0) return res.json([]);

    const query = { user: { $in: memberIds } };
    if (date) query.date = date;
    else if (month && year) {
      query.date = {
        $gte: `${year}-${String(month).padStart(2, '0')}-01`,
        $lte: `${year}-${String(month).padStart(2, '0')}-31`,
      };
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
    const query = {};
    if (date) query.date = date;
    if (userId) query.user = userId;
    if (month && year) {
      query.date = {
        $gte: `${year}-${String(month).padStart(2, '0')}-01`,
        $lte: `${year}-${String(month).padStart(2, '0')}-31`,
      };
    }
    const records = await Attendance.find(query)
      .populate('user', 'name email role team')
      .sort({ date: -1 })
      .limit(1000);
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const buildAnalytics = (records) => {
  const stats = { Present: 0, Late: 0, Absent: 0, 'Half Day': 0 };
  const dailyMap = {};

  records.forEach((r) => {
    stats[r.status] = (stats[r.status] || 0) + 1;
    if (!dailyMap[r.date]) dailyMap[r.date] = { date: r.date, present: 0, late: 0, halfDay: 0, absent: 0 };
    if (r.status === 'Present') dailyMap[r.date].present += 1;
    if (r.status === 'Late') dailyMap[r.date].late += 1;
    if (r.status === 'Half Day') dailyMap[r.date].halfDay += 1;
    if (r.status === 'Absent') dailyMap[r.date].absent += 1;
  });

  const validHours = records.filter((r) => r.totalHours > 0);
  const avgHours = validHours.length
    ? (validHours.reduce((sum, r) => sum + r.totalHours, 0) / validHours.length).toFixed(2)
    : '0.00';

  return {
    stats,
    avgHours,
    daily: Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date)),
    totalRecords: records.length,
  };
};

exports.getAnalytics = async (req, res) => {
  try {
    const { start, end } = parsePeriod(req.query);
    const query = { date: { $gte: start, $lte: end } };

    if (req.query.userId) query.user = req.query.userId;

    if (req.query.teamId) {
      const teamMembers = await User.find({ team: req.query.teamId, isActive: true }).select('_id');
      query.user = { $in: teamMembers.map((u) => u._id) };
    } else if (req.user.role === 'teamlead') {
      const me = await User.findById(req.user._id);
      if (me?.team) {
        const teamMembers = await User.find({ team: me.team, isActive: true }).select('_id');
        query.user = { $in: teamMembers.map((u) => u._id) };
      }
    }

    const records = await Attendance.find(query);
    const summary = buildAnalytics(records);
    const totalUsers = query.user?.$in?.length || (await User.countDocuments({ role: 'intern', isActive: true }));

    let comparison = null;
    if (req.query.compare === 'previous') {
      const startDate = new Date(start);
      const endDate = new Date(end);
      const days = Math.max(1, Math.round((endDate - startDate) / (24 * 60 * 60 * 1000)) + 1);
      const prevEnd = new Date(startDate);
      prevEnd.setDate(prevEnd.getDate() - 1);
      const prevStart = new Date(prevEnd);
      prevStart.setDate(prevStart.getDate() - (days - 1));

      const prevQuery = { ...query, date: { $gte: formatDate(prevStart), $lte: formatDate(prevEnd) } };
      const prevRecords = await Attendance.find(prevQuery);
      const prevSummary = buildAnalytics(prevRecords);
      comparison = {
        currentTotal: summary.totalRecords,
        previousTotal: prevSummary.totalRecords,
        delta: summary.totalRecords - prevSummary.totalRecords,
      };
    }

    res.json({
      totalUsers,
      ...summary,
      period: { startDate: start, endDate: end },
      comparison,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.sendMissedLogoutAlerts = async (req, res) => {
  try {
    const date = req.query.date || getToday();
    const missed = await Attendance.find({
      date,
      loginTime: { $ne: null },
      logoutTime: { $eq: null },
    }).select('user date');

    const userIds = [...new Set(missed.map((m) => String(m.user)))];
    if (userIds.length) {
      await createManyNotifications(userIds, {
        type: 'attendance',
        title: 'Missed logout alert',
        message: `You have no logout recorded for ${date}.`,
        meta: { date },
      });
    }

    await logAudit(req, {
      action: 'send_missed_logout_alerts',
      module: 'attendance',
      targetType: 'attendance',
      targetId: date,
      message: `Missed logout alerts sent for ${date}`,
      changes: { count: userIds.length },
    });

    res.json({ message: 'Missed logout alerts sent', count: userIds.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
