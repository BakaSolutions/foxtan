const router = require('koa-router')({ prefix: '/api/v1/thread.' });
const config = require('../../../../helpers/config');
const PostModel = require('../../../../models/mongo/post');
const ThreadModel = require('../../../../models/mongo/thread');

/*router.get('read', async (ctx) => {
  let board = ctx.request.query.board;
  if (typeof board === 'undefined') {
    ctx.throw(400, 'Board parameter is missed.');
  }
  let thread = ctx.request.query.thread;
  if (typeof thread === 'undefined') {
    ctx.throw(400, 'Thread parameter is missed.');
  }
  await ThreadModel.readOne({
    board: board,
    thread: thread
  }).then(async out => {
    if (out === null) {
      return ctx.throw(404);
    }

    out.posts = await PostModel.readAll({
      board: board,
      thread: +thread,
      /!*order: 'createdAt',
      orderBy: 'asc',
      limit: null,
      offset: 0*!/
    });

    ctx.body = out;
  }).catch(e => {
    return ctx.throw(500, e);
  });
});*/

module.exports = router;
