const db = require('../sql');

let board = module.exports = {};

/**
 * Create a board
 * @param {Object} fields
 * @return {Promise}
 */
board.create = function(fields) {
  let { boardName } = fields;
  return db.promisify((r, j) => {
    db.query('INSERT INTO ?? (name) VALUES (?)', ['boards', boardName], function (err, result) {
        if (err) j(err);
        r(result);
      });
  });
};

/**
 * Read a board with defined name
 * @param {String} boardName
 * @param {String} name
 * @return {Promise}
 */
board.read = async function(boardName, name) {
  return db.promisify((r, j) => {
    db.query('SELECT * FROM ?? WHERE name = ? LIMIT 1', ['boards', name], function (err, queryData) {
      if (err) j(err);
      r(typeof queryData !== 'undefined'? queryData[0] || [] : null);
    })
  });
};

board.update = function(boardName, fields) {
  return db.promisify((r, j) => {
    // TODO: Create board.update
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
    r();
  })
};