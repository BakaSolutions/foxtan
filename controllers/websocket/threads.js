const Thread = require('../../models/json/thread');
const Tools = require('../../helpers/tools');
const Common = require('../common');

module.exports = [
  {
    command: 'THREAD',
    handler: thread
  },
];

async function thread(command, message, id, ws, err) {
  let [ boardName, postNumber ] = message.split(':');
  if (!Tools.isNumber(+postNumber)) {
    return err(ws, 404, id);
  }

  let out = await Thread.readOne(boardName, postNumber);
  if (!out || out.length < 1) {
    return err(ws, 404, id);
  }

  for (let i = 0; i < out.posts.length; i++) {
    Common.removeInfoFromPost(out.posts[i]);
  }
  out = JSON.stringify(out);

  if (id) {
    out += id;
  } else {
    out = command + ' ' + out;
  }
  ws.send(out);
}
