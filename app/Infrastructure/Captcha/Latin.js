const Captcha = require('./index.js');

class LatinCaptcha extends Captcha {

  _generate(length = this.size) {
    let out = '';

    let alphabet = 'ABEFGHKNPRSTXYZ';
    if (this.smallLetters) {
      alphabet += 'abefghknprstxyz';
    }

    for (let i = 0; i < length; i++) {
      out += alphabet[this._random(0, alphabet.length - 1)];
    }

    return out;
  }

}

module.exports = LatinCaptcha;
