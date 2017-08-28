const express = require('express');
const config = require('./helpers/config');
const controllers = require('./controllers');

const app = express();
const server = controllers.init(app);

switch (config('server.output'))  {
  case 'unix':
    server.listen(config('server.socket'), onListening(config('server.socket')));
    break;
  default:
    server.listen(config('server.port'), config('server.host'), onListening(`http://${config('server.host')}:${config('server.port')}`));
    break;
}

function onListening(address) {
  console.log(`Sobaka! Where? Here: ${address}`);
  console.log(`Try our debugging!:o ${address}/index.xhtml`);
}
