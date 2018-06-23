const config = require('../../../helpers/config');
const Controller = require('../index');
const UserLogic = require('../../../logic/user');

const URL_TOKEN_OBTAIN = '/api/v1/token.obtain';

let isWhitelisted = path => path.includes(URL_TOKEN_OBTAIN, 0);

let middleware = app => {
  if (config('cookie.signed')) {
    app.keys = [Buffer.from(config('cookie.secret'))];
  }

  /**
   * GET
   * +  JS:
   * +    obtain token before request, error if there's no token
   * +  Non-JS:
   * +    obtain token in a request

   * POST
   *   error if there's no token
   *
   * +OPTIONS
   * +  do nothing
   */

  app.use(async (ctx, next) => {

    if (isWhitelisted(ctx.url) || ctx.method === 'OPTIONS') {
      return await next(); // do nothing
    }

    let token;

    if (ctx.headers['X-Access-Token']) {
      token = ctx.headers['X-Access-Token'];
    } else {
      token = ctx.cookies.get('accessToken', {signed: config('cookie.signed')})
    }

    if (!token && ctx.method === 'GET') {
      if (Controller.isAJAXRequested(ctx)) {
        throw {
          status: 403,
          message: `Please, obtain accessToken: ${URL_TOKEN_OBTAIN}`
        };
      }
      return ctx.redirect(URL_TOKEN_OBTAIN + "?redirect=" + ctx.url);
    }

    try {
      ctx.request.token = UserLogic.parseToken(token);
    } catch (e) {
      if (ctx.method !== 'POST') {
        throw {
          status: 400,
          message: 'Cannot parse token'
        };
     }
    }

    await next();
  });
};

module.exports = {
  middleware
};
