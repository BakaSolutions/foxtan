const config = require('../../../helpers/config');
const Controller = require('../index');
const UserLogic = require('../../../logic/user');

const URL_TOKEN_OBTAIN = '/api/v1/token.obtain';

let isWhitelisted = path => path.includes(URL_TOKEN_OBTAIN, 0);

let middleware = app => {
  if (config('cookie.signed')) {
    app.keys = [Buffer.from(config('cookie.secret'))];
  }

  app.use(async (ctx, next) => {

    if (isWhitelisted(ctx.url)) {
      return await next();
    }

    let token;

    if (ctx.headers['X-Access-Token']) {
      token = ctx.headers['X-Access-Token'];
    }
    /* else if (ctx.request.body && ctx.request.body.accessToken) {
      token = ctx.request.body.accessToken;
    } */
    else {
      token = ctx.cookies.get('accessToken', {signed: config('cookie.signed')})
    }

    if (!token) {
      if (Controller.isAJAXRequested(ctx)) {
        return ctx.throw(403, {
          message: 'Please, obtain accessToken'
        });
      }
      return ctx.redirect(URL_TOKEN_OBTAIN + "?redirect=" + ctx.url);
    }

    try {
      ctx.request.token = UserLogic.parseToken(token);
    } catch (e) {
      return ctx.throw(403, {
        message: 'Cannot parse token'
      });
    }

    await next();
  });
};

module.exports = {
  middleware
};
