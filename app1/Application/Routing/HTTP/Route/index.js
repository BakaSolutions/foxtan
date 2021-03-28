const config = require('../../../../../app/helpers/config.js');
const MainController = require('../MainController.js');

class IndexController extends MainController {

  constructor(router) {
    super();
    this.router = router;

    router.get('api/meta', async ctx => {
      this.success(ctx, {
        engine: 'Foxtan/' + config('server.version'),
        res: config('paths.upload'),
        thumb: config('paths.thumb'),
        ws: config('paths.ws')
      });
    });
  }

}

module.exports = IndexController;
