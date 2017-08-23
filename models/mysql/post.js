const db = require('../sql'),
  board = require('./board'),
  markup = require('../../core/markup');

let Post = module.exports = {};

/**
 * Creates a post
 * @param {Object} fields
 * @return {Promise}
 */
Post.create = async function (fields) {
  let { boardName, threadNumber, name, email, subject, tripcode, capcode, text, password, sageru } = fields;
  sageru = sageru? 1 : null;
  let text_markup = text
    ? markup.toHTML(text)
    : null;
  return db.promisify(function (resolve, reject) {
    db.query('INSERT INTO ?? (thread, name, email, subject, tripcode, capcode,' +
        'body, bodymarkup, password, sageru) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      ['posts_' + boardName, threadNumber, name, email, subject, tripcode, capcode, text, text_markup, password, sageru], async function (err, result) {
          if (err) return reject(err);
          await board.incrementCounter(boardName);
          resolve(result);
        });
  });
};

/**
 * Reads posts
 * @param {String} board
 * @param {Number} id
 * @param {Boolean} withOp
 * @param {String} [order]
 * @param {String} [orderBy]
 * @param {Number} [limit]
 * @param {Number} [offset]
 * @return {Promise}
 */
Post.read = async function (board, id, withOp, order, orderBy, limit, offset) {
  let query = 'SELECT * FROM ?? WHERE ((`id` = ? OR `thread` = ?) AND `thread` IS NOT NULL)';
  if (withOp) query += ' OR (`id` = ? AND `thread` IS NULL)';
  if (order) {
    query += ' ORDER BY ??';
    if (order === 'ASC')  query += ' ASC';
    if (order === 'DESC') query += ' DESC';
  }
  if (limit)  query += ' LIMIT ?';
  if (offset) query += ' OFFSET ?';

  let params = ['posts_' + board, id, id];
  if (withOp) params.push(id);
  if (order) params.push(orderBy);
  if (limit)  params.push(limit);
  if (offset) params.push(offset);
  return db.promisify(function (resolve, reject) {
    db.query(query, params, function (err, queryData) {
      if (err) return reject(err);
      queryData = queryData.map(function (post, i) {
        if (!post.thread) {
          post.thread = post.id;
        }
        return post;
      });
      resolve(queryData || []);
    })
  })
};

/**
 * Reads a post with defined id
 * @param {String} board
 * @param {Number} id
 * @return {Promise}
 */
Post.readOne = async function (board, id) {
  return (await Post.read(board, id, true, null, null, 1))[0] || false;
};

/**
 * Reads last `limit` posts in a `id` thread
 * @param {String} board
 * @param {Number} id
 * @param {Boolean} withOp
 * @param {Number} [limit]
 * @param {Number} [offset]
 * @return {Promise}
 */
Post.readLast = async function (board, id, withOp, limit, offset) {
  let posts = await Post.read(board, id, withOp, 'DESC', 'id', limit, offset);
  return posts.reverse();
};

/**
 * Reads `limit` posts
 * @param {String} board
 * @param {Number} id
 * @param {Boolean} [withOp = true]
 * @param {Number} [limit]
 * @param {Number} [offset]
 * @return {Promise}
 */
Post.readAll = async function (board, id, withOp = true, limit, offset) {
  return await Post.read(board, id, withOp, null, null, limit, offset);
};

Post.countPosts = async function (board, id) {
  return db.promisify(function (resolve, reject) {
    db.query('SELECT count(*) AS postCount FROM ?? WHERE thread = ? OR id = ?', ['posts_' + board, id, id], function (err, queryData) {
      if (err) return reject(err);
      resolve(queryData[0]);
    })
  })
};

Post.countOmitted = async function (board, thread_id, countPosts, lastPostsNumber) {
  let postCount = countPosts || await Post.countPosts(board, thread_id);
  let omitted = postCount.postCount - 1;
  if (lastPostsNumber) omitted -= lastPostsNumber;
  return Math.max(omitted, 0);
};

Post.update = function(board, post_id, fields) {
  return db.promisify(function (resolve, reject) {
    // TODO: Create post.update
  });
};

/**
 * Deletes a post with defined id
 * @param {String} board
 * @param {Number} id
 * @param {String} password
 * @return {Promise}
 */
Post.delete = function (board, id, password) {
  return db.promisify(async function (resolve, reject) {
    let psto = await Post.readOne(board, id),
        out = {ok: 0, exists: typeof psto === 'object' && !Array.isArray(psto)};
    if (!out.exists) {
      return resolve(out);
    }
    out.isPost = psto['thread'] !== null;
    out.thread = psto['thread'];
    if (password && (psto['password'] !== password || !out.isPost)) {
      return resolve(out);
    }
    db.query('DELETE FROM ?? WHERE (`id` = ? AND `thread` IS NOT NULL)', ['posts_' + board, id], function (err, result) {
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

/*let start = +new Date(); //TODO: tests
for (let i = 0; i < 100000; i++) {
  post.read('test', 1);
}
console.log(+new Date() - start);*/
