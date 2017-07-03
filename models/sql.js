const mysql = require('mysql'),
  config = require('../helpers/config');

let db = config('db');
module.exports = mysql.createPool(
{
  host: config(`db.${db}.hostname`),
  user: config(`db.${db}.username`),
  password: config(`db.${db}.password`),
  database: config(`db.${db}.database`)
});

module.exports.catch = function(e)
{
  if(!config('log.db.noerr').test(e.code))
  {
    console.log(`[E_SQL] ${e}`);
  }
};

module.exports.promisify = function(func)
{
  let p = new Promise(function (resolve, reject)
  {
    func(resolve, reject);
  });
  p.catch(function (error)
  {
    this.catch(error)
  });
  return p;
};
