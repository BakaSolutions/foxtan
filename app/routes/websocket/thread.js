const ThreadModel = require('../../models/mongo/thread');
const PostModel = require('../../models/mongo/post');
const CounterModel = require('../../models/mongo/counter');
const Tools = require('../../helpers/tools');

module.exports = [
  {
    command: 'THREAD',
    handler: thread
  },
];

async function thread(command, message, id, ws, err) {
  let [ board, thread ] = message.split(':');
  thread = +thread;
  if (typeof board === 'undefined') {
    err(ws, 400, id, 'Board parameter is missed.');
  }
  if (typeof thread === 'undefined' || !Tools.isNumber(thread)) {
    err(ws, 400, id, 'Thread parameter is missed.');
  }
  await ThreadModel.readOne({
    board: board,
    thread: thread
  }).then(async out => {
    if (out === null) {
      let counter = await CounterModel.readOne(board);
      let wasPosted = (id <= counter);
      return err(ws, wasPosted ? 410 : 404, id);
    }
    out.posts = await PostModel.readAll({
      board: board,
      thread: +thread
    });
    out.lastPostNumber = await ThreadModel.getCounters({
      boards: board,
      threads: +thread
    });
    return out;
  }).then(out => {

    out = JSON.stringify(out);

    if (id) {
      out += id;
    } else {
      out = command + ' ' + out;
    }
    ws.send(out);

  }).catch(e => {
    return err(ws, 500, id, e);
  });
}