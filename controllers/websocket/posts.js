const Post = require('../../models/json/post');
const Tools = require('../../helpers/tools');
const Common = require('../common');

module.exports = [
  {
    command: 'POST',
    handler: post
  },
];

async function post(command, message, id, ws, err) {
  let [ boardName, postNumber ] = message.split(':');
  if (!Tools.isNumber(+postNumber)) {
    return err(ws, 404, id);
  }

  let out = await Post.read(boardName, postNumber);
  if (!out || out.length < 1) {
    return err(ws, 404, id);
  }

  Common.removeInfoFromPost(out);
  out = JSON.stringify(out);

  if (id) {
    out += id;
  } else {
    out = command + ' ' + out;
  }
  ws.send(out);
}