const db = require('../sql');

let User = module.exports = {};

/**
 * Creates a user
 * @param {Object} fields
 * @return {Promise}
 */
User.create = async function(fields) {
  let { login, password, role } = fields;
  //TODO: Create a validator
  return db.promisify(function (resolve, reject) {
    db.query('INSERT INTO ?? (login, password, role) VALUES (?, ?, ?)',
        ['users', login, password, role], async function (err, result) {
          if (err) return reject(err);
          resolve(result);
        });
  });
};

User.read = async function(login) {
  return db.promisify(function (resolve, reject) {
    db.query('SELECT * FROM ?? WHERE login = ? LIMIT 1', ['users', login], function (err, queryData) {
      if (err) reject(err);
      resolve(
          typeof queryData !== 'undefined'
              ? queryData[0] || []
              : null
      );
    })
  });
};

User.readAll = async function() {
  let query = 'SELECT id, login, role FROM users';
  return db.promisify(function (resolve, reject) {
    db.query(query, function (err, queryData) {
      if (err) {
        reject(err);
      }
      resolve(
        Array.isArray(queryData) && queryData.length > 0 && queryData[0].constructor.name === 'RowDataPacket'
          ? queryData
          : null
      );
    })
  });
};

User.update = async function() {
  return db.promisify(function (resolve, reject) {
    // TODO: Create user.update
  });
};

User.delete = async function(login) {
  return db.promisify(async function (resolve, reject) {
    let userToDelete = await User.read(login),
        out = {ok: 0, exists: typeof userToDelete === 'object' && !Array.isArray(userToDelete)};
    if (!out.exists) {
      return resolve(out);
    }
    db.query('DELETE FROM ?? WHERE `login` = ?', ['users', login], function (err, result) {
      if (err) {
        out.result = err;
        return reject(out);
      }
      out.result = result;
      out.ok = result.affectedRows > 0;
      resolve(out);
    });
  });
};
