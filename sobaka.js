const express = require('express'),

  controllers = require('./controllers'),

  app = express(),
  config = {
    "server": {
      "output": "port", // "unix" for socket or nuff for HTTP
      "port": 1337,
      "address": "127.0.0.1",
      "socket": "/tmp/sock"
    }
  };


controllers.init(app);
switch (config.server.output) {
  case 'unix':
    app.listen(config.server.socket, onListening(config.server.socket));
    break;
  default:
    app.listen(config.server.port, config.server.address, onListening(`http://${config.server.address}:${config.server.port}`));
    break;
}


function onListening(address) {
  console.log(`Sobaka says 'Rawr'! Where? Here: ${address}`);
}
