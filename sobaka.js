const express = require('express'),
  config = require('./helpers/config'),
  controllers = require('./controllers'),
  app = express();

controllers.init(app);
switch (config('server.output')) {
  case 'unix':
    app.listen(config('server.socket'), onListening(config('server.socket')));
    break;
  default:
    app.listen(config('server.port'), config('server.host'), onListening(`http://${config('server.host')}:${config('server.port')}`));
    break;
}

function onListening(address) {
  console.log(`Sobaka! Where? Here: ${address}`);
  console.log(`Try our debugging!:o ${address}/index.xhtml`);
}
