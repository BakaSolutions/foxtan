const config = require('../../../../../app/helpers/config.js');

class IndexController {

  constructor(router) {
    this.router = router;

    router.get('api/meta', async ctx => {
      ctx.body = {
        engine: 'Foxtan/' + config('server.version'),
        res: config('paths.upload'),
        thumb: config('paths.thumb'),
        ws: config('paths.ws')
      }
    });
  }

}

module.exports = IndexController;
