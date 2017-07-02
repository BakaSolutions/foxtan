const db = require('../sql');

let board = module.exports = {};

/**
 * Create a board
 * @param {Object} fields
 * @return {Promise}
 */
board.create = function(fields) {
  let { uri, name } = fields;
  return db.promisify((r, j) => {
    db.query('INSERT INTO ?? (uri, name, posts) VALUES (?, ?, ?)',
        ['boards', uri, name, 0], function (err, result) {
          if (err) j(err);
          r(result);
        });
  });
};

/**
 * Read a board with defined name
 * @param {String} uri
 * @return {Promise}
 */
board.read = async function(uri) {
  return db.promisify((r, j) => {
    db.query('SELECT * FROM ?? WHERE `uri` = ? LIMIT 1', ['boards', uri], function (err, queryData) {
      if (err) j(err);
      r(typeof queryData !== 'undefined'? queryData[0] || [] : null);
    })
  });
};

/**
 * Read all boards
 * @return {Promise}
 */
board.readAll = async function() {
  return db.promisify((r, j) => {
    db.query('SELECT * FROM boards', null, function (err, queryData) {
      if (err) j(err);
      r(queryData);
    })
  });
};

/**
 * Update a board with defined name
 * @param {String} name
 * @param {Object} fields
 * @return {Promise}
 */
board.update = function(name, fields) {
  let { href, boardName } = fields;
  return db.promisify((r, j) => {
    db.query('UPDATE ?? SET `uri`=?, `name`=? WHERE `name`=?',
        ['boards', href, boardName, name], function (err, result) {
          if (err) j(err);
          r(result);
        });
  });
};

/**
 * Delete a board with defined id
 * @param {String} boardName
 * @param {String} password
 * @return {Promise}
 */
board.delete = function(boardName, password) {
  return db.promisify(async (r, j) => {
    db.query('DELETE FROM ?? WHERE `id`=?',
        ['boards', boardName], function (err, result) {
          if (err) j(err);
          r(result);
        });
  })
};
