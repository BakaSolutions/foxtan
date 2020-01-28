const router = require('koa-router')({ prefix: '/api/v1/board.' });

const config = require('../../../../helpers/config');

const Controller = require('../../index');
const BoardLogic = require('../../../../logic/board');
const UserLogic = require('../../../../logic/user');

router.post('create', async ctx => {
  try {
    let query = ctx.request.body;

    let grantedUser = UserLogic.hasPermission(ctx.request.token, config('permissions.boards.manage'));

    if (!grantedUser) {
      return ctx.throw(403, {
        message: 'You must be logged as admin to perform this action'
      });
    }

    let out = await BoardLogic.create(query);
    return Controller.success(ctx, out);
  } catch (e) {
    return Controller.fail(ctx, e);
  }
});

router.post('delete', async ctx => {
  try {
    let query = ctx.request.body;

    let grantedUser = UserLogic.hasPermission(ctx.request.token, config('permissions.boards.manage'), query.boardName);

    if (!grantedUser) {
      return ctx.throw(403, {
        message: 'You must be logged as admin to perform this action'
      });
    }

    let out = await BoardLogic.delete(query);
    return Controller.success(ctx, out);
  } catch (e) {
    return Controller.fail(ctx, e);
  }
});

module.exports = router;
