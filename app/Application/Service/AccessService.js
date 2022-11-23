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

  async hasPermissionForBoard(group, board, permission) {
    let accessArray = await this._model.readByGroupAndBoard(group, board);
    return accessArray.some(({appliesToBoard, access}) => {
      return (appliesToBoard === board || appliesToBoard === '*')
        && access.includes(permission);
    })
  }

}

module.exports = AccessService;
