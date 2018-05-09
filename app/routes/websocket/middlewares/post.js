const PostLogic = require('../../../logic/post');

const Controller = require('../index');

module.exports = [
  {
    command: 'POST',
    middleware: post
  },
];

async function post(command, message, id, ws) {
  let [ board, post ] = message.split(':');
  let input = {
    board: board,
    post: +post
  };
  await PostLogic.readOne(input).then(
    out => Controller.success(ws, out, id),
    out => Controller.fail(ws, out, id)
  );
}
