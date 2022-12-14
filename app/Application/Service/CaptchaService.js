const config = require('../../Infrastructure/Config.js');
const redis = require('../../Infrastructure/Redis.js');

class CaptchaService {

  constructor() {
    this.storage = redis();
    this.captchaType = config.get("captcha.type", "Number");
    this.captcha = require(`../../Infrastructure/Captcha/${this.captchaType}.js`);
  }

  generateCID({ key, timestamp }) {
    return `${key}:${timestamp}`;
  }

  async check({key, timestamp, code} = {}) {
    let cid = this.generateCID({key, timestamp});
    let trueCode = await this.storage.hget(`captcha:${cid}`, 'code');
    await this.storage.del(`captcha:${cid}`);
    if (!trueCode) {
      return false;
    }
    return this.captcha._check(code, trueCode);
  }

  async getCaptcha({key, timestamp}) {
    let cid = this.generateCID({ key, timestamp });
    let image = await this.storage.hgetBuffer(`captcha:${cid}`, 'image');
    if (!image) {
      let captcha = new this.captcha(cid);
      image = await captcha.render('buffer');
      await this.save(cid, captcha.code, image);
    }
    return {
      image,
      mime: config.get('captcha.mime')
    }
  }

  async save(cid, code, image) {
    let hash = {
      code,
      image
    }
    await this.storage.hset(`captcha:${cid}`, hash);
    await this.storage.expire(`captcha:${cid}`, config.get('captcha.ttl'));
  }

}

module.exports = CaptchaService;