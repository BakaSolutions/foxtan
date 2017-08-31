const Board = require('../../models/json/board');
const Thread = require('../../models/json/thread');
const Tools = require('../../helpers/tools');
const Common = require('../common');

module.exports = [
  {
    command: 'GET',
    handler: get
  },
  {
    command: 'BOARD',
    handler: board
  },
];

async function get(command, message, id, ws, err) {
  let out;
  switch (message) {
    case "BOARDS":
      out = await Board.readAll(false);
      out = JSON.stringify(out);
      break;
    case "LPN":
      out = await Board.getCounters();
      break;
    default:
      return err(ws, 404, id);
      break;
  }

  if (id) {
    out += id;
  } else {
    out = command + ' ' + out;
  }
  ws.send(out);
}

async function board(command, message, id, ws, err) {
  let out;
  message = message.split(' ');
  let board = message.shift();
  message = message.join('');

  switch (message) {
    case "COUNT":
      out = await Thread.pageCount(board, false);
      if (!Tools.isObject(out)) {
        return err(ws, 404, id);
      }
      break;
    default:
      let page = +message;
      if (!Tools.isNumber(+page)) {
        return err(ws, 404, id);
      }
      out = await Thread.readPage(board, page);
      if (!Tools.isObject(out)) {
        return err(ws, 404, id);
      }
      for (let i = 0; i < out.threads.length; i++) {
        for (let j = 0; j < out.threads[i].lastPosts.length; j++) {
          Common.removeInfoFromPost(out.threads[i].lastPosts[j]);
        }
        if (out.threads[i].opPost) {
          Common.removeInfoFromPost(out.threads[i].opPost);
        }
      }
      break;
  }

  out = JSON.stringify(out);
  if (id) {
    out += id;
  } else {
    out = command + ' ' + out;
  }
  ws.send(out);
}