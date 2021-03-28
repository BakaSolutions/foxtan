const config = require('../../../../../app/helpers/config.js');
const TokenService = require('../../../../Infrastructure/TokenService.js');
const MainController = require('../MainController.js');

class CaptchaController extends MainController {

  constructor(router, DatabaseContext) {
    super();
    this.router = router;
    this.token = new TokenService(config);

    router.post('api/checkCaptcha', async ctx => {
      try {
        let { body: { id, code }, token } = ctx.request;
        if (!id && !code) { // TODO: Captcha service
          return ctx.body = {
            passed: true,
            trustedPostCount: 1
          }
        }

        /*
        if (!id) {
          id = ctx.cookies.get('captcha', {signed: config('cookie.signed')});
        }
        ctx.cookies.set('captcha', undefined);

        if (!token
          || typeof token.trustedPostCount === 'undefined'
          || token.trustedPostCount < 1) {
          token.trustedPostCount = 0;
        }

        let passed = await CaptchaService.check({
          id,
          code
        });

        if (passed) {
          token.trustedPostCount += config('captcha.postsPerCaptcha');
          token = this.token.createToken(token);
          this.token.setToken(ctx, token);
        }

        let out = {
          passed,
          trustedPostCount: token.trustedPostCount
        };
        this.success(ctx, out);
        */
      } catch (e) {
        this.fail(ctx, e);
      }
    });
  }

}

module.exports = CaptchaController;
