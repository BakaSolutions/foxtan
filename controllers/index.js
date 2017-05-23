const Common = require('./common'),
  Tools = require('../helpers/tools');

module.exports.init = function (app) {
  var plugins = Tools.requireAllSync('controllers/http', /\.js$/),
    router = require('express').Router();
  app.routers = [];

  plugins.forEach(function (plugin) {
    router.use('/', plugin);
    app.routers.push(plugin);
  });

  app.use(router);

  app.use('*', (req, res) => {
    Common.throw(res, 404);
  });
};
