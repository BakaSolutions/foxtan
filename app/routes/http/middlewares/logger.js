const config = require('../../../helpers/config');
const parseForm = require('../parse');

let middleware = app => {
  app.use(async (ctx, next) => {
    const start = +new Date;

    await parseForm(ctx);
    await next();

    const ms = +new Date - start;

    ctx.set('X-Response-Time', `${ms} ms`);

    if (config('debug.enable') && config('debug.log.requests')) {
      console.log(`[${ctx.status}] [${ctx.method}] ${ctx.url} - ${ms} ms`);
    }
  });
};

module.exports = {
  middleware
};