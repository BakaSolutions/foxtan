const FS = require('../../helpers/fs'),
    db = require('../db/thread'),
    config = require('../../helpers/config');

let thread = module.exports = {};

/**
 * Create a JSON file with OP
 * @param {Object} fields
 * @return {Object}
 */
thread.create = async function(fields)
{
  let query = await db.create(fields);
  let out = { board: fields['boardName'], thread: query['insertId'] };
  thread = await db.read(out.board, out.thread);
  if (config('fs.cache.json'))
  {
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
thread.read = async function(board, thread_id)
{
  let pattern = board + '/res/' + thread_id + '.json', thread;
  if (config('fs.cache.json'))
  {
    if (FS.existsSync(pattern))
    {
      let file = FS.readSync(pattern); //TODO: Read file async
      try
      {
        thread = JSON.parse(file);
      }
      catch (e)
      {
        //
      }
    }
  }
  if (!thread)
  {
    thread = await db.read(board, thread_id);
  }
  return thread;
};

/**
 * Update a JSON file with an info from defined post
 * @param {String} board
 * @param {Number} thread_id
 * @param {Number} post_id
 * @return {Object} query
 */
thread.update = async function(board, thread_id, post_id)
{
  let query = await db.update(board, thread_id, post_id);
  if (query.length < 1 || !config('fs.cache.json'))
  {
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
thread.regenerateJSON = async function(board, thread_id)
{
  let pattern = 'fs.cache.json';
  if (!config(pattern))
  {
    console.log('Ni-paa~! Enable ' + pattern + ' in your config to use this feature.');
    return false;
  }
  let query = await db.regenerateJSON(board, thread_id);
  FS.writeSync(board + '/res/' + thread_id + '.json', JSON.stringify(query));
  return query;
};

/**
 * Delete a JSON file with thread and delete a thread from DB
 * @param {String} board
 * @param {Number} thread_id
 * @param {String} password
 * @return {Boolean}
 */
thread.delete = async function(board, thread_id, password)
{
  let query = await db.delete(board, thread_id, password);
  if (query.ok && query.isThread && config('fs.cache.json'))
  {
    FS.unlinkSync(board + '/res/' + thread_id + '.json');
  }
  return query;
};
