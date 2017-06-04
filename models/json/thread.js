const FS = require('../../helpers/fs'),
  db = require('../db/thread');

let thread = module.exports = {};

/**
 * Create a JSON file with OP
 * @param {Object} fields
 * @return {Object}
 */
thread.create = async function(fields) {
  let query = await db.create(fields);
  let out = { board: fields['boardName'], thread: query['insertId'] };
  query = await db.read(fields['boardName'], query['insertId']);
  console.log(query);
  FS.writeSync(`${out.board}/res/${out.thread}.json`, JSON.stringify(query));
  return out;
};

/**
 * Read a JSON file if exists, else returning a data from DB
 * @param {String} board
 * @param {Number} thread_id
 * @return {Object} query
 */
thread.read = async function(board, thread_id) {
  let pattern = `${board}/res/${thread_id}.json`, query;
  if (FS.existsSync(pattern))
    query = JSON.parse(FS.readSync(pattern)); //TODO: Read file async
  else
    query = await db.read(board, thread_id);
  return query;
};

/**
 * Update a JSON file with an info from defined post
 * @param {String} board
 * @param {Number} thread_id
 * @param {Number} post_id
 * @return {Object} query
 */
thread.update = async function(board, thread_id, post_id) {
  let query = await db.update(board, thread_id, post_id),
      file = FS.readSync(`${board}/res/${thread_id}.json`);
  if (query.length < 1)
    return false;
  //TODO: check for existing posts and replace them
  // for now use thread.recreate()
  file = JSON.parse(file);
  Array.prototype.push.apply(file, query);
  FS.writeSync(`${board}/res/${thread_id}.json`, JSON.stringify(file));
  return query;
};

/**
 * Create a JSON file forcefully (if it even exists)
 * @param {String} board
 * @param {Number} thread_id
 * @return {Object} query
 */
thread.recreate = async function(board, thread_id) {
  let query = await db.recreate(board, thread_id);
  FS.writeSync(`${board}/res/${thread_id}.json`, JSON.stringify(query));
};

/**
 * Delete a JSON file with thread and delete a thread from DB
 * @param {String} board
 * @param {Number} thread_id
 * @return {Boolean}
 */
thread.delete = async function(board, thread_id) {
  let query = await db.delete(board, thread_id);
  FS.unlinkSync(`${board}/res/${thread_id}.json`);
  return query;
};
