const ThreadLogic = require('../../logic/thread');

const Controllers = require('./index');

module.exports = [
  {
    command: 'THREAD',
    handler: thread
  },
];

async function thread(command, message, id, ws) {
  let [ board, thread, last ] = message.split(':');

  await ThreadLogic.readOne(board, +thread, +last).then(
    out => Controllers.success(ws, out, id),
    out => Controllers.fail(ws, out, id)
  );
}
