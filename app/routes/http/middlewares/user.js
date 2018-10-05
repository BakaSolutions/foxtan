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
    if (isWhitelisted(ctx.url)) {
      return await next(); // do nothing
    }

    let token = getToken(ctx);

    if (!token) {
      token = await updateToken(ctx);

      if (!token) {
        token = await createToken(ctx);
      }
    }

    try {
      ctx.request.token = UserLogic.parseJWT(token);
    } catch (e) {
      let message;

      switch (e.message) {
        case 'Token expired':
          token = await updateToken(ctx, token, true);
          ctx.request.token = UserLogic.parseJWT(token);
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

function getToken(ctx) {
  return ctx.headers['X-Access-Token']
    || ctx.cookies.get('accessToken', {signed: config('cookie.signed')});
}

async function createToken(ctx) {
  let token = UserLogic.createToken();
  return setToken(ctx, token);
}

async function updateToken(ctx, token, unsafe) {
  token = await UserLogic.refreshToken(token || getToken(ctx), unsafe);
  return setToken(ctx, token);
}

function setToken(ctx, token) {
  UserLogic.setToken(ctx, token);
  return token.accessToken;
}

module.exports = { middleware };
