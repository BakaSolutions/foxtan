const crypto = require('crypto');
const FS = require('./fs');
const crc = require('crc');
let Crypto = module.exports = {};

Crypto.verify = function (data, hash, method = 'sha256') {
  method = method.toLowerCase();
  if (['sha256', 'crc32'].indexOf(method) === -1) {
    return new Error('Wrong cryptographic algo');
  }
  return Crypto[method](data) === hash;
};

Crypto.sha256 = data => crypto.createHash('sha256').update(data).digest("hex");

Crypto.crc32 = async (data, file) => {
  if (file) {
    data = await FS.readFile(data, null);
  }
  return crc.crc32(data).toString(16);
};