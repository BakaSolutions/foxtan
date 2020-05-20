const config = require('../../../helpers/config');
const router = require('koa-router')({
  prefix: config('server.pathPrefix')
});

const HTTP = require('../index');

router.get('captcha.xhtml', async ctx => {
  return HTTP.success(ctx, {
    width: config('captcha.width'),
    height: config('captcha.height'),
  }, 'pages/captcha');
});

module.exports = router;
