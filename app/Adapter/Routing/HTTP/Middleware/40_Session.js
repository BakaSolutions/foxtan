const session = require('koa-session-minimal');
const redisStore = require('koa-redis');

const redisClient = require('../../../../Infrastructure/Redis.js');
const config = require('../../../../Infrastructure/Config.js');

let middleware = app => {
  app.keys = config.get('cookie.keys');
  app.use(
    session({
      key: config.get('cookie.sessionKey'),
      // NOTE: Here we can use:
      // redis, mysql, mongo, pg, sqlite
      // Refer to `koa-session` npm module
      // for implementation of get(), set() and destroy() functions
      store: redisStore({
        client: redisClient()
      }),
      cookie: ctx => ({
        maxAge: ctx.session.user ? 86400000 : 0 // 1 day or session time
      })
    })
  );
};

module.exports = {
  middleware
};
