const config = require('../../helpers/config');
const Crypto = require('../../helpers/crypto');
const FS = require('../../helpers/fs');
const Tools = require('../../helpers/tools');
const AttachmentModel = require('../../models/mongo/attachment');

const debug = config('debug.enable');

class Attachment {

  constructor(file, hash) {
    this.file = file;
    this.hash = hash || null;
  }

  async createHash() {
    if (!this.file) {
      throw {
        status: 500,
        message: `Can't create a hash without a file.`
      }
    }
    return this.hash = Crypto.crc32(await FS.readFile(this.file.path, null));
  }

  async checkFile() {
    return false;
  }

  async createThumb() {
    return false;
  }

  async store() {
    if (!this.hash) {
      await this.createHash();
    }

    let now = new Date;

    let label = {
      boardName: this.file.boardName,
      postNumber: this.file.postNumber
    };

    let exists = await this.exists();

    if (debug && config('debug.log.files')) {
      console.log(`[File storing: ${this.hash}]: Does it exist in a storage? (${!!exists})`);
    }

    if (!exists) {
      let extension = this.file.name.split('.').pop() || this.file.mime.split('.').pop();
      let filePath = `${this.hash}.${extension}`;

      let out = {
        _id: this.hash,
        posts: [
          label
        ],
        mime: this.file.mime,
        size: this.file.size,
        name: this.file.name,
        path: filePath,
        createdAt: now
      };

      let thumb = await this.createThumb(filePath);

      if (thumb) {
        out.thumb = thumb;
      }

      await AttachmentModel.create(out);

      this.file.path = await FS.renameFile(this.file.path, filePath, 'upload');

      return this;
    }

    if (!exists.posts.includes(label)) {
      exists.posts.push(label);

      await AttachmentModel.update({
        query: {
          _id: this.hash
        },
        fields: {
          posts: exists.posts,
          updatedAt: now
        }
      })
    }
  }

  async exists() {
    return await AttachmentModel.readOne({
      _id: this.hash,
      clear: false
    });
  }

  async delete(boardName, postNumber) {
    let exists = await this.exists();
    if (!exists) {
      return true;
    }

    let neededToDeleteFile = await this._deleteHash(exists, boardName, postNumber);
    if (neededToDeleteFile) {
      await this._deleteFile(exists);
    }
  }

  async _deleteHash(exists, boardName, postNumber) {
    let index = exists.posts.findIndex(i => i.boardName === boardName && i.postNumber === postNumber);

    if (debug && config('debug.log.files')) {
      console.log(`[File deleting: ${boardName}:${postNumber}]: Post index is ${index}`);
    }

    exists.posts.splice(index, 1);

    if (exists.posts.length) {
      if (debug && config('debug.log.files')) {
        console.log(`[File deleting: ${boardName}:${postNumber}]: Updating file entry coz it's used ${exists.posts.length} time(s)...`);
      }
      await AttachmentModel.update({
        query: {
          _id: this.hash
        },
        fields: {
          posts: exists.posts,
          updatedAt: new Date
        }
      });
      return null;
    }

    if (debug && config('debug.log.files')) {
      console.log(`[File deleting: ${boardName}:${postNumber}]: Deleting file entry... (there are no posts)`);
    }

    await AttachmentModel.deleteOne({
      _id: this.hash
    });
    return true;
  }

  _deleteFile(meta) {
    if (debug && config('debug.log.files')) {
      console.log(`[File deleting: ${this.hash}]: Deleting file... ${config('directories.upload') + meta.path}`);
    }

    FS.unlinkSync(`${config('directories.upload') + meta.path}`);

    if (meta.thumb) {
      if (debug && config('debug.log.files')) {
        console.log(`[File deleting: ${this.hash}]: Deleting thumbnail... ${config('directories.thumb') + meta.path}`);
      }

      return FS.unlinkSync(`${config('directories.thumb') + meta.path}`);
    }

    if (debug && config('debug.log.files')) {
      console.log(`[File deleting: ${this.hash}]: There is no thumbnail!`);
    }
  }

}

let out = { Attachment };

(async () => {
  let types = await Tools.requireAll('logic/attachment/', /^(?!index\.).*?js$/);
  let typeNames = types[Tools.fileNames].map(type => Tools.capitalize(type.split('.')[0]));
  for (let typeIndex in typeNames) {
    let typeName = typeNames[typeIndex];
    out[typeName] = types[typeIndex];
  }
})();

module.exports = out;
