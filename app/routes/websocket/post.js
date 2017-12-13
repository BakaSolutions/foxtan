const PostModel = require('../../models/mongo/post');
const Tools = require('../../helpers/tools');

module.exports = [
  {
    command: 'POST',
    handler: post
  },
];

async function post(command, message, id, ws, err) {
  let [ board, post ] = message.split(':');
  post = +post;
  if (typeof board === 'undefined') {
    err(ws, 400, id, 'Board parameter is missed.');
  }
  if (typeof post === 'undefined' || !Tools.isNumber(post)) {
    err(ws, 400, id, 'Post parameter is missed.');
  }
  await PostModel.readOne({
    board: board,
    post: post
  }).then(out => {
    if (out === null) {
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