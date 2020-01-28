const ThreadLogic = require('../../../logic/thread');

const Controller = require('../index');

module.exports = [
  {
    command: 'THREAD',
    middleware: thread
  },
];

async function thread(command, message, id, ws) {
  try {
    let [ boardName, threadNumber, last ] = message.split(':');
    let out = await ThreadLogic.readOne(boardName, +threadNumber, +last);
    return Controller.success(ws, out, id);
  } catch (e) {
    return Controller.fail(ws, e, id);
  }
}
