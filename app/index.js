const Koa = require('koa');
const app = new Koa();
const config = require('./helpers/config');
const routes = require('./routes');
const server = require('http').createServer();

(async () => {
  server.on('request', app.callback());
  await routes.initWebsocket(server);
  await routes.initHTTP(app);

  switch (config('server.output'))  {
    case 'socket':
      server.listen(config('server.socket'), onListening(config('server.socket')));
      break;
    default:
      server.listen(
          config('server.port'),
          config('server.host'),
          onListening(`http://${config('server.host')}:${config('server.port')}`)
      );
      break;
  }
})();

function onListening (address) {
  console.log(`\x1b[32mФырк!\x1b[0m ${address}/index.xhtml`);
}
