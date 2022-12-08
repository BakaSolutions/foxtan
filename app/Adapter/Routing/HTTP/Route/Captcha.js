const config = require('../../../../Infrastructure/Config.js');
const MainController = require('../MainController.js');

class CaptchaController extends MainController {

  constructor(Router, { CaptchaService }) {
    super(Router);
    this.captcha = CaptchaService;

    Router.post('api/checkCaptcha', this.checkCaptcha.bind(this));
    Router.get('api/captcha', this.getCaptcha.bind(this));
  }

  async checkCaptcha(ctx) {
    try {
      let { body: { id, code } } = ctx.request;

      if (!id) {
        id = ctx.cookies.get('captcha', {signed: config.get('cookie.signed')});
      }
      ctx.cookies.set('captcha', undefined);
      /*
      if (!token
        || typeof token.trustedPostCount === 'undefined'
        || token.trustedPostCount < 1) {
        token.trustedPostCount = 0;
      }
      */
      let passed = await this.captcha.check({
        id,
        code
      });

      /*
      if (passed) {
        token.trustedPostCount += config.get('captcha.postsPerCaptcha');
        token = this.token.createToken(token);
        this.token.setToken(ctx, token);
      }
      */
      let out = {
        passed,
        trustedPostCount: 1 //token.trustedPostCount
      };
      this.success(ctx, out);
    } catch (e) {
      this.fail(ctx, e);
    }
  }

  async getCaptcha(ctx) {
    try {
      if (this.isAJAXRequested(ctx)) {
        return this.success(ctx, {
          id: 1, // TODO: Create CaptchaLogic
          image: await this.captcha.generateDataURL()
        })
      }
      // TODO: Set cookie with captcha id
      let image = await this.captcha.generateBuffer();
      ctx.type = config.get('captcha.mime');
      this.success(ctx, image);
    } catch (e) {
      this.fail(ctx, e);
    }
  }

}

module.exports = CaptchaController;
