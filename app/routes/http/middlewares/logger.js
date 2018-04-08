const config = require('../../../helpers/config');
const parseForm = require('../parse');
const Controller = require('../index');

let middleware = app => {
  app.use(async (ctx, next) => {
    const start = +new Date;

    if (config('server.enableStatic')) {
      ctx.set('Access-Control-Allow-Origin', '*');
      ctx.set('Access-Control-Allow-Headers', 'X-Requested-With');
    }

    try {
      await parseForm(ctx);
      await next();
    } catch (err) {
      ctx.status = err.status || 500;

      let out = {
        error: err.name,
        message: err.message
      };

      if (config('debug') && ctx.status >= 500) {
        out.stack = err.stack || err;

        if (!Controller.isAJAXRequested(ctx)) {
          out = `<pre>\n${out.stack}\n</pre>`;
        }
        ctx.app.emit('error', err, ctx);
      }

      ctx.body = out;
    }

    const ms = +new Date - start;

    ctx.set('X-Response-Time', `${ms} ms`);

    if (config('debug') && config('debugOptions.logRequests')) {
      console.log(`[${ctx.status}] [${ctx.method}] ${ctx.originalUrl} - ${ms} ms`);
    }
  });
};

module.exports = {
  middleware
};