const config = require('../../../helpers/config');
const UserLogic = require('../../../logic/user');

const WHITELISTED_URLS = [
  '/api/v1/token.obtain',
  '/api/v1/user.login',
  '/api/v1/user.logout'
];

let isWhitelisted = path => WHITELISTED_URLS.includes(path);

let middleware = app => {
  if (config('cookie.signed')) {
    app.keys = [Buffer.from(config('cookie.secret'))];
  }

  app.use(async (ctx, next) => {
    if (isWhitelisted(ctx.url) || ctx.method === 'OPTIONS') {
      return await next(); // do nothing
    }

    let token = (ctx.headers['X-Access-Token'])
      ? ctx.headers['X-Access-Token']
      : ctx.cookies.get('accessToken', {signed: config('cookie.signed')});

    if (!token) {
      token = await updateTokens(ctx);

      if (!token) {
        token = await createTokens(ctx);
      }
    }

    try {
      ctx.request.token = UserLogic.parseToken(token);
    } catch (e) {
      let message;

      switch (e.message) {
        case 'Token expired':
          token = await updateTokens(ctx);
          ctx.request.token = UserLogic.parseToken(token);
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

async function updateTokens(ctx) {
  let refreshToken = (ctx.headers['X-Refresh-Token'])
      ? ctx.headers['X-Refresh-Token']
      : ctx.cookies.get('refreshToken', {signed: config('cookie.signed')});

  if (!refreshToken) {
    return false;
  }

  let tokens = await UserLogic.refreshTokens(refreshToken);
  await UserLogic.setCookies(ctx, tokens);
  return tokens.accessToken;
}

module.exports = { middleware };
