const config = require('../../../../Infrastructure/Config.js');
const MainController = require('../MainController.js');

class IndexController extends MainController {

  constructor(Router) {
    super(Router);

    Router.get('api/meta', this.getMeta.bind(this));
  }

  getMeta(ctx) {
    this.success(ctx, {
      engine: 'Foxtan/' + config.get('server.version'),
      res: config.get('paths.upload'),
      thumb: config.get('paths.thumb'),
      ws: config.get('paths.ws')
    });
  }

}

module.exports = IndexController;
