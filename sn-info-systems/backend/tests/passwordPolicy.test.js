const test = require('node:test');
const assert = require('node:assert/strict');
const { validatePasswordPolicy } = require('../utils/passwordPolicy');

test('password policy accepts strong password', () => {
  const result = validatePasswordPolicy('Strong@123');
  assert.equal(result.ok, true);
});

test('password policy rejects weak password', () => {
  const result = validatePasswordPolicy('weakpass');
  assert.equal(result.ok, false);
});
