const config = require('../../Infrastructure/Config.js');
const Captcha = require('../../Infrastructure/Captcha/Number.js');
// TODO: Make Captcha switchable: Cyrillic, Latin, Number...

class CaptchaService {

  constructor() {
    this.captcha = new Captcha(config.get('captcha'));
  }

  async check({id, code} = {}) {
    // TODO: Captcha check
    return true;
  }

  generateDataURL() {
    return this.captcha.render('dataurl');
  }

  generateBuffer() {
    return this.captcha.render('buffer');
  }

}

module.exports = CaptchaService;