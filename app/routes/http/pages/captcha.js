const router = require('koa-router')();

const config = require('../../../helpers/config');
const HTTP = require('../index');

router.get('/captcha.html', async ctx => {
  return HTTP.success(ctx, {
    width: config('captcha.width'),
    height: config('captcha.height'),
  }, 'pages/captcha');
});

module.exports = router;
