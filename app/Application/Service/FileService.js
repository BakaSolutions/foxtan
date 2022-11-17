const config = require('../../Infrastructure/Config.js');
const Tools = require('../../Infrastructure/Tools.js')
const fs = require('fs').promises;

class FileService {

  /**
   *
   * @param {FileModelInterface} FileModel
   */
  constructor(FileModel) {
    if (!FileModel) {
      throw new Error('No FileModel');
    }

    this._fileModel = FileModel;
  }

  async create(fileDTO) {
    await this._fileModel.create(fileDTO);
  }

  async read(hashArray) {
    return await this._fileModel.read(hashArray);
  }

  async delete(hash) {
    let hashArray = [ hash ];
    let files = await this._fileModel.read(hashArray);
    let file = files[0];
    try {
      await fs.rm(config.get('directories.upload') + hash + '.' + Tools.mimeToFormat(file.mime));
      await fs.rm(config.get('directories.thumb') + hash + '.' + config.get('files.thumbnail.format'));
    } catch (e) {
      console.log(e); // TODO: Remove after debug
    }
    return await this._fileModel.delete(hashArray);
  }

}

module.exports = FileService;
