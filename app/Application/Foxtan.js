const config = require('../Infrastructure/Config.js');
const DatabaseContext = require('../Infrastructure/DatabaseContext.js');
const Routing = require('../Infrastructure/Routing.js');
const Tools = require('../Infrastructure/Tools.js');

const fs = require('fs').promises;

class Foxtan {

  database;
  services;
  routing;

  constructor({ logger = console } = {}) {
    this.logger = logger;
    this.logUnexpectedErrors(this.logError.bind(this));
  }

  async init() {
    try {
      try {
        await fs.mkdir(config.get('directories.temporary'))
      } catch (err) {
        if (err.code !== 'EEXIST') {
          throw err;
        }
      }
      await this.initDatabaseContext(config.get('db.type'));
      await this.initServices();
    } catch (e) {
      this.logError(e);
      process.exit(1);
    }
  }

  async initDatabaseContext(dbType) {
    this.database = new DatabaseContext(dbType);
    await this.database.connect();
    return this.database;
  }

  async initServices() {
    let serviceFiles = await Tools.requireRecursive('app/Application/Service', {
      mask: /.+Service\.js/i
    });
    let services = {};
    serviceFiles.map(Service => {
      let serviceName = Service.name.replace('Service', '').toLocaleLowerCase();
      services[Service.name] = new Service(this.database.context[serviceName]);
    });
    return this.services = services;
  }

  async launchServer() {
    let { output, socket, host, port, pathPrefix } = config.get('server');

    this.routing = new Routing(this.services);

    let HTTPRoutes = await Routing.load('HTTP', 'Route');
    let HTTPMiddlewares = await Routing.load('HTTP', 'Middleware');
    this.routing.addHTTPRoutes(HTTPRoutes, HTTPMiddlewares);

    let WSMiddlewares = await Routing.load('WS');
    this.routing.addWSRoutes(WSMiddlewares);

    this.routing.onListen(() => {
      let address = `${host}:${port}`;
      this.logger.log(`\x1b[32mФырк!\x1b[0m http://${address}${pathPrefix}index.xhtml for HTTP debug!`);
      this.logger.log(`\x1b[32mФырк!\x1b[0m http://${address}${pathPrefix}debug.xhtml for WS debug!`);
      this.logger.log(`\x1b[33m[WS]:\x1b[0m   ws://${address}${pathPrefix}ws`);
    });

    if (output === 'socket') {
      return this.routing.listenSocket(socket);
    }
    return this.routing.listenPort(host, port);
  }

  logUnexpectedErrors(output) {
    process.on('uncaughtException', output);
    process.on('unhandledRejection', output);
    process.on('warning', output);
  }

  logError(e) {
    this.logger.error(Tools.returnPrettyError(e));
  }

}

module.exports = Foxtan;
