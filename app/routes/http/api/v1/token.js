const router = require('koa-router')({ prefix: '/api/v1/token.' });

const config = require('../../../../helpers/config');

const Controller = require('../../index');
const UserLogic = require('../../../../logic/user');

router.get('obtain', async ctx => {
  try {
    let token = UserLogic.createToken();
    let out = UserLogic.setToken(ctx, token);
    if (ctx.request.query.redirect) {
      return ctx.redirect(ctx.request.query.redirect);
    }
    return Controller.success(ctx, out);
  } catch (e) {
    return Controller.fail(ctx, e);
  }
});

router.get('renew', async ctx => {
  try {
    let { accessToken } = ctx.request.body;
    let token = (accessToken)
      ? accessToken
      : ctx.cookies.get('accessToken', {signed: config('cookie.signed')});

    token = await UserLogic.refreshToken(token);
    let out = UserLogic.setToken(ctx, token);
    return Controller.success(ctx, out);
  } catch (e) {
    return Controller.fail(ctx, e);
  }
});

module.exports = router;
