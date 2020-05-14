const config = require('../../helpers/config');
const Crypto = require('../../helpers/crypto');
const FS = require('../../helpers/fs');
const Tools = require('../../helpers/tools');
const AttachmentModel =  require('../../models/dao').DAO('attachment');

const debug = config('debug.enable');

class Attachment {

  constructor(file, hash) {
    let { boardName, postNumber, mime, size, name, path, nsfw } = file || {};

    if (file) {
      this.label = {
        boardName,
        postNumber
      }
    }

    this.file = {
      _id: hash || null,
      posts: [
        this.label
      ],
      mime,
      size,
      name,
      path,
      createdAt: new Date
    };

    if (nsfw) this.file.nsfw = true;
  }

  async createHash() {
    if (!this.file.path) {
      throw {
        status: 500,
        message: `Can't create a hash without a file.`
      }
    }
    let file = await FS.readFile(this.file.path);
    return this.file._id = Crypto.crc32(file);
  }

  async checkFile() {
    return false;
  }

  async createThumb() {
    return false;
  }

  async store() {
    if (!this.file._id) {
      await this.createHash();
    }

    let exists = await this.exists(false);

    if (debug && config('debug.log.files')) {
      console.log(`[File storing: ${this.file._id}]: Does it exist in a storage? (${!!exists})`);
    }

    if (!exists) {
      let extension = this.file.name.split('.').pop() || this.file.mime.split('/').pop();
      let filePath = `${this.file._id}.${extension}`;

      await this.createThumb(filePath).catch(async err => {
        await FS.unlink(this.file.path);
        throw err;
      });

      await FS.renameFile(this.file.path, filePath, 'upload');
      this.file.path = filePath;

      await AttachmentModel.create(this.file);

      return this;
    }

    if (!this.file.posts.includes(this.label)) {
      this.file.posts.push(this.label);

      await AttachmentModel.update({
        query: {
          _id: this.file._id
        },
        fields: {
          posts: this.file.posts,
          updatedAt: new Date
        }
      })
    }
  }

  async exists(clear = true) {
    let exists = await AttachmentModel.count({
      query: {
        _id: this.file._id
      }
    });
    if (exists) {
      this.file = await AttachmentModel.readOne({
        _id: this.file._id,
        clear
      })
    }
    return exists;
  }

  async delete(boardName, postNumber) {
    let exists = await this.exists(false);
    if (!exists) {
      return true;
    }

    let neededToDeleteFile = await this._deleteHash(boardName, postNumber);
    if (neededToDeleteFile) {
      await this._deleteFile();
    }
  }

  clearEntry() {
    if (this.file.duration) {
      this._durationToString(this.file.duration);
    }
    return this.file;
  }

  _durationToString(duration) {
    duration = Math.floor(+duration);
    let hours = (Math.floor(duration / 3600) + '').padStart(2, '0');
    duration %= 3600;
    let minutes = (Math.floor(duration / 60) + '').padStart(2, '0');
    let seconds = (duration % 60 + '').padStart(2, '0');

    return this.file.duration = +hours
        ? `${hours}:${minutes}:${seconds}`
        : `${minutes}:${seconds}`;
  }

  async _deleteHash(boardName, postNumber) {
    let index = this.file.posts.findIndex(i => i.boardName === boardName && i.postNumber === postNumber);

    if (debug && config('debug.log.files')) {
      console.log(`[File deleting: ${boardName}:${postNumber}]: Post index is ${index}`);
    }

    this.file.posts.splice(index, 1);

    if (this.file.posts.length) {
      if (debug && config('debug.log.files')) {
        console.log(`[File deleting: ${boardName}:${postNumber}]: Updating file entry coz it's used ${this.file.posts.length} time(s)...`);
      }
      await AttachmentModel.update({
        query: {
          _id: this.file._id
        },
        fields: {
          posts: this.file.posts,
          updatedAt: new Date
        }
      });
      return null;
    }

    if (debug && config('debug.log.files')) {
      console.log(`[File deleting: ${boardName}:${postNumber}]: Deleting file entry... (there are no posts)`);
    }

    await AttachmentModel.deleteOne({
      _id: this.file._id
    });
    return true;
  }

  async _deleteFile(meta) {
    if (debug && config('debug.log.files')) {
      console.log(`[File deleting: ${this.file._id}]: Deleting file... ${config('directories.upload') + meta.path}`);
    }

    await FS.unlink(`${config('directories.upload') + meta.path}`);

    if (meta.thumb) {
      if (debug && config('debug.log.files')) {
        console.log(`[File deleting: ${this.file._id}]: Deleting thumbnail... ${config('directories.thumb') + meta.path}`);
      }

      return await FS.unlink(`${config('directories.thumb') + meta.path}`);
    }

    if (debug && config('debug.log.files')) {
      console.log(`[File deleting: ${this.file._id}]: There is no thumbnail!`);
    }
  }

}

let out = { Attachment };

(async () => {
  let types = await Tools.requireRecursive('app/logic/attachment/', {mask: /(?<!index)\.js$/});
  let typeNames = types.map(type => type.name);
  for (let typeIndex in typeNames) {
    let typeName = typeNames[typeIndex];
    out[typeName] = types[typeIndex];
  }
})();

module.exports = out;
