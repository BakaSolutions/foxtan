const config = require('../../../helpers/config');
const Controller = require('../index');

let middleware = app => {
  app.use(async (ctx, next) => {
    try {
      if (!config('server.static.external')) {
        ctx.set('Access-Control-Allow-Origin', '*');
        ctx.set('Access-Control-Allow-Headers', 'X-Requested-With');
      }
      await next();
      const status = ctx.status || 404;
      if (status === 404 && !ctx.body) {
        ctx.throw(404)
      }
    } catch (err) {
      return (err instanceof Error)
        ? ctx.app.emit('error', err, ctx)
        : errorHandler(err, ctx);
    }
  });

  app.on('error', errorHandler);
};

function errorHandler(err, ctx) {
  const status = err.status || 500;

  if (status >= 500) {
    console.log('[ERR]', ctx.header.host, ctx.status, ctx.url, err.message);

    if (config('debug.enable')) {
      err.stack = err.stack.replace(new RegExp(config('directories.root'), 'g'), '') || err;
    }
  }

  return Controller.fail(ctx, err);
}

module.exports = {
  middleware
};
