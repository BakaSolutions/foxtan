const router = require('koa-router')({ prefix: '/api/v1/token.' });

const config = require('../../../../helpers/config');

const Controller = require('../../index');
const UserLogic = require('../../../../logic/user');

router.get('obtain', async ctx => {
  await UserLogic.generateTokens()
    .then(async tokens => await UserLogic.setCookies(ctx, tokens))
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
  let { refreshToken } = ctx.request.body;
  let token = (refreshToken)
    ? refreshToken
    : ctx.cookies.get('refreshToken', {signed: config('cookie.signed')});

  await UserLogic.refreshTokens(token).then(({accessToken, refreshToken, expires}) => {
    let options = {
      maxAge: expires,
      signed: config('cookie.signed'),
      expires,
      overwrite: true
    };

    ctx.cookies.set('accessToken', accessToken, options);

    options.maxAge = options.expires = config('token.expires.refresh') * 1000;
    ctx.cookies.set('refreshToken', refreshToken, options);

    return {
      accessToken,
      refreshToken,
      expires
    }
  }).then(
    out => Controller.success(ctx, out),
    out => Controller.fail(ctx, out)
  )
});

module.exports = router;
