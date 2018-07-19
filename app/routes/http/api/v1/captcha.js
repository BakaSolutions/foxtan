const router = require('koa-router')({ prefix: '/api/v1/captcha.' });

const config = require('../../../../helpers/config');
const CaptchaLogic = require('../../../../logic/captcha');

const Controller = require('../../index');

router.get('image', async ctx => {
  let captcha = CaptchaLogic.create();
  ctx.type = captcha.mime;
  ctx.cookies.set('captcha', captcha.id, {
    signed: config('cookie.signed'),
    maxAge: +new Date + config('captcha.ttl') * 1000,
    overwrite: true
  });
  if (Controller.isAJAXRequested(ctx)) {
    return Controller.success(ctx, {
      id: captcha.id,
      image: await captcha.render('dataurl')
    });
  }
  return Controller.success(ctx, await captcha.render('buffer'));
});

router.get('frame', async ctx => {
  if (Controller.isAJAXRequested(ctx)) {
    return Controller.fail(ctx, {
      status: 405,
      message: 'Use captcha.image instead'
    })
  }
  return Controller.success(ctx, {ttl: config('captcha.ttl')}, 'pages/captcha');
});

router.post('check', async ctx => {
  let { id, code } = ctx.request.body;
  if (!id) {
    id = ctx.cookies.get('captcha', {signed: config('cookie.signed')});
  }
  ctx.cookies.set('captcha');
  return Controller.success(ctx, await CaptchaLogic.check({id, code}));
});

module.exports = router;