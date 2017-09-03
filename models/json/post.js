const Thread = require('./thread');
const FS = require('../../helpers/fs');
const config = require('../../helpers/config');
const Tools = require('../../helpers/tools');
const db = require('../' + config('db.type') + '/post');

let Post = module.exports = {};

/**
 * Appends a post to a JSON file
 * @param {Object} fields
 * @return {Object}
 */
Post.create = async function(fields) {
  if (!Tools.isNumber(+fields.threadNumber) || !(await Thread.readOne(fields.boardName, fields.threadNumber))) {
    return new Error('This thread doesn\'t exist!');
  }
  let query = await db.create(fields);
  if (!query) {
    return false;
  }
  let out = { board: fields['boardName'], post: query['insertId'] };
  let post = await db.readOne(out.board, out.post);
  delete post.options;

  if (!fields.sageru) {
    await Thread.update(out.board, post.thread, out.post);
  }

  if (config('fs.cache.json')) {
    try {
      let file = FS.readSync(out.board + '/res/' + post.thread + '.json');
      file = JSON.parse(file);
      file.posts.push(post);
      FS.writeSync(out.board + '/res/' + post.thread + '.json', JSON.stringify(file));
    } catch (e) {
      await Thread.regenerateJSON(out.board, post.thread);
    }
  }
  return post;
};

/**
 * Reads a post from DB
 * @param {String} board
 * @param {Number} post_id
 * @return {Object} query
 */
Post.read = async function(board, post_id) {
  //TODO: Read from .json if exists
  let queryData = await db.readOne(board, post_id);
  if (queryData === null || typeof queryData === 'undefined' || !queryData) {
    return [];
  }
  return queryData;
};

Post.update = async function(board, post_id, fields) {
  // TODO: Create post.update
};

/**
 * Deletes a post from a JSON file and delete a post from DB
 * @param {String} board
 * @param {Number} post_id
 * @param {String} password
 * @return {Boolean}
 */
Post.delete = async function(board, post_id, password) {
  let query = await db.delete(board, post_id, password);
  if (query.ok) {
    Thread.regenerateJSON(board, query.thread); //TODO: Delete post from JSON by picking
  }
  return query;
};

Post.regenerate = async function(board, post_id) {
  //TODO: (re)markup
};

Post.countPosts = async function (board, thread, numOnly) {
  let query;
  try {
    query = await db.countPosts(board, thread);
  } catch (e) {
    console.log(e);
  }
  if (numOnly) {
    return query.postCount || 0;
  }
  return query || { postCount: 0 };
};
