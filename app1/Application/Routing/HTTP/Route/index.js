const config = require('../../../../../app/helpers/config.js');
const MainController = require('../MainController.js');

class IndexController extends MainController {

  constructor(Router) {
    super(Router);

    Router.get('api/meta', this.getMeta.bind(this));
  }

  getMeta(ctx) {
    this.success(ctx, {
      engine: 'Foxtan/' + config('server.version'),
      res: config('paths.upload'),
      thumb: config('paths.thumb'),
      ws: config('paths.ws')
    });
  }

}

module.exports = IndexController;
