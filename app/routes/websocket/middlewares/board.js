const BoardLogic = require('../../../logic/board');
const ThreadLogic = require('../../../logic/thread');
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
  }
];

async function get(command, message, id, ws, next) {
  message = message.split(' ');
  let action = message.shift().toLowerCase();
  switch (action) {
    case "boards":
      return await getBoards(command, message, id, ws, next);
    case "lpn":
      return await getLastPostNumbers(command, message, id, ws, next);
    default:
      return Controller.fail(ws, {status: 404}, id)
  }
}

async function getBoards(command, message, id, ws, next) {
  await BoardLogic.readAll().then(
    out => Controller.success(ws, out, id),
    out => Controller.fail(ws, out, id)
  );
}

async function getLastPostNumbers(command, message, id, ws, next) {
  await CounterModel.read().then(
    out => Controller.success(ws, out, id),
    out => Controller.fail(ws, out, id)
  );
}

async function board(command, message, id, ws) {
  let [board, action, limit, lastReplies, lastRepliesForFixed] = message.split(' ');
  let page;

  switch (action) {
    case "COUNT":
      limit = parseInt(limit);
      return await ThreadLogic.countPage({board, limit}).then(
        out => Controller.success(ws, out, id),
        out => Controller.fail(ws, out, id)
      );
    case "FEED":
      page = +limit;
      return await ThreadLogic.readFeedPage(board, page).then(
        out => Controller.success(ws, out, id),
        out => Controller.fail(ws, out, id)
      );
    default:
      page = +action;
      return await ThreadLogic.readPage(board, page, +limit, lastReplies, lastRepliesForFixed).then(
        out => Controller.success(ws, out, id),
        out => Controller.fail(ws, out, id)
      );
  }
}
