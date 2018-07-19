const { createCanvas } = require('canvas');

const ALPHABET_LATIN_C = 'ABEFGHKNPRSTXYZ';
const ALPHABET_LATIN_S = 'abefghknprstxyz';
const ALPHABET_CYRILLIC_C = 'АБВГДЕИКНПРСТУФХЦЧЭЯ';
const ALPHABET_CYRILLIC_S = 'абвгдеикнпрстуфхцчэя';

const ALPHABET_LATIN_CV = ['BCFGHKNPRSTZ', 'AEY'];
const ALPHABET_CYRILLIC_CV = ['БВГДКНПРСТФХЦ', 'АЕИУЯ'];

const ALPHABET_NUMBERS = '0123456789';

class Captcha {

  constructor(o) {
    this.latin = o.latin || false;
    this.cyrillic = o.cyrillic || false;
    this.numbers = o.numbers || false;
    this.syllable = o.syllable || false;
    this.smallLetters = o.smallLetters || false;
    this.fontPerks = o.fontPerks || false;
    this.complexity = o.complexity || 75;

    this.size = o.size || this._random(5, 7);
    this.text = o.text || this._generate();
    if (this.text === o.text) {
      this.size = this.text.length;
    }

    this.width = o.width || 200;
    this.height = o.height || 84;
    this.lineWidth = o.lineWidth || 3;

    this.color = o.color || '#000';
    if (!Array.isArray(this.color)) {
      this.color = [ this.color ];
    }

    this.lineColor = o.lineColor || '#000';
    if (!Array.isArray(this.lineColor)) {
      this.lineColor = [ this.lineColor ];
    }

    this.background = o.background || '#fff';
    if (!Array.isArray(this.background)) {
      this.background = [ this.background ];
    }

    this.noise = !!o.noise || false;
    this.mime = o.mime || 'image/png';

    this.id = this._generate();
  }

  createCanvas() {
    if (!this.ctx) {
      this.canvas = createCanvas(this.width, this.height);
      this.ctx = this.canvas.getContext('2d');
    }
    return this.ctx;
  }

  render(output = 'dataurl') {
    const ctx = this.createCanvas();

    this.background = ctx.fillStyle = this.background[this._random(0, this.background.length - 1)];
    this.color = ctx.strokeStyle = this.color[this._random(0, this.color.length - 1)];
    ctx.lineJoin = 'round';
    ctx.fillRect(0, 0, this.width, this.height);

    this.vw = this.width / 100;
    this.vh = this.height / 100;

    this._eraseLetters(ctx, 3);

    this._renderLetters(ctx);

    if (this.noise) {
      this._eraseLetters(ctx, 4, this.background);
      this._eraseLetters(ctx, 3, this.color);
    }

    return new Promise((resolve, reject) => {
      let method = (output.toLowerCase() === 'dataurl')
          ? 'toDataURL'
          : 'toBuffer';
      return this.canvas[method]((err, jpeg) => {
        if (err) {
          return reject(err);
        }
        resolve(jpeg);
      });
    });
  }

  _eraseLetters(ctx, iterations = 6, lineColor, lineWidth = this.lineWidth / 2) {
    let vw = this.vw;
    let vh = this.vh;

    ctx.lineWidth = lineWidth;
    if (lineColor) {
      ctx.strokeStyle = lineColor;
    }

    for (let i = 0; i < iterations; i++) {
      ctx.beginPath();
      ctx.moveTo(0, this._random(0, 100*vh));
      ctx.bezierCurveTo(
          33*vw, this._random(0, 100*vh),
          67*vw, this._random(0, 100*vh),
          this.width, this._random(0, 100*vh)
      );
      ctx.stroke();
      ctx.closePath();
    }
  }

