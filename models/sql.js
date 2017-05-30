const mysql = require('mysql'),
  config = require('../helpers/config');

let db = config('db');
module.exports = mysql.createPool({
  host: config(`db.${db}.hostname`),
  user: config(`db.${db}.username`),
  password: config(`db.${db}.password`),
  database: config(`db.${db}.database`)
});

module.exports.catch = function(e) {
  console.log(`[E_SQL] ${e}`);
};
module.exports.promisify = function(f) {
  let p = new Promise((r, j) => {
    f(r, j);
  });
  p.catch(this.catch);
  return p;
};
