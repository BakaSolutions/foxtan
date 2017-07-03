const FS = require('../../helpers/fs'),
    fs = require('fs'),
    db = require('../db/post'),
    thread = require('./thread'),
    config = require('../../helpers/config');

let post = module.exports = {};

/**
 * Append a post to a JSON file
 * @param {Object} fields
 * @return {Object}
 */
post.create = async function(fields)
{
  let query = await db.create(fields),
      out = { board: fields['boardName'], post: query['insertId'] },
      post = await db.read(out.board, out.post);
  delete post['posts_sticked'];
  delete post['posts_locked'];
  delete post['posts_cycled'];
  if (config('fs.cache.json'))
  {
    try
    {
      let file = FS.readSync(`${out.board}/res/${post['posts_thread']}.json`);
      file = JSON.parse(file);
      Array.prototype.push.apply(file, post);
      FS.writeSync(`${out.board}/res/${out.thread}.json`, JSON.stringify(file));
    }
    catch (e)
    {
      await thread.regenerateJSON(out.board, post['posts_thread']);
    }
  }
  return post;
};

/**
 * Read a post from DB
 * @param {String} board
 * @param {Number} post_id
 * @return {Object} query
 */
post.read = async function(board, post_id)
{
  //TODO: Read from .json if exists
  let queryData = await db.read(board, post_id);
  if (queryData === null || typeof queryData === 'undefined' || !queryData)
  {
    return [];
  }
  return queryData;
};

post.update = async function(board, post_id, fields)
{
  // TODO: Create post.update
};

/**
 * Delete a post from a JSON file and delete a post from DB
 * @param {String} board
 * @param {Number} post_id
 * @param {String} password
 * @return {Boolean}
 */
post.delete = async function(board, post_id, password)
{
  let query = await db.delete(board, post_id, password);
  thread.regenerateJSON(board, query.thread); //TODO: Delete post from JSON by picking
  return query;
};

post.regenerate = async function(board, post_id)
{
  //TODO: (re)markup
};
