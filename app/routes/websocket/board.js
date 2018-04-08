const BoardLogic = require('../../logic/board');
const ThreadLogic = require('../../logic/thread');
const CounterModel = require('../../models/mongo/counter');

const Controller = require('./index');

module.exports = [
  {
    command: 'GET',
    handler: get
  },
  {
    command: 'BOARD',
    handler: board
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
  message = message.split(' ');
  let board = message.shift();
  message = message.join('');

  switch (message) {
    case "COUNT":
      return await ThreadLogic.countPage(board).then(
        out => Controller.success(ws, out, id),
        out => Controller.fail(ws, out, id)
      );
    default:
      let page = +message;
      return await ThreadLogic.readPage(board, page).then(
        out => Controller.success(ws, out, id),
        out => Controller.fail(ws, out, id)
      );
  }
}
