const FS = require('../../helpers/fs'),
    fs = require('fs'),
    db = require('../db/post'),
    thread = require('./thread');

let post = module.exports = {};

/**
 * Append a post to a JSON file
 * @param {Object} fields
 * @return {Object}
 */
post.create = async function(fields) {
  let query = await db.create(fields),
      out = { board: fields['boardName'], post: query['insertId'] };
  query = await db.read(out.board, out.post);
  try {
    let file = FS.readSync(`${out.board}/res/${query[0]['posts_thread']}.json`);
    file = JSON.parse(file);
    Array.prototype.push.apply(file, query);
    FS.writeSync(`${out.board}/res/${out.thread}.json`, JSON.stringify(file));
  } catch (e) {
    await thread.regenerateJSON(out.board, query[0]['posts_thread']);
  }
  return query;
};

/**
 * Read a post from DB
 * @param {String} board
 * @param {Number} post_id
 * @return {Object} query
 */
post.read = async function(board, post_id) {
  //TODO: Read from .json if exists
  let queryData = await db.read(board, post_id);
  if (queryData.length < 1)
    return [];
  let q = queryData[0];
  delete q['posts_sticked'];
  delete q['posts_locked'];
  delete q['posts_cycled'];
  return q;
};

post.update = async function(board, post_id, fields) {
  // TODO: Create post.update
};

/**
 * Delete a post from a JSON file and delete a post from DB
 * @param {String} board
 * @param {Number} post_id
 * @return {Boolean}
 */
post.delete = async function(board, post_id) {
  let query = await db.delete(board, post_id);
  //TODO: Delete post from JSON by picking
  return query;
};

post.regenerateJSON = async function(board, post_id) {
  //TODO
};
