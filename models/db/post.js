const db = require('../sql'),
  board = require('./board'),
  markup = require('../../core/markup');

let post = module.exports = {};

/**
 * Creates a post
 * @param {Object} fields
 * @return {Promise}
 */
post.create = async function(fields)
{
  let { boardName, threadNumber, name, email, subject, tripcode, capcode, text, password, sageru } = fields;
  sageru = sageru? 1 : null;
  let text_markup = markup.toHTML(text);
  return db.promisify(function (resolve, reject)
  {
    db.query('INSERT INTO ?? (posts_thread, posts_name, posts_email, posts_subject, posts_tripcode, posts_capcode,' +
        'posts_body, posts_bodymarkup, posts_password, posts_sageru) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      ['posts_' + boardName, threadNumber, name, email, subject, tripcode, capcode, text, text_markup, password, sageru], async function (err, result)
        {
          if (err) reject(err);
          await board.incrementCounter(boardName);
          resolve(result);
        });
  });
};

/**
 * Reads a post with defined id
 * @param {String} board
 * @param {Number} id
 * @return {Promise}
 */
post.read = async function(board, id)
{
  return db.promisify(function (resolve, reject)
  {
    db.query('SELECT * FROM ?? WHERE posts_id = ? LIMIT 1', ['posts_' + board, id], function (err, queryData)
    {
      if (err) reject(err);
      resolve(typeof queryData !== 'undefined'? (queryData[0] || []) : null);
    })
  });
};

post.update = function(board, thread_id, post_id, fields)
{
  return db.promisify(function (resolve, reject)
  {
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
post.delete = function(board, id, password)
{
  return db.promisify(async (resolve, reject) =>
  {
    let psto = await post.read(board, id),
        out = {ok: 0, exists: typeof psto === 'object' && !Array.isArray(psto)};
    if (!out.exists)
    {
      return resolve(out);
    }
    out.isPost = psto['posts_thread'] !== null;
    out.thread = psto['posts_thread'];
    if (password && (psto['posts_password'] !== password || !out.isPost))
    {
      return resolve(out);
    }
    db.query('DELETE FROM ?? WHERE (`posts_id` = ? AND `posts_thread` IS NOT NULL)', ['posts_' + board, id], function (err, result)
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

/*let start = +new Date(); //TODO: tests
for (let i = 0; i < 100000; i++)
{
  post.read('test', 1);
}
console.log(+new Date() - start);*/
