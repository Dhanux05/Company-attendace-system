const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const User = require('../models/User');

const escapeCsv = (value) => {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (/[,"\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
};

const toCsv = (headers, rows) => {
  const head = headers.join(',');
  const body = rows.map((row) => headers.map((h) => escapeCsv(row[h])).join(',')).join('\n');
  return `${head}\n${body}`;
};

const setCsvHeaders = (res, filename) => {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
};

exports.exportAttendanceCsv = async (req, res) => {
  try {
    const query = {};
    if (req.query.userId) query.user = req.query.userId;
    if (req.query.startDate && req.query.endDate) {
      query.date = { $gte: req.query.startDate, $lte: req.query.endDate };
    } else if (req.query.month && req.query.year) {
      query.date = {
        $gte: `${req.query.year}-${String(req.query.month).padStart(2, '0')}-01`,
        $lte: `${req.query.year}-${String(req.query.month).padStart(2, '0')}-31`,
      };
    }

    const records = await Attendance.find(query).populate('user', 'name email role').sort({ date: -1 }).limit(5000);
    const rows = records.map((r) => ({
      date: r.date,
      name: r.user?.name || '',
      email: r.user?.email || '',
      role: r.user?.role || '',
      status: r.status,
      loginTime: r.loginTime ? new Date(r.loginTime).toISOString() : '',
      logoutTime: r.logoutTime ? new Date(r.logoutTime).toISOString() : '',
      totalHours: r.totalHours,
    }));
    const headers = ['date', 'name', 'email', 'role', 'status', 'loginTime', 'logoutTime', 'totalHours'];
    const csv = toCsv(headers, rows);
    setCsvHeaders(res, `attendance-report-${Date.now()}.csv`);
    res.send(csv);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.exportLeaveCsv = async (req, res) => {
  try {
    const query = {};
    if (req.query.userId) query.user = req.query.userId;
    if (req.query.status) query.status = req.query.status;
    if (req.query.startDate && req.query.endDate) {
      query.$or = [{ startDate: { $lte: req.query.endDate }, endDate: { $gte: req.query.startDate } }];
    }

    const records = await Leave.find(query).populate('user', 'name email').populate('reviewedBy', 'name').sort({ createdAt: -1 }).limit(5000);
    const rows = records.map((r) => ({
      user: r.user?.name || '',
      email: r.user?.email || '',
      leaveType: r.leaveType,
      startDate: r.startDate,
      endDate: r.endDate,
      status: r.status,
      reviewedBy: r.reviewedBy?.name || '',
      reviewedAt: r.reviewedAt ? new Date(r.reviewedAt).toISOString() : '',
      reason: r.reason || '',
      reviewNote: r.reviewNote || '',
    }));
    const headers = ['user', 'email', 'leaveType', 'startDate', 'endDate', 'status', 'reviewedBy', 'reviewedAt', 'reason', 'reviewNote'];
    const csv = toCsv(headers, rows);
    setCsvHeaders(res, `leave-report-${Date.now()}.csv`);
    res.send(csv);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMonthlySummary = async (req, res) => {
  try {
    const year = Number(req.query.year) || new Date().getFullYear();
    const month = Number(req.query.month) || new Date().getMonth() + 1;
    const start = `${year}-${String(month).padStart(2, '0')}-01`;
    const end = `${year}-${String(month).padStart(2, '0')}-31`;

    const attendance = await Attendance.find({ date: { $gte: start, $lte: end } });
    const leaves = await Leave.find({
      $or: [{ startDate: { $lte: end }, endDate: { $gte: start } }],
    });
    const teamCount = await User.countDocuments({ role: 'teamlead', isActive: true });
    const internCount = await User.countDocuments({ role: 'intern', isActive: true });

    const attendanceStats = attendance.reduce(
      (acc, r) => {
        acc[r.status] = (acc[r.status] || 0) + 1;
        return acc;
      },
      { Present: 0, Late: 0, Absent: 0, 'Half Day': 0 }
    );

    const leaveStats = leaves.reduce(
      (acc, l) => {
        acc[l.status] = (acc[l.status] || 0) + 1;
        return acc;
      },
      { Pending: 0, Approved: 0, Rejected: 0 }
    );

    res.json({
      period: { year, month },
      kpis: {
        totalAttendanceRecords: attendance.length,
        totalLeaveRequests: leaves.length,
        totalTeams: teamCount,
        totalInterns: internCount,
      },
      attendanceStats,
      leaveStats,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.exportKpiCsv = async (req, res) => {
  try {
    const year = Number(req.query.year) || new Date().getFullYear();
    const rows = [];
    for (let month = 1; month <= 12; month += 1) {
      const start = `${year}-${String(month).padStart(2, '0')}-01`;
      const end = `${year}-${String(month).padStart(2, '0')}-31`;
      const attendanceCount = await Attendance.countDocuments({ date: { $gte: start, $lte: end } });
      const leaveCount = await Leave.countDocuments({
        $or: [{ startDate: { $lte: end }, endDate: { $gte: start } }],
      });
      rows.push({
        year,
        month,
        attendanceRecords: attendanceCount,
        leaveRequests: leaveCount,
      });
    }
    const headers = ['year', 'month', 'attendanceRecords', 'leaveRequests'];
    const csv = toCsv(headers, rows);
    setCsvHeaders(res, `kpi-summary-${year}.csv`);
    res.send(csv);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
