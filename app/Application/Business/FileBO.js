class FileBO {

  /**
   *
   * @param {FileService} FileService
   */
  constructor({FileService}) {
    this.FileService = FileService;
  }

  // TODO: Remove this proxy
  async create(fileObject, modifiers) {
    return await this.FileService.create(fileObject, modifiers);
  }

  // TODO: File addition
  // TODO: File deletion

}

module.exports = FileBO;
