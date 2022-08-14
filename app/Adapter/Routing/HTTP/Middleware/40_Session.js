const config = require('../../../../Infrastructure/Config.js');
const Session = require('../../../../Infrastructure/Session.js');

let middleware = app => {
  app.keys = config.get('cookie.keys');
  app.use(Session);
};

module.exports = {
  middleware
};
