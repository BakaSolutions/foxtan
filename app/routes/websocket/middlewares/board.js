const BoardLogic = require('../../../logic/board');
const ThreadLogic = require('../../../logic/thread');
const PostLogic = require('../../../logic/post');
const CounterModel = require('../../../models/mongo/counter');

const Controller = require('../index');

module.exports = [
  {
    command: 'GET',
    middleware: get
  },
  {
    command: 'BOARD',
    middleware: board
  },
  {
    command: 'COUNT',
    middleware: count
  },
];

async function get(command, message, id, ws) {
  try {
    message = message.split(' ');
    let action = message.shift().toLowerCase();
    let out;

    switch (action) {
      case "boards":
        out = await BoardLogic.readAll();
        break;
      case "lpn":
        out = await CounterModel.read();
        break;
      default:
        return Controller.fail(ws, {status: 404}, id);
    }
    return Controller.success(ws, out, id);
  } catch (e) {
    return Controller.fail(ws, e, id);
  }
}

async function board(command, message, id, ws) {
  try {
    let [board, action, limit, lastReplies, lastRepliesForFixed] = message.split(' ');
    let page, out;

    limit = parseInt(limit);

    switch (action.toLocaleUpperCase()) {
      case "FEED":
        page = limit;
        limit = +lastReplies;
        out = await ThreadLogic.readFeedPage(board, page, limit);
        break;
      default:
        page = parseInt(action);
        lastReplies = parseInt(lastReplies);
        lastRepliesForFixed = parseInt(lastRepliesForFixed);
        out = await ThreadLogic.readPage(board, page, limit, lastReplies, lastRepliesForFixed);
        break;
    }
    return Controller.success(ws, out, id);
  } catch (e) {
    return Controller.fail(ws, e, id);
  }
}

async function count(command, message, id, ws) {
  try {
    let [action, board, limit] = message.split(' ');
    limit = parseInt(limit);
    let out;

    switch (action) {
      case "THREADS":
        out = await ThreadLogic.countPage({board, limit});
        break;
      case "POSTS":
        out = await PostLogic.countPage({board, limit});
    }
    return Controller.success(ws, out, id);
  } catch (e) {
    return Controller.fail(ws, e, id);
  }
}
