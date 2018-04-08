const Controllers = module.exports = {};

const Tools = require('../helpers/tools');
const WS = require('./websocket');

/**
 * Inits controllers: requires all .js from /controllers/http/ and sets routers
 * @param app
 */
Controllers.initHTTP = async app => {

  let middlewares = await Tools.requireAll(
      [
        'routes/http/middlewares',
        // TODO: Add custom middlewares
      ],
      /\.js$/
  );
  for (let i = 0; i < middlewares.length; i++) {
    middlewares[i].middleware(app);
  }

  let routes = await Tools.requireAll(
      [
        'routes/http/api',
        'routes/http/api/v1',
        // TODO: Add custom routes
      ],
      /\.js$/
  );
  for (let i = 0; i < routes.length; i++) {
    app.use(routes[i].routes());
    app.use(routes[i].allowedMethods());
  }

};

Controllers.initWebsocket = server => {
  let WSInstance = WS(server);

  let handlers = Tools.requireAllSync('routes/websocket', /^(?!.*index)\w+\.js$/);

  for (let i = 0; i < handlers.length; i++) {
    if (!Array.isArray(handlers[i])) {
      handlers[i] = [ handlers[i] ];
    }
    for (let j = 0; j < handlers[i].length; j++) {
      let { command, handler } = handlers[i][j];
      WSInstance.use(command, handler);
    }
  }
};
