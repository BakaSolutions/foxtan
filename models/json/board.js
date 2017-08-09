const config = require('../../helpers/config');
const Tools = require('../../helpers/tools');
const db = require('../' + config('db.type') + '/board');

let boards = [];

function clearBoardsCache() {
  boards = [];
}

config.on('board', clearBoardsCache);
config.on('boards', clearBoardsCache);

let Board = module.exports = {};

/**
 * Creates a board entry
 * @param {Object} fields
 * @return {Object} -- a board entry
 */
Board.create = async function (fields) {
  // uri, title, subtitle, hidden
  let query = await db.create(fields);
  if (!query) {
    return false;
  }

  // other
  let settings = Tools.merge(config('board'), config('boards.' + fields.uri));
  let board = Tools.merge(fields, settings);
  return boards[fields.uri] = Tools.sortObject(board);
};

/**
 * Reads a board entry with defined boardName
 * @param {String} boardName
 * @return {Object} -- a board entry
 * @return false -- if a board doesn't exist
 */
Board.read = async function (boardName) {
  // TODO: read a board entry from `boards`
  let queryData = await db.read(boardName);
  if (!queryData) {
    return false;
  }
  let settings = Tools.merge(config('board'), config('boards.' + boardName));
  let board = Tools.merge(queryData, settings);
  return boards[boardName] = Tools.sortObject(board);
};

/**
 * Reads all board entries
 * @param {Boolean} includeHidden
 * @return {Array} -- board entries
 */
Board.readAll = async function (includeHidden) {
  if (boards.length > 1) {
    if (includeHidden) {
      return boards;
    }
    return boards.filter(function(board) {
      return (!!board.hidden) === false;
    });
  }
  let queryData = await db.readAll(includeHidden);
  if (!queryData) {
    return [];
  }
  return boards = queryData.map(function(board) {
    let settings = Tools.merge(config('board'), config('boards.' + board.uri));
    board = Tools.merge(board, settings);
    return Tools.sortObject(board);
  });
};

/**
 * Updates a board with defined name
 * @param {String} boardNameOld
 * @param {Object} fields
 * @return {Object}
 */
Board.update = async function (boardNameOld, fields) {
  let query = await db.update(arguments);
  if (query) {
    boards[boardNameOld] = null;
  }
  return query;
};

/**
 * Deletes a board with defined boardName
 * @param {String} boardName
 * @param {String} [password]
 * @return {Object}
 */
Board.delete = async function (boardName, password) {
  let query = await db.delete(arguments);
  if (query) {
    boards[boardName] = null;
  }
  return query;
};

/**
 * Increments a post counter of a board with defined boardName
 * @param {String} boardName
 * @param {Number} counter
 * @return {Object}
 * @return false -- if a DB error
 */
Board.incrementCounter = async function(boardName, counter = 1) {
  let query = await db.incrementCounter(arguments);
  if (!query) {
    return false;
  }
  if (boards[boardName] && typeof boards[boardName].posts !== 'undefined') {
    boards[boardName] += counter;
  }
  return query;
};

/**
 * Gets number of posts of a board with defined boardNames
 * @param {String, Array} [boardNames]
 * @return {Object}
 */
Board.getCounters = async function (boardNames) {
  if (typeof boardNames === 'undefined') {
    boardNames = await Board.readAll();
    boardNames = boardNames.map(function(board) {
      return board.uri;
    })
  }
  let counters = await db.getCounters(boardNames);
  return Tools.sortObject(counters);
};
