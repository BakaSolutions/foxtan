const ThreadLogic = require('../../logic/thread');

const Controller = require('../../helpers/ws.js');

module.exports = [
  {
    command: 'SYNC',
    middleware: sync
  },
];

async function sync(command, message, id, ws) {
  await ThreadLogic.syncData().then(
    out => Controller.success(ws, out, id),
    out => Controller.fail(ws, out, id)
  );
}