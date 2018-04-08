let middleware = app => {
  app.on('error', (err, ctx) => {
    if (ctx.status >= 500) {
      console.log('[ERR]', ctx.header.host, ctx.status, ctx.url, err.message);
    }
  });
};

module.exports = {
  middleware
};
