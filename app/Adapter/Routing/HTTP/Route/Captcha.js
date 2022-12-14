const config = require('../../../../Infrastructure/Config.js');
const MainController = require('../MainController.js');
const { BadRequestError } = require('../../../../Domain/Error/index.js');

class CaptchaController extends MainController {

  CAPTCHA_TIMEOUT = config.get('captcha.ttl') * 1000;

  constructor(Router, { CaptchaService }) {
    super(Router);
    this.captcha = CaptchaService;

    Router.post('api/checkCaptcha', this.checkCaptcha.bind(this));
    Router.get('api/captcha', this.getCaptcha.bind(this));
  }

  async checkCaptcha(ctx) {
    try {
      let { body: { timestamp, code } } = ctx.request;
      let { key } = ctx.session;
      ctx.session.trustedPostCount ??= 0;

      let passed = await this.captcha.check({key, timestamp, code});
      if (passed) {
        ctx.session.trustedPostCount += config.get('captcha.postsPerCaptcha', 1);
      }

      let out = {
        passed,
        trustedPostCount: ctx.session?.trustedPostCount
      };
      this.success(ctx, out);
    } catch (e) {
      this.fail(ctx, e);
    }
  }

  async getCaptcha(ctx) {
    try {
      let { timestamp } = ctx.query;
      if (+new Date() - timestamp > this.CAPTCHA_TIMEOUT) {
        throw new BadRequestError("Captcha is expired");
      }
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
