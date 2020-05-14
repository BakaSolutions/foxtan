const router = require('koa-router')();

const config = require('../../../helpers/config.js');
const CaptchaLogic = require('../../../logic/captcha.js');
const UserLogic = require('../../../logic/user.js');

const HTTP = require('../index.js');

function onlyExactGetParam(params, param) {
  return params.every(p => p.toLowerCase() === param);
}

router.get('/api/captcha', async ctx => {
  try {
    let getParams = Object.keys(ctx.request.query);

    if (onlyExactGetParam(getParams, 'frame')) {
      return HTTP.success(ctx, {ttl: config('captcha.ttl')}, 'pages/captchaFrame');
    }

    let captcha = CaptchaLogic.create();
    ctx.type = captcha.mime;
    ctx.cookies.set('captcha', captcha.id, {
      signed: config('cookie.signed'),
      maxAge: config('captcha.ttl') * 1000,
      overwrite: true
    });

    if (onlyExactGetParam(getParams, 'data')) {
      return HTTP.success(ctx, {
        id: captcha.id,
        image: await captcha.render('dataurl'),
        ttl: config('captcha.ttl') * 1000
      });
    }
    return HTTP.success(ctx, await captcha.render('buffer'));
  } catch (e) {
    return HTTP.fail(ctx, e);
  }
});

router.post('/api/checkCaptcha', async ctx => {
  try {
    let {id, code} = ctx.request.body;

    if (!id) {
      id = ctx.cookies.get('captcha', {signed: config('cookie.signed')});
    }
    ctx.cookies.set('captcha');

    let passed = await CaptchaLogic.check({
      id,
      code
    });
    let out = {passed};
    let tokenInfo = ctx.request.token;

    if (!tokenInfo || typeof tokenInfo.trustedPostCount === 'undefined' || !tokenInfo.trustedPostCount) {
      tokenInfo.trustedPostCount = 0;
    }

    if (passed) {
      tokenInfo.trustedPostCount += config('captcha.postsPerCaptcha');
      let token = UserLogic.createToken(tokenInfo);
      UserLogic.setToken(ctx, token);
    }

    out.trustedPostCount = tokenInfo.trustedPostCount;

    return HTTP.success(ctx, out);
  } catch (e) {
    return HTTP.fail(ctx, e);
  }
});

module.exports = router;
