let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.error(e);
  process.exit(1);
}

const FileFromPath = require('./index.js');
const config = require('../../helpers/config.js');
const FS = require('../../helpers/fs.js');

module.exports = class Image extends FileFromPath {
  constructor(args) {
    super(args);
    if (args.modifiers.includes('nsfw')) {
      this.file.modifiers.push('nsfw');
    }
    this.readImage();
  }
  async check() {
    await super.check();
    let {width, height} = await this.getDimensions();
    if (width > config('files.maxWidth') || height > config('files.maxHeight')) {
      throw new Error('Potentially dangerous image');
    }
    this.file.width = width;
    this.file.height = height;
    return true;
  }
  async store() {
    await super.store();
    this.readImage();
    return this.path;
  }
  async createThumb() {
    let {width: w, height: h} = this.file;
    let {width: cw, height: ch, options} = config('files.thumbnail');
    if (w <= cw && h <= ch) {
      return false; // TODO: Do smth with small images
    }
    let extension = await this.decideThumbExtension();
    let buffer;
    let proportion = w / h;
    let background = { r: 0, g: 0, b: 0, alpha: 0 };

    if (proportion > 1.25) { // wide image
      buffer = this.image
        .resize({
          width: cw,
          height: ch * 0.75,
          background
        });
    } else if (proportion < 0.75) { // tall image
      buffer = this.image
        .resize({
          width: cw * 0.75,
          height: ch,
          background
        });
    } else {
      buffer = this.image
        .resize({
          width: cw,
          height: ch,
          fit: 'contain',
          background
        });
    }

    buffer = await buffer
      .toFormat(extension, options)
      .toBuffer();

    let thumbFullPath = config('directories.thumb') + this.file.hash + '.' + extension;

    try {
      await FS.writeFile(thumbFullPath, buffer, 'thumb');

      let {width, height} = await sharp(thumbFullPath).metadata();

      this.file.thumbWidth = width;
      this.file.thumbHeight = height;
    } catch (e) {
      await FS.unlink(thumbFullPath);
      throw e;
    }
  }

  readImage() {
    try {
      this.image = sharp(this.path);
    } catch (e) {
      console.log('sharp error', e);
      throw e;
    }
  }
  async getDimensions() {
    return this.image.metadata();
  }
};
