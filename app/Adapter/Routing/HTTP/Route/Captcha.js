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
    let out = {
      passed: false,
      trustedPostCount: ctx.session.trustedPostCount
    };
    try {
      let { body: { timestamp, code } } = ctx.request;
      let { key } = ctx.session;
      ctx.session.trustedPostCount ??= 0;

      await this.captcha.checkCaptcha({key, timestamp, code});

      ctx.session.trustedPostCount += config.get('captcha.postsPerCaptcha', 1);
      out.passed = true;
      out.trustedPostCount = ctx.session.trustedPostCount;
      this.success(ctx, out);
    } catch (e) {
      this.fail(ctx, e, out);
    }
  }

  async getCaptcha(ctx) {
    try {
      let { timestamp } = ctx.query;
      let { key } = ctx.session;
      let { image, mime } = await this.captcha.getCaptcha({ key, timestamp });
      ctx.type = mime;
      this.success(ctx, image);
    } catch (e) {
      this.fail(ctx, e);
    }
  }

}

module.exports = CaptchaController;
