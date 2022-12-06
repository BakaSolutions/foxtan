const config = require('../../../../Infrastructure/Config.js');
const Session = require('../../../../Infrastructure/Session.js');
const Tools = require('../../../../Infrastructure/Tools.js');

let middleware = app => {
  app.keys = config.get('cookie.keys');
  app.use(Session);
  app.use(async (ctx, next) => {
    if (['GET', 'POST'].includes(ctx.request.method.toLocaleUpperCase()) && !ctx.session?.key) {
      ctx.session.key = Tools.randomSessionString();
    }
    await next();
  })
};

module.exports = {
  middleware
};
