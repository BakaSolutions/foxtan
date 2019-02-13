const config = require('../../../helpers/config');
const Controller = require('../index');

const ROOT = new RegExp(config('directories.root').replace(/\\/g, '\\\\'), 'g');

let middleware = app => {
  app.use(async (ctx, next) => {
    try {
      if (!config('server.static.external')) {
        ctx.set('Access-Control-Allow-Origin', ctx.headers.origin || '*');
        ctx.set('Access-Control-Allow-Headers', 'X-Requested-With');
        ctx.set('Access-Control-Allow-Credentials', 'true');
      }
      await next();
      const status = ctx.status || 404;
      if (status === 404 && !ctx.body) {
        throw {
          status
        };
      }
    } catch (err) {
      err.expose = true;
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

  delete err.expose;

  const status = err.status || 500;

  if (status >= 500) {
    console.log('[ERR]', ctx.header.host, status + '/' + ctx.status, ctx.url, err.details);
    console.log(err.stack || err);
  }

  if (isError) {
    let {message, stack, status} = err;
    err = {message, stack, status};
    if (config('debug.enable')) {
      err.stack = err.stack.replace(ROOT, '') || err;
    } else {
      delete err.stack;
    }
  }

  return Controller.fail(ctx, err);
}

process.on('uncaughtException', reason => console.log('Uncaught Exception at:', reason));
process.on('unhandledRejection', reason => console.log('Unhandled Rejection at:', reason));
process.on('rejectionHandled', () => console.log('REJECTIONHANDLED'));

module.exports = {
  middleware
};
