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
    this.metadata = await this.image.metadata();
    if (this.metadata.width >= config('files.maxWidth') || this.metadata.height >= config('files.maxHeight')) {
      throw {
        status: 400,
        message: 'Potentially dangerous image'
      };
    }
    return true;
  }

  async createThumb(filePath) {
    if (this.metadata.width <= config('files.thumbnail.width') || this.metadata.height <= config('files.thumbnail.height')) {
      return true;
    }

    filePath = filePath.replace(/\.(.+)$/, '.' + config('files.thumbnail.extension'));

    let buffer = await this.image
        .resize(200, 200)
        .max()
        .toFormat(config('files.thumbnail.extension'), config('files.thumbnail.options'))
        .toBuffer();

    await FS.writeFile(config('directories.thumb') + filePath, buffer, 'thumb');

    return filePath;
  }

}

module.exports = ImageAttachment;
