const config = require('../../helpers/config');
const parseForm = require('../../helpers/formdata.js');

const debug = config('debug.enable') && config('debug.log.requests');

let middleware = app => {
  app.use(async (ctx, next) => {
    const start = +new Date;

    await parseForm(ctx);
    await next();

    const ms = +new Date - start;

    ctx.set('X-Response-Time', `${ms} ms`);

    if (debug) {
      console.log(`[HTTP] [${(''+ms).padStart(3)} ms] [${ctx.method}] [${ctx.status}] ${ctx.url}`);
    }
  });
};

module.exports = {
  middleware
};