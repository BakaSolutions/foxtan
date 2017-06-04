const db = require('../sql');

let thread = module.exports = {};

/**
 * Create an OP
 * @param {Object} fields
 * @return {Promise}
 */
thread.create = function (fields) {
  let { boardName, name, email, subject, tripcode, capcode, text, password, sageru, sticked, locked, cycled } = fields;
  sageru = sageru? 1 : null;
  return db.promisify((r, j) => {
    db.query('INSERT INTO ?? (posts_name, posts_email, posts_subject, posts_tripcode, posts_capcode, posts_body, posts_password, posts_sageru, posts_sticked, posts_locked, posts_cycled) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      ['posts_' + boardName, name, email, subject, tripcode, capcode, text, password, sageru, sticked, locked, cycled], function(err, result) {
        if (err) j(err);
        r(result);
      });
  });
};

/**
 * Read a thread with defined id
 * @param {String} board
 * @param {Number} id
 * @return {Promise}
 */
thread.read = function(board, id) {
  return db.promisify((r, j) => {
    db.query('SELECT * FROM ?? WHERE (`posts_id` = ? AND `posts_thread` IS NULL) OR `posts_thread` = ?', ['posts_' + board, id, id], function (err, queryData) {
      if (err) j(err);
      r(queryData);
    })
  });
};

/**
 * Read all OPs for a board
 * @param {String} board
 * @return {Promise}
 */
thread.readAll = function(board) {
  return db.promisify((r, j) => {
    db.query('SELECT * FROM ?? WHERE posts_thread = NULL', ['posts_' + board], function (err, queryData) {
      if (err) j(err);
      r(queryData);
    });
  });
};

/**
 * Read all posts from thread after defined id (including post with id)
 * @param {String} board
 * @param {Number} thread_id
 * @param {Number} post_id
 * @return {Promise}
 */
thread.update = function(board, thread_id, post_id) {
  return db.promisify((r, j) => {
    db.query('SELECT * FROM ?? WHERE (posts_thread = ? AND posts_id >= ? )', ['posts_' + board, thread_id, post_id], function (err, queryData) {
      if (err) j(err);
      r(queryData);
    })
  });
};

/**
 * Delete a post or a thread (with its' posts) with defined id
 * @param {String} board
 * @param {Number} id
 * @return {Promise}
 */
thread.delete = function (board, id) {
  return db.promisify((r, j) => {
    db.query('DELETE FROM ?? WHERE (posts_id = ? OR posts_thread = ?)', ['posts_' + board, id, id], function (err, result) {
      if (err) j(err);
      r(result);
    });
  });
};

/**
 * Read all posts (including OP) from thread with defined id
 * @param {String} board
 * @param {Number} id
 * @return {Promise}
 */
thread.recreate = function(board, id) {
  return db.promisify((r, j) => {
    db.query('SELECT * FROM ?? WHERE (`posts_id` = ? OR `posts_thread` = ?)', ['posts_' + board, id, id], function (err, queryData) {
      if (err) j(err);
      r(queryData);
    });
  });
};

/*let start = +new Date(); //TODO: tests
for (let i = 0; i < 100000; i++) {
  thread.read('test', 1);
}
console.log(+new Date() - start);*/
