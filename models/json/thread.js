const FS = require('../../helpers/fs');
const config = require('../../helpers/config');
const Tools = require('../../helpers/tools');
const db = require('../' + config('db.type') + '/thread');
const Board = require('../json/board');

let Thread = module.exports = {};

/**
 * Create a JSON file with OP
 * @param {Object} fields
 * @return {Object}
 */
Thread.create = async function(fields) {
  let query = await db.create(fields);
  if (!query) {
    return false;
  }
  let out = { board: fields['boardName'], thread: query['insertId'] };
  let thread = await db.read(out.board, out.thread);
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
Thread.readOne = async function(board, thread_id) {
  let thread;
  if (config('fs.cache.json')) {
    let pattern = board + '/res/' + thread_id + '.json';
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

Thread.readPage = async function (board, page) {
  let out = {};
  let limit = config('board.' + board + '.threadsPerPage', config('board.threadsPerPage'));
  let offset = limit * page;
  let lastPostsNum = config('board.' + board + '.lastPostsNumber', config('board.lastPostsNumber'));
  out.threads = await db.readPage(board, lastPostsNum, false, limit, offset);
  if (!out.threads.length) {
    return false;
  }
  let lastPostNumber = await Board.getCounters(board);
  out.lastPostNumber = lastPostNumber[board];
  out.currentPage = page;
  out.pageCount = await Thread.pageCount(board, true);
  return out;
};

Thread.pageCount = async function (board, numOnly) {
  let limit = config('board.' + board + '.threadsPerPage', config('board.threadsPerPage'));
  let threadCount = await Thread.countThreads(board, true);
  let pageCount = threadCount
    ? Math.floor(threadCount / limit + 1)
    : 0;
  if (numOnly) {
    return pageCount;
  }
  let out = {};
  out.pageCount = pageCount;
  return out;
};

Thread.countThreads = async function (board, numOnly) {
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
 * @param {Object} fields
 * @return {Object} query
 */
Thread.update = async function(board, thread_id, fields) {
  let query = await db.update(board, thread_id, fields);
  if (!query || !config('fs.cache.json')) {
    return query;
  }
  //TODO: check for existing posts and replace them
  // for now use Thread.regenerateJSON()
  Thread.regenerateJSON(board, thread_id);
};

/**
 * Create a JSON file forcefully (if it even exists)
 * @param {String} board
 * @param {Number} thread_id
 * @return {Object} query
 */
Thread.regenerateJSON = async function(board, thread_id) {
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
Thread.delete = async function(board, thread_id, password) {
  let query = await db.delete(board, thread_id, password);
  if (query && query.ok/* && query.isThread*/ && config('fs.cache.json')) {
    FS.unlinkSync(board + '/res/' + thread_id + '.json');
  }
  return query;
};
