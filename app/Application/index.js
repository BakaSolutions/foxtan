const config = require('../Infrastructure/Config.js');
const Tools = require('../Infrastructure/Tools.js');

// Web server
const Routing = require('../Infrastructure/Routing.js');

// Databases
const DatabaseContext = require('../Infrastructure/DatabaseContext.js');

const fs = require('fs').promises;

class Foxtan {

  constructor({ logger = console } = {}) {
    this.logger = logger;
  }

  async init() {
    this.logUnexpectedErrors(this.logError.bind(this));
    try {
      await fs.mkdir(config.get('directories.temporary'))
        .catch((err) => {
          switch (err.code) {
            case 'EEXIST':
              return;

            default:
              throw err;
          }
        });
      await this.initDatabaseContext(config.get('db.type'));
      await this.launchServer();
    } catch (e) {
      this.logError(e);
      process.exit(1);
    }
  }

  async initDatabaseContext(dbType) {
    const Database = new DatabaseContext(dbType);
    await Database.connect();
    return this.database = Database;
  }

  async launchServer() {
    let { output, socket, host, port, pathPrefix } = config.get('server');

    this.routing = new Routing(this.database.context);

    let HTTPRoutes = await Routing.load('HTTP', 'Route');
    let HTTPMiddlewares = await Routing.load('HTTP', 'Middleware');
    this.routing.addHTTPRoutes(HTTPRoutes, HTTPMiddlewares);

    let WSMiddlewares = await Routing.load('WS');
    this.routing.addWSRoutes(WSMiddlewares);

    this.routing.onListen((...args) => {
      let address = `${host}:${port}`;
      this.logger.log(`\x1b[32mФырк!\x1b[0m http://${address}${pathPrefix}index.xhtml`);
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
    //EventBus.on('error', output);
  }

  logError(e) {
    if (this === process) {
      console.warn('Missed binding for logger. It may cause process exit!');
      return console.log(e);
    }
    this.logger.error(Tools.returnPrettyError(e));
  }

}

new Foxtan({
  logger: console
}).init();
