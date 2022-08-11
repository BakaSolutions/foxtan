const http = require('http');

const { CustomError, NotFoundError } = require('../../../Domain/Error/index.js');
const config = require('../../../Infrastructure/Config.js');

const DEBUG = config.get('debug.enable');

class MainController {

  constructor(Router) {
    this.Router = Router;
  }

  success(ctx, out) {
    if (out === null || typeof out === 'undefined') {
      // return ctx.throw(404);
      return this.fail(ctx, new NotFoundError());
    }
    ctx.body = out;
  }

  /**
   *
   * @param ctx
   * @param {CustomError} out
   * @returns {{error: ({code}|*)}}
   */
  fail(ctx, out) {
    ctx.status = +out?.code || +out?.status || 500;

    if (ctx.status >= 500) {
      Promise.reject(out); // will catch in Application/index.js:logUnexpectedErrors()
      // TODO: Make a separated centralized logging system
    }

    ctx.message = out.message; // goes to log

    if (out instanceof CustomError) {
      return ctx.body = {
        error: DEBUG
          ? out.displayWithStack()
          : out.display()
      };
    }

    ctx.body = {
      error: {
        description: out.message || http.STATUS_CODES[ctx.status],
        code: ctx.status
      }
    };
  }

  isAJAXRequested = ctx => ctx.headers["x-requested-with"] === "XMLHttpRequest";

}

module.exports = MainController;
