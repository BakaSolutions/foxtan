const router = require('koa-router')({ prefix: '/api/v1/thread.' });

const config = require('../../../../helpers/config');

const Controller = require('../../index');
const ThreadLogic = require('../../../../logic/thread');
const UserLogic = require('../../../../logic/user');

router.post('pin', async ctx => {
  let query = ctx.request.body;

  let board = Object.keys(query)[0];
  let thread = query[board];

  let grantedUser = UserLogic.hasPermission(ctx.request.token, config('permissions.threads.pin'));

  if (!grantedUser) {
    return ctx.throw(403, {
      message: 'You must be logged as admin to perform this action'
    });
  }

  await ThreadLogic.pin(board, +thread)
    .then(
      out => Controller.success(ctx, out),
      out => Controller.fail(ctx, out)
    )
});

module.exports = router;
