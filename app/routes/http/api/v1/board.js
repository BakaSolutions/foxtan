const router = require('koa-router')({ prefix: '/api/v1/board.' });

const config = require('../../../../helpers/config');

const Controller = require('../../index');
const BoardLogic = require('../../../../logic/board');
const UserLogic = require('../../../../logic/user');

router.post('create', async ctx => {
  let query = ctx.request.body;

  let grantedUser = UserLogic.hasPermission(ctx.request.token, config('permissions.boards.manage'));

  if (!grantedUser) {
    return ctx.throw(403, {
      message: 'You must be logged as admin to perform this action'
    });
  }

  await BoardLogic.create(query)
    .then(
      out => Controller.success(ctx, out),
      out => Controller.fail(ctx, out)
    )
});

router.post('delete', async ctx => {
  let query = ctx.request.body;

  let grantedUser = UserLogic.hasPermission(ctx.request.token, config('permissions.boards.manage'));

  if (!grantedUser) {
    return ctx.throw(403, {
      message: 'You must be logged as admin to perform this action'
    });
  }

  await BoardLogic.delete(query)
    .then(
      out => Controller.success(ctx, out),
      out => Controller.fail(ctx, out)
    )
});

module.exports = router;
