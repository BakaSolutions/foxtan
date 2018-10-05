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
      token = await updateToken(ctx);

      if (!token) {
        token = await createToken(ctx);
      }
    }

    try {
      ctx.request.token = UserLogic.parseToken(token);
    } catch (e) {
      let message;

      switch (e.message) {
        case 'Token expired':
          token = await updateToken(ctx);
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

async function createToken(ctx) {
  let token = await UserLogic.generateToken();
  UserLogic.setCookies(ctx, token);
  return token.accessToken;
}

async function updateToken(ctx) {
  let token = (ctx.headers['X-Access-Token'])
      ? ctx.headers['X-Access-Token']
      : ctx.cookies.get('accessToken', {signed: config('cookie.signed')});

  if (!token) {
    return false;
  }

  token = await UserLogic.refreshToken(token);
  UserLogic.setCookies(ctx, token);
  return token.accessToken;
}

module.exports = { middleware };
