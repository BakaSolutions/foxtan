const router = require('koa-router')({ prefix: '/' });

const config = require('../../../helpers/config');
const Controller = require('../index');

router.get('captcha.html', async ctx => {
  return Controller.success(ctx, {
    width: config('captcha.width'),
    height: config('captcha.height'),
  }, 'pages/captcha');
});

module.exports = router;
