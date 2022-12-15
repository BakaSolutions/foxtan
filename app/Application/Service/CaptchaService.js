const config = require('../../Infrastructure/Config.js');
const redis = require('../../Infrastructure/Redis.js');
const { BadRequestError } = require('../../Domain/Error/index.js');

class CaptchaService {

  // CAPTCHA_TIMEOUT = config.get('captcha.ttl') * 1000;
  CACHE_IMAGES = config.get('captcha.cacheImages');

  constructor() {
    this.storage = redis();
    this.captchaType = config.get("captcha.type", "Number");
    this.captcha = require(`../../Infrastructure/Captcha/${this.captchaType}.js`);
  }

  generateCID({ key, timestamp }) {
    return `${key}:${timestamp}`;
  }

  checkTimestamp(timestamp) {
    if (!timestamp) {
      throw new BadRequestError("Provide current timestamp");
    }
    /* if (+new Date() - timestamp > this.CAPTCHA_TIMEOUT) {
      throw new BadRequestError("Captcha has expired");
    }
    if (timestamp - +new Date() > this.CAPTCHA_TIMEOUT) {
      throw new BadRequestError("Time travels have not been invented yet");
    } */
  }

  async checkCaptcha({key, timestamp, code} = {}) {
    this.checkTimestamp(timestamp);
    let cid = this.generateCID({key, timestamp});
    let storedCode = await this.storage.hget(`captcha:${cid}`, 'code');
    await this.storage.del(`captcha:${cid}`);
    if (!storedCode) {
      throw new BadRequestError('Captcha has expired');
    }
    let passed = this.captcha._check(code, storedCode);
    if (!passed) {
      throw new BadRequestError('Сaptcha was solved incorrectly');
    }
    return passed;
  }

  async getCaptcha({key, timestamp}) {
    this.checkTimestamp(timestamp);
    let cid = this.generateCID({ key, timestamp });
    let { code, image } = await this.storage.hgetallBuffer(`captcha:${cid}`);

    if (!image) {
      let captcha = new this.captcha(cid, code?.toString());
      image = await captcha.render('buffer');
      if (!code) {
        await this.save(cid, captcha.code, image);
      }
    }

    return {
      image,
      mime: config.get('captcha.mime')
    }
  }

  async save(cid, code, image) {
    let hash = { code };
    if (this.CACHE_IMAGES) {
      hash.image = image;
    }
    await this.storage.hset(`captcha:${cid}`, hash);
    await this.storage.expire(`captcha:${cid}`, config.get('captcha.ttl'));
  }

}

module.exports = CaptchaService;