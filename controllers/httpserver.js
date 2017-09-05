const server = require('http').createServer();
const WS = require('./websocket');

let websocket;

module.exports = function (app) {
  if (app) {
    server.on('request', app);
    websocket = new WS(server);
  }
  return {
    http: server,
    ws: websocket
  };
};
