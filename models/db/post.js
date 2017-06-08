const db = require('../sql');

let post = module.exports = {};

/**
 * Create a post
 * @param {Object} fields
 * @return {Promise}
 */
post.create = function(fields) {
  let { boardName, threadNumber, name, email, subject, tripcode, capcode, text, password, sageru } = fields;
  sageru = sageru? 1 : null;
  return db.promisify((r, j) => {
    db.query('INSERT INTO ?? (posts_thread, posts_name, posts_email, posts_subject, posts_tripcode, posts_capcode,' +
        'posts_body, posts_password, posts_sageru) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      ['posts_' + boardName, threadNumber, name, email, subject, tripcode, capcode, text, password, sageru], function (err, result) {
        if (err) j(err);
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
      r(queryData);
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
    if (password) {
      let psto = await post.read(board, id);
      if (psto['posts_password'] !== psto.password)
        return;
    }
    db.query('DELETE FROM ?? WHERE (`posts_id` = ? AND `posts_thread` IS NOT NULL)', ['posts_' + board, id], function (err, result) {
      if (err) j(err);
      r(result);
    });
  });
};

/*let start = +new Date(); //TODO: tests
for (let i = 0; i < 100000; i++) {
  post.read('test', 1);
}
console.log(+new Date() - start);*/
