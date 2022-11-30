const session = require('koa-session-minimal');
const redisStore = require('koa-redis');

const redisClient = require('./Redis.js');
const config = require('./Config.js');

module.exports = session({
  key: config.get('cookie.sessionKey'),
  // NOTE: Here we can use:
  // redis, mysql, mongo, pg, sqlite
  // Refer to `koa-session` npm module
  // for implementation of get(), set() and destroy() functions
  store: redisStore({
    client: redisClient()
  }),
  cookie: ctx => ({
    sameSite: config.get('cookie.sameSite', 'none'),
    secure: config.get('cookie.secure', true),
    maxAge: ctx.session.user ? config.get('cookie.maxAge') : 0 // 1 day or session time
  })
});