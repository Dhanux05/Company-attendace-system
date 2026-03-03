const AuditLog = require('../models/AuditLog');

const getRequestIp = (req) =>
  req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
  req.socket?.remoteAddress ||
  req.ip ||
  '';

const logAudit = async (req, payload) => {
  try {
    if (!req?.user?._id) return;
    await AuditLog.create({
      actor: req.user._id,
      actorRole: req.user.role,
      ip: getRequestIp(req),
      userAgent: req.headers['user-agent'] || '',
      ...payload,
    });
  } catch (err) {
    // Do not break main flows if audit logging fails.
  }
};

module.exports = { logAudit };
