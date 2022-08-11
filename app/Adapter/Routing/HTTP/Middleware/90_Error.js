const MainController = require('../MainController.js');
const { CustomError, NotFoundError } = require('../../../../Domain/Error/index.js');

const Controller = new MainController();

let middleware = app => {
  app.use(async (ctx, next) => {
    try {
      await next();
      const status = ctx.status || 404;
      if (status === 404 && !ctx.body) {
        throw new NotFoundError();
      }
    } catch (err) {
      return (err instanceof CustomError)
         ? Controller.fail(ctx, err)
         : ctx.app.emit('error', err, ctx);
    }
  });

  app.on('error', errorHandler);
};

function errorHandler(err, ctx) {
  if (err.code && /^E(PIPE|CONNRESET)$/.test(err.code)) {
    return;
  }
  err.status = err.statusCode || err.status || 500;
  //err.expose = true;
  let error = new CustomError(err.code, err.message, err.status, err.stack);
  return Controller.fail(ctx, error);
}

module.exports = {
  middleware
};
