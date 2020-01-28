const router = require('koa-router')({ prefix: '/api/v1/thread.' });

const config = require('../../../../helpers/config');

const Controller = require('../../index');
const ThreadLogic = require('../../../../logic/thread');
const UserLogic = require('../../../../logic/user');

router.post('pin', async ctx => {
  try {
    let query = ctx.request.body;

    let boardName = Object.keys(query)[0];
    let threadNumber = +query[boardName];

    let grantedUser = UserLogic.hasPermission(ctx.request.token, config('permissions.threads.pin'));

    if (!grantedUser) {
      return ctx.throw(403, {
        message: 'You must be logged as admin to perform this action'
      });
    }

    let out = await ThreadLogic.pin(boardName, threadNumber);
    return Controller.success(ctx, out);
  } catch (e) {
    return Controller.fail(ctx, e);
  }
});

module.exports = router;
