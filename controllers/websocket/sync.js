const Thread = require('../../models/json/thread');
const Tools = require('../../helpers/tools');

module.exports = [
  {
    command: 'SYNC',
    handler: onSync
  }
];

async function onSync(command, message, id, ws, err) {
  let out = await Thread.syncData();
  if (!Tools.isObject(out)) {
    return err(ws, 404, id);
  }

  out = JSON.stringify(out);

  if (id) {
    out += id;
  } else {
    out = command + ' ' + out;
  }
  ws.send(out);
}
