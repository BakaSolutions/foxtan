const config = require('../../../../Infrastructure/Config.js');
const TokenService = require('../../../../Infrastructure/TokenService.js');
const MainController = require('../MainController.js');

class CaptchaController extends MainController {

  constructor(Router, DatabaseContext) {
    super(Router);
    this.token = new TokenService(config);

    Router.post('api/checkCaptcha', this.checkCaptcha.bind(this));
  }

  async checkCaptcha(ctx) {
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
  }

}

module.exports = CaptchaController;
