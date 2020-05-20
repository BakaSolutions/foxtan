const config = require('../../../helpers/config');
const router = require('koa-router')({
  prefix: config('server.pathPrefix')
});

const IndexLogic = require('../../../logic');
const HTTP = require('../index');

router.all('/', ctx => {
  HTTP.fail(ctx, {
    status: 400,
    message: 'Use `GET /api/meta` according to API'
  });
});

router.get('api/meta', ctx => {
  HTTP.success(ctx, IndexLogic.index());
});

module.exports = router;
