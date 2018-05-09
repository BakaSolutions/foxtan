const Crypto = require('../../helpers/crypto');
const FS = require('../../helpers/fs');
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

      await AttachmentModel.create({
        _id: this.hash,
        posts: [
          label
        ],
        mime: this.file.mime,
        size: this.file.size,
        path: filePath,
        createdAt: now,
        updatedAt: now
      });

      await FS.renameFile(this.file.path, filePath, 'upload');

      return this;
    }

    if (exists.posts.indexOf(label) === -1) {
      exists.posts.push(label);

      await AttachmentModel.update({
        whereKey: '_id',
        whereValue: this.hash,
        fields: {
          posts: exists.posts,
          updatedAt: now
        }
      })
    }

    return this;
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
        whereKey: '_id',
        whereValue: this.hash,
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

module.exports = Attachment;
