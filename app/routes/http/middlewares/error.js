const URL = require('url');

const config = require('../../../helpers/config');
const Controller = require('../index');

let middleware = app => {
  app.use(async (ctx, next) => {
    try {
      if (!config('server.static.external') && ['OPTIONS', 'POST'].includes(ctx.method)) {
        let { hostname } = URL.parse(ctx.headers.origin || ctx.origin);
        ctx.set('Access-Control-Allow-Origin', config('server.allowedOverchans').includes(hostname)
          ? ctx.headers.origin
          : '*');
        ctx.set('Access-Control-Allow-Headers', 'X-Requested-With');
        ctx.set('Access-Control-Allow-Credentials', 'true');
      }
      await next();
      const status = ctx.status || 404;
      if (status === 404 && !ctx.body) {
        throw {
          status: 404
        };
      }
    } catch (err) {
      return (err instanceof Error)
        ? ctx.app.emit('error', err, ctx)
        : errorHandler(err, ctx, false);
    }
  });

  app.on('error', errorHandler);
};

function errorHandler(err, ctx, isError = true) {
  if (isError && /^E(PIPE|CONNRESET)$/.test(err.code)) {
    return;
  }

  const status = err.status || 500;

  if (status >= 500) {
    console.log('[ERR]', ctx.header.host, ctx.status, ctx.url, err.message);

    if (isError && config('debug.enable')) {
      err.stack = err.stack.replace(new RegExp(config('directories.root'), 'g'), '') || err;
    } else {
      delete err.stack;
    }
  }

  return Controller.fail(ctx, err);
}

process.on('uncaughtException', err => console.log(require('util').inspect(err)));

module.exports = {
  middleware
};
