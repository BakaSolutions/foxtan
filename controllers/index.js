const Common = require('./common'),
  Tools = require('../helpers/tools'),
  express = require('express'),
  path = require('path'),
  bodyParser = require('body-parser');

/**
 * Inits controllers: requires all .js from /controllers/http/ and sets routers
 * @param app
 */
module.exports.init = function (app) {
  let plugins = Tools.requireAllSync('controllers/http', /\.js$/),
    router = express.Router();
  app.routers = [];

  // Magic perfomance header! \( ^o^)/
  /*app.use(async function (req, res, next) {
    const start = new Date();
    console.log(start);
    await next();
    const ms = new Date() - start;
    console.log(ms);
    res.set('X-Response-Time', ms + 'ms');
    console.log(ms, ms);
  });*/

  plugins.forEach(function (plugin) {
    router.use('/', plugin);
    app.routers.push(plugin);
  });

  app.use(bodyParser.urlencoded({ extended: true }));

  app.use(router);

  app.use(express.static(path.join(__dirname,  '/../public')));

  app.use('*', function (req, res) {
    Common.throw(res, 404);
  });
};
