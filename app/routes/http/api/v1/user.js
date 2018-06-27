const router = require('koa-router')({ prefix: '/api/v1/user.' });

const config = require('../../../../helpers/config');

const Controller = require('../../index');
const UserLogic = require('../../../../logic/user');

router.post('create', async ctx => {
  let query = ctx.request.body;

  await UserLogic.create(query)
    .then(
      out => Controller.success(ctx, out),
      out => Controller.fail(ctx, out)
    )
});

router.get('readAll', async ctx => {
  if (!UserLogic.hasPermission(ctx.request.token, config('permissions.users.manage'))) {
    return ctx.throw(403, {
      message: 'You must be logged as admin to perform this action'
    });
  }
  await UserLogic.readAll()
    .then(
      out => Controller.success(ctx, out),
      out => Controller.fail(ctx, out)
    )
});

router.post('login', async ctx => {
  let query = ctx.request.body;

  await UserLogic.login(query)
    .then(async tokens => await UserLogic.setCookies(ctx, tokens))
    .then(
      out => {
        if (query.redirect) {
          return ctx.redirect(query.redirect);
        }
        Controller.success(ctx, out)
      },
      out => Controller.fail(ctx, out)
    )
});

router.get('logout', async ctx => {
  ctx.cookies.set('accessToken');
  ctx.cookies.set('refreshToken');

  let out = 'OK';

  Controller.success(ctx, out);
});

router.post('delete', async ctx => {
  let { login } = ctx.request.body;

  let grantedUser = UserLogic.hasPermission(ctx.request.token, config('permissions.users.delete'));

  await UserLogic.deleteOne({ login }, !grantedUser).then(
    out => Controller.success(ctx, out),
    out => Controller.fail(ctx, out)
  )
});

module.exports = router;
