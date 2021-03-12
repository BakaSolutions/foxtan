const config = require('../../../../../app/helpers/config.js');
const Tools = require('../../../../../app/helpers/tools.js');

let middleware = app => {
  if (config('server.static.external')) {
    return; // not our job!
  }

  app.use(async (ctx, next) => {
    ctx.set('Access-Control-Allow-Origin', ctx.headers.origin || '*');
    ctx.set('Access-Control-Allow-Headers', 'X-Requested-With');
    ctx.set('Access-Control-Allow-Credentials', 'true');
    await next();
  });

  if (!Tools.moduleAvailable('koa-static')) {
    return console.warn(
      '\x1b[35mЧтобы использовать Foxtan без Nginx, установите модуль koa-static:\x1b[0m\n\n' +
      '\x1b[36m           npm i koa-static \x1b[0m или \x1b[36m yarn add koa-static\x1b[0m\n\n'
    );
  }

  const Static = require('koa-static');
  let middleware = Static(__dirname + '/../../../../../public');

  if (config('server.pathPrefix') === '/') {
    return app.use(middleware); // just do what they want: "/"
  }

  if (!Tools.moduleAvailable('koa-mount')) {
    return console.warn(
      '\x1b[35mДля нестандартной опции pathPrefix установите модуль koa-mount:\x1b[0m\n\n' +
      '\x1b[36m          npm i koa-mount \x1b[0m или \x1b[36m yarn add koa-mount\x1b[0m\n\n'
    );
  }

  const mount = require('koa-mount');
  return app.use(mount(config('server.pathPrefix'), middleware)); // advanced job with "/prefix/"!
};

module.exports = {
  middleware
};
