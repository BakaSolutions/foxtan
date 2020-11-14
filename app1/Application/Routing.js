const Tools = require('../../app/helpers/tools.js');
const config = require('../../app/helpers/config.js');

const http = require('http');
const Koa = require('koa');
const KoaRouter = require('koa-router');
const WS = require('./WS.js');

class Routing {

  constructor(DatabaseContext) {
    let websocketPath = `${config('server.pathPrefix')}ws`;

    this._http = http.createServer();
    this._framework = new Koa();
    this._router = KoaRouter({
      prefix: config('server.pathPrefix')
    });
    this._websocket = new WS(this._http, websocketPath);
    this._databaseContext = DatabaseContext;

    this._http.on('request', this._framework.callback());
  }

  /**
   *
   * @param server
   * @param type
   * @returns {*[]}
   */
  static async load(server, type) {
    try {
      let path = `app1/Application/Routing/${server}`;
      if (type) {
        path += `/${type}`;
      } else {
        type = 'Route'
      }
      let modules = await Tools.requireRecursive(path, {
        isFallible: false
      });
      console.log(`Loaded ${modules.length} ${server} ${type}.`);
      return modules;
    } catch (e) {
      console.log(`Can't load ${server} ${type}:`);
      console.log(e);
    }
  }

  addHTTPRoutes(routes = [], middlewares = []) {
    this._routes = routes;
    this._middlewares = middlewares;

    let app = this._framework;

    this._middlewares.forEach(({ middleware }) => middleware(app));

    for (let j = 0; j < this._routes.length; j++) {
      let Route = this._routes[j];
      if (!Route) {
        continue;
      }
      Route = new Route(this._router, this._databaseContext);
      app.use(Route.routes());
      app.use(Route.allowedMethods());
    }
  }

  addWSRoutes(middlewares) {
    let app = this._websocket;

    middlewares.forEach(m => {
      m = Tools.arrayify(m);

      for (let i = 0; i < m.length; i++) {
        let router = new m[i](this._databaseContext);
        router = Tools.arrayify(router);
        for (let j = 0; j < router.length; j++) {
          let {request, middleware} = router[j];
          if (!request || !middleware) {
            console.log(`A middleware for command "${request}" is broken.`);
            continue;
          }
          app.use(request, middleware);
        }
      }
    });

  }

  onListen(callback) {
    this._http.on('listening', callback);
  }

  async listenSocket(socket) {
    return this._http.listen(socket);
  }

  async listenPort(host, port) {
    return this._http.listen(port, host);
  }

}

module.exports = Routing;
