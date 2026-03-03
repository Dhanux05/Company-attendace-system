const stores = new Map();

const rateLimit = ({ keyPrefix, windowMs, maxRequests, message }) => {
  return (req, res, next) => {
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || req.socket?.remoteAddress || 'unknown';
    const key = `${keyPrefix}:${ip}`;
    const now = Date.now();
    const existing = stores.get(key);

    if (!existing || now > existing.resetAt) {
      stores.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    existing.count += 1;
    if (existing.count > maxRequests) {
      const retryAfter = Math.ceil((existing.resetAt - now) / 1000);
      res.setHeader('Retry-After', String(Math.max(retryAfter, 1)));
      return res.status(429).json({ message: message || 'Too many requests. Please try again later.' });
    }
    return next();
  };
};

module.exports = { rateLimit };
