const config = require('../../../../Infrastructure/Config.js');
const MainController = require('../MainController.js');

const Controller = new MainController();

const ROOT = new RegExp(config('directories.root').replace(/\\/g, '\\\\'), 'g');

let middleware = app => {
  app.use(async (ctx, next) => {
    try {
      await next();
      const status = ctx.status || 404;
      if (status === 404 && !ctx.body) {
        throw {
          status
        };
      }
    } catch (err) {
      err.status = err.statusCode || err.status || 500;
      err.expose = true;
      return (err instanceof Error)
         ? ctx.app.emit('error', err, ctx)
         : errorHandler(err, ctx, false);
      return ctx.app.emit('error', err, ctx);
    }
  });

  app.on('error', errorHandler);
};

function errorHandler(err, ctx, isError = true) {
  if (err.code && /^E(PIPE|CONNRESET)$/.test(err.code)) {
    return;
  }

  let { message, stack, status } = err;
  err = { message, stack, status };

  if (err.stack && config('debug.enable')) {
    err.stack = err.stack.replace(ROOT, '') || err;
  } else {
    delete err.stack;
  }

  return Controller.fail(ctx, err);
}

module.exports = {
  middleware
};
