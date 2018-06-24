const config = require('../../../helpers/config');
const UserLogic = require('../../../logic/user');

const URL_TOKEN_OBTAIN = '/api/v1/token.obtain';

let isWhitelisted = path => path.includes(URL_TOKEN_OBTAIN, 0);

let middleware = app => {
  if (config('cookie.signed')) {
    app.keys = [Buffer.from(config('cookie.secret'))];
  }

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

    if (!token) {
      token = await createTokens(ctx);
    }

    try {
      ctx.request.token = UserLogic.parseToken(token);
    } catch (e) {
      let message;

      switch (e.message) {
        case 'Token expired':
          token = await createTokens(ctx);
          break;
        default:
          message = `Cannot parse token: ${e.message}`;
      }

      if (message) {
        throw {
          status: 400,
          message
        };
      }
    }

    await next();
  });
};

async function createTokens(ctx) {
  let tokens = await UserLogic.generateTokens();
  await UserLogic.setCookies(ctx, tokens);
  return tokens.accessToken;
}

module.exports = {
  middleware
};
