const db = require('../sql'),
  board = require('./board'),
  markup = require('../../core/markup');

let post = module.exports = {};

/**
 * Create a post
 * @param {Object} fields
 * @return {Promise}
 */
post.create = async function(fields) {
  let { boardName, threadNumber, name, email, subject, tripcode, capcode, text, password, sageru } = fields;
  sageru = sageru? 1 : null;
  let text_markup = markup.toHTML(text);
  return db.promisify((r, j) => {
    db.query('INSERT INTO ?? (posts_thread, posts_name, posts_email, posts_subject, posts_tripcode, posts_capcode,' +
        'posts_body, posts_bodymarkup, posts_password, posts_sageru) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      ['posts_' + boardName, threadNumber, name, email, subject, tripcode, capcode, text, text_markup, password, sageru], async function (err, result) {
        if (err) j(err);
        await board.incrementCounter(boardName);
        r(result);
      });
  });
};

/**
 * Read a post with defined id
 * @param {String} board
 * @param {Number} id
 * @return {Promise}
 */
post.read = async function(board, id) {
  return db.promisify((r, j) => {
    db.query('SELECT * FROM ?? WHERE posts_id = ? LIMIT 1', ['posts_' + board, id], function (err, queryData) {
      if (err) j(err);
      r(typeof queryData !== 'undefined'? queryData[0] || [] : null);
    })
  });
};

post.update = function(board, thread_id, post_id, fields) {
  return db.promisify((r, j) => {
    // TODO: Create post.update
  });
};

/**
 * Delete a post with defined id
 * @param {String} board
 * @param {Number} id
 * @param {String} password
 * @return {Promise}
 */
post.delete = function(board, id, password) {
  return db.promisify(async (r, j) => {
    let psto = await post.read(board, id),
        out = {ok: 0, exists: typeof psto === 'object' && !Array.isArray(psto)};
    if (!out.exists)
      return r(out);
    out.isPost = psto['posts_thread'] !== null;
    out.thread = psto['posts_thread'];
    if (password && (psto['posts_password'] !== password || !out.isPost))
      return r(out);
    db.query('DELETE FROM ?? WHERE (`posts_id` = ? AND `posts_thread` IS NOT NULL)', ['posts_' + board, id], function (err, result) {
      if (err) {
        out.result = err;
        return j(out);
      }
      out.result = result;
      out.ok = result.affectedRows > 0;
      r(out);
    });
  });
};

/*let start = +new Date(); //TODO: tests
for (let i = 0; i < 100000; i++) {
  post.read('test', 1);
}
console.log(+new Date() - start);*/
