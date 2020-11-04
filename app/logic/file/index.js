const FS = require('../../helpers/fs.js');
const Crypto = require('../../helpers/crypto.js');

const File = require('../../object/File.js');

const MEBIBYTE = 1048576;

module.exports = class FileFromPath {
  constructor({ mime, name, size, path } = {}) {
    this.file = new File({creative: true});
    this.file.mime = mime;
    this.file.title = name;
    //this.file.size = size;
    this.path = path;
  }
  async createHash() {
    let file = await FS.readFile(this.path); // TODO: create hash from stream
    return this.file.hash = Crypto.crc32(file);
  }
  async check() {
    if (this.file.size > 20 * MEBIBYTE) {
      throw new Error('File size limit is exceeded.');
    }
    return true;
  }
  async store() {
    let [extension, ..._] = this.path.split('.').reverse();
    return this.path = await FS.renameFile(this.path, this.file.hash + '.' + extension, 'upload');
  }
  async createThumb() {
    return false;
  }

  async decideThumbExtension() {
    return 'jpg'; // TODO: decide on-demand, jpg or png
  }
  async unlink() {
    return FS.unlink(this.path);
  }
};
