const PostLogic = require('../../logic/post');

const Controller = require('../../helpers/ws.js');

module.exports = [
  {
    command: 'POST',
    middleware: post
  },
];

async function post(command, message, id, ws) {
  try {
    let [ boardName, postNumber ] = message.split(':');
    postNumber = +postNumber;
    let out = await PostLogic.readOne({
      boardName,
      postNumber
    });
    return Controller.success(ws, out, id);
  } catch (e) {
    return Controller.fail(ws, e, id);
  }
}
