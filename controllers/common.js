var common = module.exports = {};

const ERROR_CODES = new Map([
    [400, 'Bad Request'],
    [401, 'Unauthorized'],
    [403, 'Forbidden'],
    [404, 'Not Found'],
    [405, 'Method Not Allowed'],
    [410, 'Gone'],
    [413, 'Request Entity Too Large'],
    [429, 'Too Many Requests'],
    [451, 'Unavailable For Legal Reasons'],
    [500, 'Internal Server Error'],
    [501, 'Not Implemented'],
    [503, 'Service Unavailable'],
]);

common.throw = function(res, status, msg) {
  var out = {};
  out.status = status || 500;
  out.error = msg || ERROR_CODES.get(out.status);
  return res.status(out.status).json(out);
};