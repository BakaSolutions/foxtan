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

}

module.exports = FileService;
