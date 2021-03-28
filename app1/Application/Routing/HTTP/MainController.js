const http = require('http');

class MainController {

  constructor() {}

  success(ctx, out) {
    if (out === null || typeof out === 'undefined') {
      return ctx.throw(404);
    }
    ctx.body = out;
  };

  fail(ctx, out) {
    ctx.status = out
      ? out.status || 500
      : 500;

    if (ctx.status >= 500) {
      Promise.reject(out); // will catch in Application/index.js:logUnexpectedErrors()
      // TODO: Make a separated centralized logging system
    }

    if (!out.error) {
      out.error = http.STATUS_CODES[ctx.status];
    }

    delete out.status;

    ctx.body = out;
  };

}

module.exports = MainController;
