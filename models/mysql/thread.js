const db = require('../sql'),
  post = require('./post'),
  board = require('./board'),
  markup = require('../../core/markup');

let thread = module.exports = {};

/**
 * Creates an "original post" (new thread)
 * @param {Object} fields
 * @return {Promise}
 */
thread.create = async function (fields) {
  let { boardName, name, email, subject, tripcode, capcode, text, password, sageru, options } = fields;
  let bodymarkup = text
    ? markup.toHTML(text)
    : null;
  sageru = sageru? 1 : null;
  options = options || 0;
  return db.promisify(function (resolve, reject) {
    db.query('INSERT INTO ?? (name, email, subject, tripcode, capcode, body, bodymarkup, password, sageru, options) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      ['posts_' + boardName, name, email, subject, tripcode, capcode, text, bodymarkup, password, sageru, options], async function(err, result) {
          if (err) return reject(err);
          await board.incrementCounter(boardName);
          resolve(result);
        });
  });
};

/**
 * Reads a thread with defined id
 * @param {String} board
 * @param {Number} id
 * @return {Promise}
 */
thread.read = function(board, id) {
  return db.promisify(function (resolve, reject) {
    db.query('SELECT * FROM ?? WHERE (`id` = ? AND `thread` IS NULL) OR `thread` = ?', ['posts_' + board, id, id], function (err, queryData) {
      if (err) reject(err);
      resolve(queryData);
    })
  });
};

/**
 * Reads all OPs for a board
 * @param {String} board
 * @return {Promise}
 */
thread.readAll = function(board) {
  return db.promisify(function (resolve, reject) {
    db.query('SELECT * FROM ?? WHERE thread IS NULL', ['posts_' + board], function (err, queryData) {
      if (err) reject(err);
      resolve(queryData);
    });
  });
};

thread.readPage = async function(board, offset, limit) {
  return db.promisify(function (resolve, reject) {
    db.query('SELECT * FROM ?? WHERE thread IS NULL ORDER BY bumped_at LIMIT ? OFFSET ?', ['posts_' + board, limit, offset], function (err, queryData) {
      if (err) reject(err);
      resolve(queryData);
    });
  });
};

/**
 * Reads all posts from thread after defined id (including post with id)
 * @param {String} board
 * @param {Number} thread_id
 * @param {Number} post_id
 * @return {Promise}
 */
thread.update = function(board, thread_id, post_id) {
  return db.promisify(function (resolve, reject) {
    db.query('SELECT * FROM ?? WHERE (thread = ? AND id >= ? )', ['posts_' + board, thread_id, post_id], function (err, queryData) {
      if (err) reject(err);
      resolve(queryData);
    })
  });
};

/**
 * Deletes a post or a thread (with its' posts) with defined id
 * @param {String} board
 * @param {Number} id
 * @param {String} password
 * @return {Promise}
 */
thread.delete = function (board, id, password) {
  return db.promisify(async function (resolve, reject) {
    let psto = await post.read(board, id),
        out = {ok: 0, exists: typeof psto === 'object' && !Array.isArray(psto)};
    if (!out.exists) {
      return resolve(out);
    }
    out.isThread = psto['thread'] === null;
    if (password && psto['password'] !== password) {
      return resolve(out);
    }
    db.query('DELETE FROM ?? WHERE (id = ? OR thread = ?)', ['posts_' + board, id, id], function (err, result) {
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

/**
 * Reads all posts (including OP) from thread with defined id
 * @param {String} board
 * @param {Number} id
 * @return {Promise}
 */
thread.regenerateJSON = function(board, id) {
  return db.promisify(function (resolve, reject) {
    db.query('SELECT * FROM ?? WHERE (`id` = ? OR `thread` = ?)', ['posts_' + board, id, id], function (err, queryData) {
      if (err) reject(err);
      resolve(queryData);
    });
  });
};

/*let start = +new Date(); //TODO: tests
for (let i = 0; i < 100000; i++) {
  thread.read('test', 1);
}
console.log(+new Date() - start);*/
