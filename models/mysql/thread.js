const db = require('../sql'),
  Post = require('./post'),
  markup = require('../../core/markup');

let Thread = module.exports = {};

/**
 * Creates an "original post" (new thread)
 * @param {Object} fields
 * @return {Promise}
 */
Thread.create = async function (fields) {
  fields.bodymarkup = fields.text
      ? markup.toHTML(fields.text)
      : null;
  fields.sageru = fields.sageru
      ? 1
      : null;
  let post = await Post.create(fields);
  if (post.constructor.name !== 'OkPacket') {
    return post;
  }
  let { boardName, unbumpable, locked, sticked, cycled } = fields;
  let thread = await db.promisify(function (resolve, reject) {
    db.query('INSERT INTO ?? (board_name, thread_id, unbumpable, locked, sticked, cycled) VALUES (?, ?, ?, ?, ?, ?)',
        ['threads_' + boardName, boardName, post.insertId, unbumpable, locked, sticked, cycled], async function(err, result) {
          if (err) return reject(err);
          resolve(result);
        });
  });
  return post;
};

/**
 * Reads threads
 * @param {String} board
 * @param {Number} [id]
 * @param {Boolean} [withPosts]
 * @param {Number} [lastPostsNum]
 * @param {Boolean} [withSeparatedOp]
 * @param {String} [order]
 * @param {String} [orderBy]
 * @param {Number} [limit]
 * @param {Number} [offset]
 * @return {Promise}
 */
Thread.read = async function (board, id, withPosts, lastPostsNum, withSeparatedOp, order, orderBy, limit, offset) {
  let query = 'SELECT * FROM ??';
  if (id) query += ' WHERE `thread_id` = ?';
  if (order) {
    query += ' ORDER BY ?';
    if (order === 'ASC')  query += ' ASC';
    if (order === 'DESC') query += ' DESC';
  }
  if (limit)  query += ' LIMIT ?';
  if (offset) query += ' OFFSET ?';

  let params = ['threads_' + board];
  if (id)     params.push(id);
  if (order)  params.push(orderBy);
  if (limit)  params.push(limit);
  if (offset) params.push(offset);
  return db.promisify(function (resolve, reject) {
    db.query(query, params, function (err, queryData) {
      if (err) return reject(err);
      resolve(queryData);
    })
  }).then(async function (threads) {
    if (!threads || !threads.length) {
      return threads;
    }
    if (withPosts) {
      for (let i = 0; i < threads.length; i++) {
        if (withSeparatedOp) {
          let opPost = await Post.readOne(board, threads[i]['thread_id']);
          threads[i].opPost = opPost;
          let posts = await Post.readLast(board, threads[i]['thread_id'], false, lastPostsNum, 1);
          threads[i].lastPosts = posts;
        } else {
          let posts = await Post.readLast(board, threads[i]['thread_id'], true, lastPostsNum);
          threads[i].posts = posts;
        }
      }
    }
    return threads;
  });
};

/**
 * Reads a thread with posts and info by defined id
 * @param {String} board
 * @param {Number} id
 * @param {Boolean} [separatedOp]
 * @param {Number} [lastPostsNum]
 * @return {Promise}
 */
Thread.readOne = async function (board, id, lastPostsNum, separatedOp) {
  return (await Thread.read(board, id, true, lastPostsNum, separatedOp, null, 1))[0] || false;
};

/**
 * Reads all OPs for a board
 * @param {String} board
 * @param {Boolean} [withPosts]
 * @param {Number} [lastPostsNum]
 * @param {String} [order]
 * @param {String} [orderBy]
 * @param {Number} [limit]
 * @param {Number} [offset]
 * @return {Promise}
 */
Thread.readAll = async function (board, withPosts, lastPostsNum, order, orderBy, limit, offset) {
  return await Thread.read(board, null, withPosts, lastPostsNum, true, order, orderBy, limit, offset);
};

Thread.readPage = async function (board, lastPostsNum, limit, offset) {
  return (await Thread.read(board, null, true, lastPostsNum, true, 'DESC', 'updated_at', limit, offset)).reverse();
};

/**
 * Deletes a post or a thread (with its' posts) with defined id
 * @param {String} board
 * @param {Number} id
 * @param {String} password
 * @return {Promise}
 */
Thread.delete = function (board, id, password) {
  return db.promisify(async function (resolve, reject) {
    let psto = await Post.readOne(board, id);
    let out = {ok: 0, exists: typeof psto === 'object' && !Array.isArray(psto)};
    console.log(psto, out);
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

/*let start = +new Date(); //TODO: tests
for (let i = 0; i < 100000; i++) {
  Thread.read('test', 1);
}
console.log(+new Date() - start);*/
