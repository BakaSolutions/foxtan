const config = require('../../helpers/config');
const parseForm = require('../../routes/http/parse');

let middleware = app => {
  app.use(async (ctx, next) => {
    const start = +new Date;

    await parseForm(ctx);
    await next();

    const ms = +new Date - start;

    ctx.set('X-Response-Time', `${ms} ms`);

    if (config('debug.enable') && config('debug.log.requests')) {
      console.log(`[HTTP] [${(''+ms).padStart(3)} ms] [${ctx.method}] [${ctx.status}] ${ctx.url}`);
    }
  });
};

module.exports = {
  middleware
};