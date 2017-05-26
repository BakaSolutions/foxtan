const express = require('express'),
  config = require('./helpers/config'),
  controllers = require('./controllers'),
  db = require('./models/sql'),
  app = express();

controllers.init(app);
db.authenticate()
  .then(() => {
    console.log('Connection has been established successfully.');
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });
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
  console.log(`Try our CRUD-routing! ${address}/b/res/1337.json`);
}
