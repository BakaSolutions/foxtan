const ThreadLogic = require('../../../logic/thread');

const Controller = require('../index');

module.exports = [
  {
    command: 'THREAD',
    middleware: thread
  },
];

async function thread(command, message, id, ws) {
  let [ board, thread, last ] = message.split(':');

  await ThreadLogic.readOne(board, +thread, +last).then(
    out => Controller.success(ws, out, id),
    out => Controller.fail(ws, out, id)
  );
}
