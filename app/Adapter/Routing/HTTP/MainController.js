const http = require('http');
const { CustomError } = require("../../../Domain/Error/index.js");

class MainController {

  constructor(Router) {
    this.Router = Router;
  }

  success(ctx, out) {
    if (out === null || typeof out === 'undefined') {
      return ctx.throw(404);
    }
    ctx.body = out;
  }

  fail(ctx, out) {
    ctx.status = out
      ? out.status || 500
      : 500;
    delete out.status;

    if (ctx.status >= 500) {
      Promise.reject(out); // will catch in Application/index.js:logUnexpectedErrors()
      // TODO: Make a separated centralized logging system
    }

    ctx.message = out.message; // goes to log

    if (out instanceof CustomError) {
      return ctx.body = {
        error: out.display()
      };
    }

    ctx.body = {
      error: {
        description: http.STATUS_CODES[ctx.status]
      }
    };
  }

  isAJAXRequested = ctx => ctx.headers["x-requested-with"] === "XMLHttpRequest";

}

module.exports = MainController;
