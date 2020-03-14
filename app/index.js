const http = require('http');

const config = require('./helpers/config.js');
const Tools = require('./helpers/tools.js');
const routes = require('./routes/index.js');
const EventBus = require('./core/event.js');

(async () => {
  let log = logError(console);
  catchThrown(log);

  try {
    const server = http.createServer();

    await routes.initHTTP(server);
    await routes.initWebsocket(server);

    await listen(server);
  } catch (e) {
    log(e);
  }
})();

async function listen(server) {
  let { output, host, port, socket } = config('server');
  let address, serverParams;

  if (output === 'socket') {
    address = socket;
    serverParams = [ socket ];
  } else {
    address = `http://${host}:${port}`;
    serverParams = [config('server.port'), config('server.host')]
  }

  await server.listen(...serverParams);
  console.log(`\x1b[32mФырк!\x1b[0m ${address}/index.xhtml`);
}

function catchThrown(log) {
  process.on('uncaughtException', log);
  process.on('unhandledRejection', log);
  process.on('warning', log);
  EventBus.on('error', log);
}

function logError(log) {
  return e => log.error(Tools.returnPrettyError(e));
}
