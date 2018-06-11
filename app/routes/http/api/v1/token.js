const router = require('koa-router')({ prefix: '/api/v1/token.' });

const config = require('../../../../helpers/config');

const Controller = require('../../index');
const UserLogic = require('../../../../logic/user');

router.get('obtain', async ctx => {
  await UserLogic.generateTokens().then(async tokens => {
    if (!Controller.isAJAXRequested(ctx)) {
      return await UserLogic.setCookies(ctx, tokens)
    }
    return tokens;
  }).then(
      out => {
        if (ctx.request.query.redirect) {
          return ctx.redirect(ctx.request.query.redirect);
        }
        Controller.success(ctx, out)
      },
      out => Controller.fail(ctx, out)
  )
});

router.get('check', async ctx => {
  ctx.body = {
    isActive: !!ctx.request.token,
    expires: ctx.request.token
      ? Math.floor(ctx.request.token.exp - (+new Date / 1000))
      : null
  };
});

router.get('renew', async ctx => {
  let { refreshToken } = ctx.request.body;
  let token = (refreshToken)
    ? refreshToken
    : ctx.cookies.get('refreshToken', {signed: config('cookie.signed')});

  await UserLogic.refreshTokens(token).then(({accessToken, refreshToken, expires}) => {
    let cookieExpires = config('token.expires.access') * 1000;
    let options = {
      maxAge: cookieExpires,
      signed: config('cookie.signed'),
      expires: cookieExpires,
      overwrite: true
    };
    if (!Controller.isAJAXRequested(ctx)) {
      if (accessToken) {
        ctx.cookies.set('accessToken', accessToken, options);
      }
      if (refreshToken) {
        options.maxAge = options.expires = config('token.expires.refresh') * 1000;
        ctx.cookies.set('refreshToken', refreshToken, options);
      }
    }
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
