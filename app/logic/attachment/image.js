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
    if (this.metadata.width <= config('files.thumbnailWidth') || this.metadata.height <= config('files.thumbnailHeight')) {
      return filePath;
    }

    filePath = filePath.replace(/\.(.+)$/, '.' + config('files.thumbnailExtension'));

    let buffer = await this.image
        .resize(200, 200)
        .max()
        .toFormat(config('files.thumbnailExtension'), config('files.thumbnailOptions'))
        .toBuffer();

    await FS.writeFile(config('directories.thumb') + filePath, buffer, 'thumb');

    return filePath;
  }

}

module.exports = ImageAttachment;
