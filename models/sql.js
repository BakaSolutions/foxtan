const mysql = require('mysql'),
  config = require('../helpers/config');

let db = config('db');

module.exports = mysql.createPool({
  host: config('db.' + db + '.hostname'),
  user: config('db.' + db + '.username'),
  password: config('db.' + db + '.password'),
  database: config('db.' + db + '.database')
});

/**
 * Catches all SQL errors ang log them if they are non-blacklisted
 * @param error
 */
module.exports.catch = function(error) {
  if(!config('log.db.noerr').test(error.code)) {
    console.log('[E_SQL] ' + error);
    return Promise.reject(error);
  }
};

/**
 * Creates a promise for a query to catch SQL errors
 * @param func
 * @returns {Promise}
 */
module.exports.promisify = function(func) {
  let p = new Promise(function (resolve, reject) {
    func(resolve, reject);
  });
  let self = this;

  return p.catch(function (err) {
    return self.catch(err)
  });
};
