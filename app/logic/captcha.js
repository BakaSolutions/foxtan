const CommonLogic = require('./common');

const CaptchaHelper = require('../helpers/captcha');
const config = require('../helpers/config');
const RedisModel = require('../models/redis');
const redis = RedisModel();

let Captcha = module.exports = {};

Captcha.create = () => {
  let captcha = new CaptchaHelper(config('captcha'));
  redis.set(`captcha:${captcha.id}`, captcha.text, 'EX', config('captcha.ttl'));
  return captcha;
};

Captcha.check = async ({id, code}) => {
  try {
    if (CommonLogic.hasEmpty({
      id,
      code
    })) {
      return false;
    }
    let key = `captcha:${id}`;
    let result = await redis.get(key);
    redis.del(key);
    return result === code;
  } catch {
    return false;
  }
};
