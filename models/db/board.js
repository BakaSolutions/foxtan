const db = require('../sql'),
  Tools = require('../../helpers/tools');

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
 * Read a board with defined uri
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
 * @param {String} boardNameOld
 * @param {Object} fields
 * @return {Promise}
 */
board.update = function(boardNameOld, fields) {
  let { href, boardName } = fields;
  return db.promisify((r, j) => {
    db.query('UPDATE ?? SET `uri`=?, `name`=? WHERE `name`=?',
        ['boards', href, boardName, boardNameOld], function (err, result) {
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
  return db.promisify((r, j) => {
    db.query('DELETE FROM ?? WHERE `name`=? AND `password`=?',
        ['boards', boardName, password], function (err, result) {
          if (err) j(err);
          r(result);
        });
  })
};

/**
 * Increment a post counter of a board with defined uri
 * @param {String} boardName
 * @param {Number} counter
 * @param {Boolean} positiveSign
 * @return {Promise}
 */
board.incrementCounter = function(boardName, counter = 1, positiveSign = true) {
  return db.promisify((r, j) => {
    if (!Tools.isNumber(counter))
      counter = 1;
    let s = positiveSign? '+' : '-';
    db.query(`UPDATE ?? SET posts = posts ${s} ? WHERE \`uri\`=?`,
      ['boards', counter, boardName], function (err, result) {
        if (err) j(err);
        r(result);
      });
  })
};

/**
 * Get number of posts of a board with defined uri
 * @param {String, Array} boardNames
 * @return {Promise}
 */
board.getCounters = async function(boardNames) {
  if (typeof boardNames === 'undefined') {
    boardNames = await board.readAll();
    boardNames = boardNames.map(function(board) {
      return board.uri;
    })
  }
  if (!Array.isArray(boardNames))
    boardNames = [ boardNames ];
  let query = 'SELECT uri, posts FROM ?? WHERE',
    qArray = ['boards'];
  for (let i = 0; i < boardNames.length; i++) {
    qArray.push(boardNames[i]);
    if (i !== 0) query += ' OR ';
    query += '`uri` = ?'
  }
  return db.promisify((r, j) => {
    db.query(query, qArray, function (err, result) {
        if (err) j(err);
        result = result.map(function(board) {
          let o = {};
          o[board.uri] = board.posts;
          return o;
        });
        r(result);
      });
  })
};
