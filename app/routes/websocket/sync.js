const ThreadModel = require('../../models/mongo/thread');
const Tools = require('../../helpers/tools');

module.exports = [
  {
    command: 'SYNC',
    handler: sync
  },
];

async function sync(command, message, id, ws, err) {
  await ThreadModel.syncData().then(out => {
    if (out === null || !Tools.isObject(out)) {
      return err(ws, 404, id);
    }

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