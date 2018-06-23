const config = require('../../../helpers/config');
const parseForm = require('../parse');

let middleware = app => {
  app.use(async (ctx, next) => {
    const start = +new Date;

    if (config('server.enableStatic')) {
      ctx.set('Access-Control-Allow-Origin', '*');
      ctx.set('Access-Control-Allow-Headers', 'X-Requested-With');
    }

    await parseForm(ctx);
    await next();

    const ms = +new Date - start;

    ctx.set('X-Response-Time', `${ms} ms`);

    if (config('debug') && config('debugOptions.logRequests')) {
      console.log(`[${ctx.status}] [${ctx.method}] ${ctx.url} - ${ms} ms`);
    }
  });
};

module.exports = {
  middleware
};