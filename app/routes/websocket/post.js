const PostLogic = require('../../logic/post');

const Controllers = require('./index');

module.exports = [
  {
    command: 'POST',
    handler: post
  },
];

async function post(command, message, id, ws) {
  let [ board, post ] = message.split(':');
  let input = {
    board: board,
    post: +post
  };
  await PostLogic.readOne(input).then(
    out => Controllers.success(ws, out),
    out => Controllers.fail(ws, out)
  );
}
