const Koa = require('koa');

const Tools = require('../helpers/tools.js');
const WS = require('../helpers/ws.js');

const Routes = module.exports = {};

Routes.initHTTP = async server => {

  const app = new Koa();

  server.on('request', app.callback());

  let middlewares = await load('http', 'middlewares');

  middlewares.forEach(({ middleware }) => middleware(app));

  let routes = await load('http', 'routes');

  routes.forEach(route => {
    try {
      app.use(route.routes());
      app.use(route.allowedMethods());
    } catch (e) {
      console.log(route);
      throw e;
    }
  });

};

Routes.initWebsocket = async server => {

  const app = WS(server);

  let middlewares = await load('websocket', 'middlewares');

  middlewares.forEach(m => {
    m = Tools.arrayify(m);

    for (let j = 0; j < m.length; j++) {
      let { request, middleware } = m[j];
      if (!request || !middleware) {
        console.log(`A middleware for command ${request} is broken.`);
        continue;
      }
      app.use(request, middleware);
    }
  });

};

async function load(server, type) {
  try {
    let main = await Tools.requireRecursive(`app/${type}/${server}`, {
      mask: /(?<!index|parse)\.js$/,  // TODO: Move http/*.js
      isFallible: false
    });
    let custom = await Tools.requireRecursive(`custom/app/${type}/${server}`, {
      mask: /\.js$/,
      isFallible: true
    });
    let out = [...main, ...custom];
    console.log(`Loaded ${out.length} ${type} for ${server}.`);
    return out;
  } catch (e) {
    console.log(`Can't load ${type} for ${server}:`);
    console.log(e);
  }
}
