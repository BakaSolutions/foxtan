const crypto = require('crypto');
const crc = require('crc');

let Crypto = module.exports = {};

Crypto.verify = function (data, hash, method = 'sha256') {
  method = method.toLowerCase();
  if (!(['sha256', 'crc32'].includes(method))) {
    return new Error('Wrong cryptographic algo');
  }
  return Crypto[method](data) === hash;
};

Crypto.sha256 = data => crypto.createHash('sha256').update(data).digest("hex");

Crypto.crc32 = data => crc.crc32(data).toString(16);
