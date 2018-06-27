const config = require('../../helpers/config');
const Render = require('../../helpers/render');
const http = require('http');

(async () => {
  await Render.compileTemplates();
  await Render.loadTemplates();
})();

let HTTP = {};

HTTP.isAJAXRequested = ctx => ctx.headers["x-requested-with"] === "XMLHttpRequest";

HTTP.success = (ctx, out, templateName) => {
  if (!out) {
    return ctx.throw(404);
  }
  if (!HTTP.isAJAXRequested(ctx) && templateName) {
    out = Render.renderPage(templateName, out);
  }
  ctx.body = out;
};

HTTP.fail = (ctx, out, templateName = 'pages/error') => {
  ctx.status = out
    ? out.status || 500
    : 500;

  if (!HTTP.isAJAXRequested(ctx)) {
    return ctx.body = Render.renderPage(templateName, out);
  }

  delete out.status;

  if (out instanceof Error) {
    let { error, message, stack } = out;
    out = {
      error,
      message,
      stack: config('debug.enable')
        ? stack
        : undefined
    }
  }

  out.error = out.error || http.STATUS_CODES[ctx.status];

  ctx.body = out;
};

HTTP.isRedirect = query => !(typeof query.redirect === 'undefined' || query.redirect === '');

module.exports = HTTP;
