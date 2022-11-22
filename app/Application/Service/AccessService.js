class AccessService {

  /**
   *
   * @param {AccessModelInterface} AccessModel
   */
  constructor(AccessModel) {
    this._model = AccessModel;
  }

  async create(accessObject) {
    let access = await this._model.create(accessObject);
    return access.toObject();
  }

  async readOne(id) {
    return this._model.readOne(id);
  }

  async readMany(accessArray) {
    if (accessArray && !Array.isArray(accessArray)) {
      accessArray = [ accessArray ];
    }
    return this._model.readMany(accessArray);
  }

}

module.exports = AccessService;
