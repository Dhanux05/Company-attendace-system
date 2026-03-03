const PASSWORD_POLICY_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

const validatePasswordPolicy = (password) => {
  if (!password || typeof password !== 'string') {
    return { ok: false, message: 'Password is required' };
  }
  if (!PASSWORD_POLICY_REGEX.test(password)) {
    return {
      ok: false,
      message: 'Password must be 8+ chars with uppercase, lowercase, number, and special character',
    };
  }
  return { ok: true };
};

module.exports = { validatePasswordPolicy };
