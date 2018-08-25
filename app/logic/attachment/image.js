const sharp = require('sharp');

const config = require('../../helpers/config');
const FS = require('../../helpers/fs');

const { Attachment } = require('./index');

class ImageAttachment extends Attachment {

  constructor(file) {
    super(file);
    this.image = sharp(file.path);
  }

  async checkFile() {
    let {width, height} = await this.image.metadata();

    if (width >= config('files.maxWidth') || height >= config('files.maxHeight')) {
      throw {
        status: 400,
        message: 'Potentially dangerous image'
      };
    }

    this.file = Object.assign(this.file, { width, height });

    return true;
  }

  async createThumb(path) {
    let {width: w, height: h} = this.file;
    let {width: cw, height: ch, extension, options} = config('files.thumbnail');
    if (w <= cw && h <= ch) {
      return false; // TODO: Do smth with small images
    }

    path = path.replace(/\.(.+)$/, '.' + extension);


    let proportion = w / h;
    let buffer;

    if (proportion > 1.25) { // wide image
      buffer = this.image
        .resize(cw, cw * 0.75)
        .crop(sharp.strategy.attention);
    } else if (proportion < 0.75) { // tall image
      buffer = this.image
        .resize(ch * 0.75, ch)
        .crop(sharp.strategy.attention);
    } else {
      buffer = this.image
        .resize(cw, ch)
        .max();
    }

    buffer = await buffer
      .toFormat(extension, options)
      .toBuffer();

    let thumbFullPath = config('directories.thumb') + path;

    await FS.writeFile(thumbFullPath, buffer, 'thumb');

    let {width, height} = await sharp(thumbFullPath).metadata();

    return this.file.thumb = {
      path,
      width,
      height
    };
  }

}

module.exports = ImageAttachment;
