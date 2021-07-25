const { createCanvas } = require('canvas');

class Captcha {

  constructor(o) {
    this.config = {
      size: o.size
    }
    this.smallLetters = o.smallLetters || false;
    this.fontPerks = o.fontPerks || false;
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

    this.noise = !!o.noise || false;
    this.mime = o.mime || 'image/png';
  }

  configure() {
    this.id = this._random(0, Math.pow(2, 48));
    this.size = this.config.size || this._random(5, 7);
    this.text = this._generate(this.size);
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

    let background = ctx.fillStyle = this.background[this._random(0, this.background.length - 1)];
    let color = ctx.strokeStyle = this.color[this._random(0, this.color.length - 1)];
    ctx.lineJoin = 'round';
    ctx.fillRect(0, 0, this.width, this.height);

    this.vw = this.width / 100;
    this.vh = this.height / 100;

    this._eraseLetters(ctx, 3);

    this._renderLetters(ctx);

    if (this.noise) {
      this._eraseLetters(ctx, 4, background);
      this._eraseLetters(ctx, 3, color);
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
        if (Math.random() < 0.5) perks += 'italic ';
      }
      perks += this._random(75*vh/this.size*5, 85*vh/this.size*5) + 'px ';
      if (this.fontPerks && Math.random() < 0.5) {
        ctx.font = perks + 'sans-serif';
      } else {
        ctx.font = perks + 'sans';
      }
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

  _generate(length) {
    return null;
  }

}

module.exports = Captcha;
