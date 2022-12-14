const { createCanvas } = require('canvas');
const { randomInt } = require('crypto');
const config = require('../../Infrastructure/Config.js');

class Captcha {

  constructor(cid, o = config.get('captcha')) {
    this.id = cid || this._random(0, Math.pow(2, 32));
    this.sizeConfig = {
      min: o.size?.min ?? 5,
      max: o.size?.max ?? 7
    };
    this.smallLetters = o.smallLetters ?? false;
    this.fontPerks = o.fontPerks ?? false;
    this.complexity = o.complexity || 75;

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

    this.noise = !!o.noise ?? false;
    this.mime = o.mime || 'image/png';
    this.imageConfig = {
      quality: o.quality || 100,
      compressionLevel: o.compressionLevel || 9
    }
  }

  configure() {
    this.size = this._randomIncl(this.sizeConfig.min, this.sizeConfig.max);
    this.code = this._generate(this.size);
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
    this.configure();

    let background = ctx.fillStyle = this.background[this._random(0, this.background.length)];
    let color = ctx.strokeStyle = this.color[this._random(0, this.color.length)];
    ctx.lineJoin = 'round';
    ctx.fillRect(0, 0, this.width, this.height);

    this.vw = this.width / 100;
    this.vh = this.height / 100;

    this._eraseLetters(ctx, 4);

    this._renderLetters(ctx);

    if (this.noise) {
      this._eraseLetters(ctx, 4, background);
      this._eraseLetters(ctx, 4, color);
    }

    return new Promise((resolve, reject) => {
      let method = (output.toLowerCase() === 'dataurl')
        ? 'toDataURL'
        : 'toBuffer';
      return this.canvas[method]((err, image) => {
        if (err) {
          return reject(err);
        }
        resolve(image);
      }, this.mime, this.imageConfig);
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
      ctx.moveTo(0, this._randomIncl(0, 100)*vh);
      ctx.bezierCurveTo(
        33*vw, this._randomIncl(0, 100)*vh,
        67*vw, this._randomIncl(0, 100)*vh,
        this.width, this._randomIncl(0, 100)*vh
      );
      ctx.stroke();
      ctx.closePath();
    }
  }

  _renderLetters(ctx) {
    let vw = this.vw;
    let vh = this.vh;
    let offset = this._randomIncl(6*vw, (30 - this.size * this.complexity/100)*vw);
    let height = this._randomIncl(40, 60)*vh;

    ctx.strokeStyle = this.color;

    ctx.beginPath();
    for (let i = 0; i < this.size; i++) {
      let perks = 'bold ';
      if (this.fontPerks) {
        if (Math.random() < 0.5) perks += 'italic ';
      }
      perks += this._randomIncl(75, 100)*vh/this.size*5 + 'px ';
      if (this.fontPerks && Math.random() < 0.5) {
        ctx.font = perks + 'sans-serif';
      } else {
        ctx.font = perks + 'sans';
      }
      ctx.lineWidth = this._randomIncl(2, this.lineWidth);

      ctx.save();
      ctx.translate(this.complexity*vw / this.size * i + offset, height += this._randomIncl(-10, 10) * vh);
      let char = ctx.measureText(this.code[i]);
      ctx.rotate(this._randomIncl(-10, 10) * Math.PI / 180);
      //ctx.fillText(this.code[i], -char.width/2, char.actualBoundingBoxAscent/2);
      ctx.strokeText(this.code[i], -char.width/2, char.actualBoundingBoxAscent/2);
      ctx.restore();
    }
    ctx.closePath();
  }

  /**
   * Returns an integer in [min, max)
   * @param min
   * @param max
   * @returns {number}
   * @private
   */
  _random(min = 0, max = 2) {
    return randomInt(Math.floor(min), Math.floor(max));
  }

  /**
   * Returns an integer in [min, max]
   * @param min
   * @param max
   * @returns {number}
   * @private
   */
  _randomIncl(min = 0, max = 1) {
    return this._random(min, max+1);
  }

  _generate(length) {
    throw new Error('Captcha generator is not implemented');
  }

  static _check(code, trueCode) {
    throw new Error('Captcha checker is not implemented');
  }

}

module.exports = Captcha;
