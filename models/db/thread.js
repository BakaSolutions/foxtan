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
thread.create = async function (fields)
{
  let { boardName, name, email, subject, tripcode, capcode, text, password, sageru, sticked, locked, cycled } = fields;
  let text_markup = markup.toHTML(text) || null;
  sageru = sageru? 1 : null;
  return db.promisify(function (resolve, reject)
  {
    db.query('INSERT INTO ?? (posts_name, posts_email, posts_subject, posts_tripcode, posts_capcode, posts_body, posts_bodymarkup, posts_password, posts_sageru, posts_sticked, posts_locked, posts_cycled) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      ['posts_' + boardName, name, email, subject, tripcode, capcode, text, text_markup, password, sageru, sticked, locked, cycled], async function(err, result)
        {
          if (err) reject(err);
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
thread.read = function(board, id)
{
  return db.promisify(function (resolve, reject)
  {
    db.query('SELECT * FROM ?? WHERE (`posts_id` = ? AND `posts_thread` IS NULL) OR `posts_thread` = ?', ['posts_' + board, id, id], function (err, queryData)
    {
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
thread.readAll = function(board)
{
  return db.promisify(function (resolve, reject)
  {
    db.query('SELECT * FROM ?? WHERE posts_thread = NULL', ['posts_' + board], function (err, queryData)
    {
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
thread.update = function(board, thread_id, post_id)
{
  return db.promisify(function (resolve, reject)
  {
    db.query('SELECT * FROM ?? WHERE (posts_thread = ? AND posts_id >= ? )', ['posts_' + board, thread_id, post_id], function (err, queryData)
    {
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
thread.delete = function (board, id, password)
{
  return db.promisify(async (resolve, reject) =>
  {
    let psto = await post.read(board, id),
        out = {ok: 0, exists: typeof psto === 'object' && !Array.isArray(psto)};
    if (!out.exists)
    {
      return resolve(out);
    }
    out.isThread = psto['posts_thread'] === null;
    if (password && psto['posts_password'] !== password)
    {
      return resolve(out);
    }
    db.query('DELETE FROM ?? WHERE (posts_id = ? OR posts_thread = ?)', ['posts_' + board, id, id], function (err, result)
    {
      if (err)
      {
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
thread.regenerateJSON = function(board, id)
{
  return db.promisify(function (resolve, reject)
  {
    db.query('SELECT * FROM ?? WHERE (`posts_id` = ? OR `posts_thread` = ?)', ['posts_' + board, id, id], function (err, queryData)
    {
      if (err) reject(err);
      resolve(queryData);
    });
  });
};

/*let start = +new Date(); //TODO: tests
for (let i = 0; i < 100000; i++)
{
  thread.read('test', 1);
}
console.log(+new Date() - start);*/
