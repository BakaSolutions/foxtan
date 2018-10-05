const router = require('koa-router')({ prefix: '/api/v1/token.' });

const config = require('../../../../helpers/config');

const Controller = require('../../index');
const UserLogic = require('../../../../logic/user');

router.get('obtain', async ctx => {
  await UserLogic.createToken()
    .then(token => UserLogic.setToken(ctx, token))
    .then(
      out => {
        if (ctx.request.query.redirect) {
          return ctx.redirect(ctx.request.query.redirect);
        }
        Controller.success(ctx, out);
      },
      out => Controller.fail(ctx, out)
    )
});

router.get('renew', async ctx => {
  let { accessToken } = ctx.request.body;
  let token = (accessToken)
    ? accessToken
    : ctx.cookies.get('accessToken', {signed: config('cookie.signed')});

  await UserLogic.refreshToken(token)
    .then(token => UserLogic.setToken(ctx, token))
    .then(
      out => Controller.success(ctx, out),
      out => Controller.fail(ctx, out)
    )
});

module.exports = router;
