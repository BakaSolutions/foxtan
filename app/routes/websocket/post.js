const PostModel = require('../../models/mongo/post');
const Tools = require('../../helpers/tools');
const CounterModel = require('../../models/mongo/counter');

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
  }).then(async out => {
    if (out === null) {
      let counter = await CounterModel.readOne(board);
      let wasPosted = (id <= counter);
      return err(ws, wasPosted ? 410 : 404, id);
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