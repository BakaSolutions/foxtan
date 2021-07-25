const Captcha = require('./index.js');

class NumberCaptcha extends Captcha {

  _generate(length = this.size) {
    let out = '';

    let alphabet = '01234576789';

    for (let i = 0; i < length; i++) {
      out += alphabet[this._random(0, alphabet.length - 1)];
    }

    return out;
  }

}

module.exports = NumberCaptcha;
