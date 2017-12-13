const crypto = require('crypto');

let Crypto = module.exports = {};

Crypto.verify = function (data, hash, method = 'sha256') {
  if (!~['sha256'].indexOf(method)) {
    return new Error('Wrong cryptographic algo');
  }
  return Crypto[method](data) === hash;
};

Crypto.sha256 = function(data) {
  return crypto.createHash('sha256').update(data).digest("hex");
};
