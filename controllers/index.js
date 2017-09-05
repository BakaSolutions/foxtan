const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');

const Common = require('./common');
const Tools = require('../helpers/tools');
const HTTPServer = require('./httpserver');

const Controllers = module.exports = {};

/**
 * Inits controllers: requires all .js from /controllers/http/ and sets routers
 * @param app
 */
Controllers.init = function (app) {
  let { http: server, ws: WSInstance } = HTTPServer(app);

  let plugins = Tools.requireAllSync('controllers/http', /\.js$/);
  let router = express.Router();
  app.routers = [];

  for (let i = 0; i < plugins.length; i++) {
    router.use('/', plugins[i]);
    app.routers.push(plugins[i]);
  }

  app.use(bodyParser.urlencoded({ extended: true }));

  app.use(router);

  app.use(express.static(path.join(__dirname,  '/../public')));

  app.use('*', function (req, res) {
    Common.throw(res, 404);
  });

  let handlers = Tools.requireAllSync('controllers/websocket', /^((?!index).)*\.js$/);
  for (let i = 0; i < handlers.length; i++) {
    if (!Array.isArray(handlers[i])) {
      handlers[i] = [ handlers[i] ];
    }
    for (let j = 0; j < handlers[i].length; j++) {
      let { command, handler } = handlers[i][j];
      WSInstance.use(command, handler);
    }
  }

  return server;
};
