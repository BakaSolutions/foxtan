const FS = require('../../helpers/fs.js');
const Crypto = require('../../helpers/crypto.js');

const File = require('../../object/file.js');

const FileModel = require('../../models/dao').DAO('file');

const MEBIBYTE = 1048576;

class FileFromPath {
  constructor({ mime, name, size, path } = {}) {
    this.file = new File();
    this.file.mime = mime;
    this.file.title = name;
    //this.file.size = size;
    this.path = path;
  }
  async createHash() {
    let file = await FS.readFile(this.path); // TODO: create hash from stream
    this.file.hash = Crypto.crc32(file);
  }
  async check() {
    if (this.file.size > 20 * MEBIBYTE) {
      throw new Error('File size limit is exceeded.');
    }
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
}

class FileFromHash {
  constructor(hash) {
    this.file = new File();
    this.file.hash = hash;
  }
  async create(postId) {
    try {
      let attachment = new File().bulk({
        postId,
        fileHash: this.file.hash
      });
      let file = await FileModel.create(attachment);
      return this.file = this.file.bulk(file);
    } catch (e) {
      //
    }
  }
  async exists() {

  }
  async read() {

  }
  async delete() {

  }
}

module.exports = {
  FileFromHash,
  FileFromPath
};
