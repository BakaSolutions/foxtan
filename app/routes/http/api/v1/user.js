const router = require('koa-router')({ prefix: '/api/v1/user.' });

const config = require('../../../../helpers/config');

const Controller = require('../../index');
const UserLogic = require('../../../../logic/user');

router.post('create', async ctx => {
  try {
    let { login, password } = ctx.request.body;

    let out = await UserLogic.create({ login, password });
    return Controller.success(ctx, out)
  } catch (e) {
    return Controller.fail(ctx, e);
  }
});

router.get('readAll', async ctx => {
  try {
    if (!UserLogic.hasPermission(ctx.request.token, config('permissions.users.manage'))) {
      return ctx.throw(403, {
        message: 'You must be logged as admin to perform this action'
      });
    }
    let out = await UserLogic.readAll();
    return Controller.success(ctx, out)
  } catch (e) {
    return Controller.fail(ctx, e);
  }
});

router.post('login', async ctx => {
  try {
    let { login, password, redirect } = ctx.request.body;

    let token = await UserLogic.login({ login, password });
    let out = UserLogic.setToken(ctx, token);

    if (redirect) {
      return ctx.redirect(redirect);
    }

    return Controller.success(ctx, out);
  } catch (e) {
    return Controller.fail(ctx, e);
  }
});

router.get('logout', async ctx => {
  ctx.cookies.set('accessToken', null);
  Controller.success(ctx, 'OK');
});

router.post('delete', async ctx => {
  try {
    let { body: { login }, token } = ctx.request;

    let grantedUser = UserLogic.hasPermission(token, config('permissions.users.delete'));

    let out = await UserLogic.deleteOne({ login }, !grantedUser);
    return Controller.success(ctx, out);
  } catch (e) {
    return Controller.fail(ctx, e);
  }
});

module.exports = router;
