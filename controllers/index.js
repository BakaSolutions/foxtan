const Tools = require('../helpers/tools');

module.exports.init = function (app) {
  var plugins = Tools.requireAllSync('controllers/api', /\.js$/),
    router = require('express').Router();
  app.routers = [];

  plugins.forEach(function (plugin) {
    router.use('/', plugin);
    app.routers.push(plugin);
  });

  app.use(router);
};
