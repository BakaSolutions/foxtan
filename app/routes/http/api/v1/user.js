const router = require('koa-router')({ prefix: '/api/v1/user.' });

const config = require('../../../../helpers/config');

const Controller = require('../../index');
const UserLogic = require('../../../../logic/user');

router.post('create', async ctx => {
  try {
    let query = ctx.request.body;

    let out = await UserLogic.create(query);
    Controller.success(ctx, out);
  } catch (e) {
    Controller.fail(ctx, e);
  }
});

router.get('readAll', async ctx => {
  try {
    if (!UserLogic.hasPermission(ctx.request.token, config('permissions.users.manage'))) {
      return ctx.throw(403, {
        message: 'You must be logged as admin to perform this action'
      });
    }
    let out = {
      users: await UserLogic.readAll()
    };
    Controller.success(ctx, out);
  } catch (e) {
    Controller.fail(ctx, e);
  }
});

router.post('login', async ctx => {
  try {
    let query = ctx.request.body;

    let token = await UserLogic.login(query);
    let out = UserLogic.setToken(ctx, token);

    if (query.redirect) {
      return ctx.redirect(query.redirect);
    }
    Controller.success(ctx, out);
  } catch (e) {
    Controller.fail(ctx, e);
  }
});

router.get('logout', async ctx => {
  ctx.cookies.set('accessToken');
  if (ctx.request.query.redirect) {
    return ctx.redirect(ctx.request.query.redirect);
  }
  Controller.success(ctx, 'OK');
});

router.post('delete', async ctx => {
  try {
    let {login} = ctx.request.body;

    let grantedUser = UserLogic.hasPermission(ctx.request.token, config('permissions.users.delete'));
    let out = await UserLogic.deleteOne({login}, !grantedUser);
    Controller.success(ctx, out);
  } catch (e) {
    Controller.fail(ctx, e);
  }
});

module.exports = router;
