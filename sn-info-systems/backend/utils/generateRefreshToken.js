const jwt = require('jsonwebtoken');

const generateRefreshToken = (id, tokenVersion = 0) => {
  return jwt.sign(
    { id, tokenVersion, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d' }
  );
};

module.exports = generateRefreshToken;
