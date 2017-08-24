const FS = require('../../helpers/fs');
const config = require('../../helpers/config');
const Tools = require('../../helpers/tools');
const db = require('../' + config('db.type') + '/thread');
const Board = require('../json/board');
const Post = require('../' + config('db.type') + '/post');
let thread = module.exports = {};

/**
 * Create a JSON file with OP
 * @param {Object} fields
 * @return {Object}
 */
thread.create = async function(fields) {
  let query = await db.create(fields);
  if (!query) {
    return false;
  }
  let out = { board: fields['boardName'], thread: query['insertId'] };
  thread = await db.read(out.board, out.thread);
  if (config('fs.cache.json')) {
    FS.writeSync(out.board + '/res/' + out.thread + '.json', JSON.stringify(thread));
  }
  return out;
};

/**
 * Read a JSON file if exists, else returning a data from DB
 * @param {String} board
 * @param {Number} thread_id
 * @return {Object} query
 */
thread.readOne = async function(board, thread_id) {
  let pattern = board + '/res/' + thread_id + '.json', thread;
  if (config('fs.cache.json')) {
    if (FS.existsSync(pattern)) {
      let file = FS.readSync(pattern); //TODO: Read file async
      try {
        thread = JSON.parse(file);
      } catch (e) {
        //
      }
    }
  }
  if (!thread) {
    thread = await db.readOne(board, thread_id, null, false);
  }
  return thread;
};

thread.readPage = async function (board, page) {
  let out = {};
  let limit = config('board.' + board + '.threadsPerPage', config('board.threadsPerPage'));
  let offset = limit * page;
  let lastPostsNum = config('board.' + board + '.lastPostsNumber', config('board.lastPostsNumber'));
  out.threads = await db.readPage(board, lastPostsNum, false, limit, offset);

  let lastPostNumber = await Board.getCounters(board);
  out.lastPostNumber = lastPostNumber[board];
  out.currentPage = page;
  out.pageCount = await thread.pageCount(board, true);
  return out;
};

thread.pageCount = async function (board, numOnly) {
  let limit = config('board.' + board + '.threadsPerPage', config('board.threadsPerPage'));
  let threadCount = await thread.countThreads(board, true);
  let pageCount = Math.floor(threadCount / limit + 1);
  if (numOnly) {
    return pageCount;
  }
  let out = {};
  out.pageCount = pageCount;
  return out;
};

thread.countThreads = async function (board, numOnly) {
  let query = await db.countThreads(board);
  if (numOnly) {
    return query.threadCount || 0;
  }
  return query || { threadCount: 0 };
};

/**
 * Update a JSON file with an info from defined post
 * @param {String} board
 * @param {Number} thread_id
 * @param {Number} post_id
 * @return {Object} query
 */
thread.update = async function(board, thread_id, post_id) {
  let query = await db.update(board, thread_id, post_id);
  if (query.length < 1 || !config('fs.cache.json')) {
    return query;
  }
  let file = FS.readSync(board + '/res/' + thread_id + '.json');
  //TODO: check for existing posts and replace them
  // for now use thread.regenerateJSON()
  file = JSON.parse(file);
  Array.prototype.push.apply(file, query);
  FS.writeSync(board + '/res/' + thread_id + '.json', JSON.stringify(file));
};

/**
 * Create a JSON file forcefully (if it even exists)
 * @param {String} board
 * @param {Number} thread_id
 * @return {Object} query
 */
thread.regenerateJSON = async function(board, thread_id) {
  if (!Tools.isNumber(thread_id)) {
    throw new Error('Trying to regenerate something unexistable!');
  }
  let pattern = 'fs.cache.json';
  if (!config(pattern)) {
    console.log('Ni-paa~! Enable ' + pattern + ' in your config to use this feature.');
    return false;
  }
  let query = await db.readOne(board, thread_id);
  if (query) {
    FS.writeSync(board + '/res/' + thread_id + '.json', JSON.stringify(query));
  }
  return query;
};

/**
 * Delete a JSON file with thread and delete a thread from DB
 * @param {String} board
 * @param {Number} thread_id
 * @param {String} password
 * @return {Boolean}
 */
thread.delete = async function(board, thread_id, password) {
  let query = await db.delete(board, thread_id, password);
  if (query && query.ok/* && query.isThread*/ && config('fs.cache.json')) {
    FS.unlinkSync(board + '/res/' + thread_id + '.json');
  }
  return query;
};
