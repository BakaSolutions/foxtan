const Crypto = require('../../helpers/crypto');
const FS = require('../../helpers/fs');
const Tools = require('../../helpers/tools');
const AttachmentModel = require('../../models/mongo/attachment');

class Attachment {

  constructor(file) {
    this.file = file;
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

    let label = {
      boardName: this.file.boardName,
      postNumber: this.file.postNumber
    };
    let now = new Date;

    let exists = await this.exists();

    if (!exists) {
      let mimeSplit = this.file.mime.split('/');
      let extension = mimeSplit[1] || this.file.mime;
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
        createdAt: now,
        updatedAt: now
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

    let neededToDeleteFile = await this._deleteHash(boardName, postNumber);
    if (neededToDeleteFile) {
      await this._deleteFile(exists);
    }
  }

  async _deleteHash(boardName, postNumber) {
    let index = exists.posts.indexOf({boardName, postNumber}) === -1;

    if (exists.posts.length > 1) {
      return await AttachmentModel.update({
        query: {
          _id: this.hash
        },
        fields: {
          posts: exists.posts.splice(index, 1),
          updatedAt: now
        }
      })
    }

    return await AttachmentModel.deleteOne({
      '_id': this.hash
    });
  }

  _deleteFile(meta) {
    if (!meta) {
      return false;
    }
    let extension = meta.mime.split('/')[1];
    return FS.unlinkSync(`${config('directories.upload') + this.hash}.${extension}`);
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