  _renderLetters(ctx) {
    let vw = this.vw;
    let vh = this.vh;
    let offset = this._random(8*vw, (34 - this.size * this.complexity/100)*vw);
    let height = 50*vh;

    ctx.strokeStyle = this.color;

    ctx.beginPath();
    for (let i = 0; i < this.size; i++) {
      let perks = 'bold ';
      if (this.fontPerks) {
        if (Math.random() < 0.5) perks = '';
        if (Math.random() < 0.5) perks += 'italic ';
      }
      ctx.font = perks + this._random(75*vh/this.size*5, 85*vh/this.size*5) + 'px sans';
      ctx.lineWidth = this._random(2, this.lineWidth);

      ctx.save();
      ctx.translate(this.complexity*vw / this.size * i + offset, height += this._random(-8*vh, 8*vh));
      let char = ctx.measureText(this.text[i]);
      ctx.rotate(this._random(-10, 10) * Math.PI / 180);
      ctx.fillText(this.text[i], -char.width/2, char.actualBoundingBoxAscent/2);
      ctx.strokeText(this.text[i], -char.width/2, char.actualBoundingBoxAscent/2);
      ctx.restore();
    }
    ctx.closePath();
  }

  _random(min = 0, max = 1) {
    return Math.floor(min + Math.random() * (max + 1 - min));
  }

  _generate() {
    let out = '';
    let alphabet = '';

    if (this.cyrillic) {
      alphabet += ALPHABET_CYRILLIC_C;
      if (this.smallLetters) {
        alphabet += ALPHABET_CYRILLIC_S;
      }
    }
    if (this.latin) {
      alphabet += ALPHABET_LATIN_C;
      if (this.smallLetters) {
        alphabet += ALPHABET_LATIN_S;
      }
    }
    if (this.numbers) {
      alphabet += ALPHABET_NUMBERS;
    }

    if (this.syllable) {
      // me, meh, hme, e
      alphabet = this.latin
        ? ALPHABET_LATIN_CV
        : ALPHABET_CYRILLIC_CV;
      while (out.length < this.size) {
        let chance = Math.random();
        if (chance < 0.8) { // me
          out += alphabet[0][this._random(0, alphabet[0].length - 1)] + alphabet[1][this._random(0, alphabet[1].length - 1)];
        } else if (chance < 0.85) { // meh
          out +=
              alphabet[0][this._random(0, alphabet[0].length - 1)] +
              alphabet[1][this._random(0, alphabet[1].length - 1)] +
              alphabet[0][this._random(0, alphabet[0].length - 1)];
        } else if (chance < 0.9) { // hme
          out +=
              alphabet[0][this._random(0, alphabet[0].length - 1)] +
              alphabet[0][this._random(0, alphabet[0].length - 1)] +
              alphabet[1][this._random(0, alphabet[1].length - 1)];
        } else { // e
          out += alphabet[1][this._random(0, alphabet[1].length - 1)];
        }
      }
      if (out.length > this.size) {
        out = out.slice(0, this.size);
      }
    } else {
      for (let i = 0; i < this.size; i++) {
        out += alphabet[this._random(0, alphabet.length - 1)];
      }
    }
    return out;
  }

}

module.exports = Captcha;

/*
const Koa = require('koa');
const app = new Koa();

app.use(async ctx => {
  let captcha = new Captcha({
    width: 192,
    height: 64,
    size: 6,
    latin: 0,
    cyrillic: 0,
    numbers: 1,
    smallLetters: 0,
    syllable: 0,
    complexity: 66,
    fontPerks: 0,
    noise: 1,
    color: ['#f60', '#6a6', '#9de', '#6bc'],
    //color: ['#ff6ec7', '#8a2be2', '#daa520', '#ffd700', 'red', '#f5fffa'],
    background: ['#011', '#122', '#233']
  });
  /!*const canvas = captcha.createCanvas();
  let gradient = canvas.createLinearGradient(0,0,0,captcha.height);
  gradient.addColorStop(0,  "#0066cc");
  gradient.addColorStop(1,  "#ffcc00");
  gradient.addColorStop(-1,  "#ffcc00");
  gradient.addColorStop(0,  "#ffcc00");
  captcha.color = [gradient];*!/
  ctx.body = '<img src="' + await captcha.render() + '" />';
});

app.listen(3000);
*/
