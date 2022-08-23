const config = require('../../../../Infrastructure/Config.js');

const debug = config.get('debug.enable') && config.get('debug.log.requests');

let middleware = app => {
  app.use(async (ctx, next) => {
    const start = +new Date;
    try {
      await next();
    } finally {
      const ms = +new Date - start;
      ctx.set('X-Response-Time', `${ms} ms`);
      if (debug) {
        let string = `[HTTP] [${(''+ms).padStart(3)} ms] [${ctx.method}] [${ctx.status}] ${ctx.url}`;
        if (ctx.message) {
          string += ` (${ctx.message})`;
        }
        if (ctx.description) {
          string += ` (${ctx.description})`;
        }
        console.log(string);
      }
    }
  });
};

module.exports = {
  middleware
};
