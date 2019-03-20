const config = require('../../helpers/config');
const Render = require('../../helpers/render');
const http = require('http');

(async () => {
  if (config('server.compileTemplatesOnStartup')) {
    await Render.compileTemplates();
  }
  await Render.loadTemplates();
})();

let HTTP = {};

HTTP.isAJAXRequested = ctx => ctx.headers["x-requested-with"] === "XMLHttpRequest";

HTTP.success = (ctx, out, templateName) => {
  if (out === null || typeof out === 'undefined') {
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

  if (out instanceof Error) {
    return ctx.throw(out);
  }

  if (!HTTP.isAJAXRequested(ctx)) {
    ctx.type = 'text/html';
    out.debug = config('debug.enable');
    return ctx.body = Render.renderPage(templateName, out);
  }

  delete out.status;

  out.error = out.error || http.STATUS_CODES[ctx.status];

  ctx.body = out;
};

HTTP.isRedirect = query => !(typeof query.redirect === 'undefined' || query.redirect === '');

module.exports = HTTP;
