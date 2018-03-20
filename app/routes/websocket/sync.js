const ThreadLogic = require('../../logic/thread');

const Controllers = require('./index');

module.exports = [
  {
    command: 'SYNC',
    handler: sync
  },
];

async function sync(command, message, id, ws) {
  await ThreadLogic.syncData().then(
    out => Controllers.success(ws, out, id),
    out => Controllers.fail(ws, out, id)
  );
}