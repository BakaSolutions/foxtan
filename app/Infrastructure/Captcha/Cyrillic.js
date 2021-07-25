const Captcha = require('./index.js');

class CyrillicCaptcha extends Captcha {

  _generate(length = this.size) {
    let out = '';

    let alphabet = 'АБВГДЕИКНПРСТУФХЦЧЭЯ';
    if (this.smallLetters) {
      alphabet += 'абвгдеикнпрстуфхцчэя';
    }

    for (let i = 0; i < length; i++) {
      out += alphabet[this._random(0, alphabet.length - 1)];
    }

    return out;
  }

}

module.exports = CyrillicCaptcha;
