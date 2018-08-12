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

    let dimensions = {width, height};

    this.file = Object.assign(this.file, dimensions);
    return true;
  }

  async createThumb(filePath) {
    let {width: w, height: h} = this.file;
    if (w <= config('files.thumbnail.width') || h <= config('files.thumbnail.height')) {
      return false;
    }

    filePath = filePath.replace(/\.(.+)$/, '.' + config('files.thumbnail.extension'));

    let buffer = await this.image
        .resize(config('files.thumbnail.width'), config('files.thumbnail.height'))
        .max()
        .toFormat(config('files.thumbnail.extension'), config('files.thumbnail.options'))
        .toBuffer();

    let thumbFullPath = config('directories.thumb') + filePath;

    await FS.writeFile(thumbFullPath, buffer, 'thumb');

    let {width, height} = await sharp(thumbFullPath).metadata();

    return this.file.thumb = {
      path: filePath,
      width,
      height
    };
  }

}

module.exports = ImageAttachment;
