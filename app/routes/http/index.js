let HTTP = {};

HTTP.isAJAXRequested = ctx => ctx.headers["x-requested-with"] === "XMLHttpRequest";

HTTP.success = (ctx, out) => {
  if (!out) {
    return ctx.throw(404);
  }
  ctx.body = out;
};

HTTP.fail = (ctx, out) => {
  let code = out
    ? out.status || 500
    : 500;
  /*ctx.body =
    !HTTP.isAJAXRequested(ctx)
      ? out.message
      : out;
  ctx.status = code;*/
  return ctx.throw(code, out);
};

module.exports = HTTP;
