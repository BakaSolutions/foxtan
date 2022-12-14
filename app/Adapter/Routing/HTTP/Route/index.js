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
      res: {
        path: config.get('paths.upload'),
      },
      thumb: {
        path: config.get('paths.thumb'),
        format: config.get('files.thumbnail.format'),
        width: config.get('files.thumbnail.width'),
        height: config.get('files.thumbnail.height'),
      },
      ws: config.get('paths.ws'),
      captcha: {
        type: config.get('captcha.type'),
        size: config.get('captcha.size', {min: 5, max: 7}),
        ttl: config.get('captcha.ttl'),
      }
    });
  }

}

module.exports = IndexController;
