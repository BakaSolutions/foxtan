let common = module.exports = {};

const http = require('http');

common.throw = function(res, status, msg) {
  let out = {};
  out.status = status || 500;
  out.error = msg || http.STATUS_CODES[out.status];
  return res.status(out.status).json(out);
};