const crypto = require('node:crypto');

const Crypto = {};

/**
 * Return a random integer n such that min <= n < max.
 * Requires Node 12.19.0+.
 * @param min
 * @param max
 */
Crypto.randomInt = (min, max) => {
  return crypto.randomInt(min, max);
};

/**
 * Return a random hex with `length` chars
 * @param length
 * @returns {string}
 */
Crypto.randomHex = (length = 4) => {
  const buf = Buffer.alloc(Math.ceil(length / 2));
  return crypto.randomFillSync(buf).toString('hex').slice(0, length);
};

/**
 * Return a random string with `length` chars
 * @param length
 * @returns {string}
 */
Crypto.randomString = (length = 8) => {
  const buf = Buffer.alloc(length);
  return crypto.randomFillSync(buf).toString('base64').slice(0, length);
};

Crypto.createPasswordHash = (password, salt) => {
  return crypto.createHmac('sha256', salt).update(password).digest('hex');
}

module.exports = Crypto;
