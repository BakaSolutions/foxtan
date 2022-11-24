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

  async hasPermissionForBoard(groupName, boardName, permission) {
    let accessArray = await this._model.readByGroupAndBoard(groupName, boardName);
    if (!accessArray.length) {
      return false; // no permissions for this group
    }

    let localAccessArray = accessArray
      .filter(({appliesToBoard}) => appliesToBoard === boardName);
    if (localAccessArray.length) {
      // has local permissions?
      return localAccessArray
        .some(({access}) => access.includes(permission.toLocaleLowerCase()));
    }

    let globalAccessArray = accessArray
      .filter(({appliesToBoard}) => appliesToBoard === '*');
    // has global permissions?
    return globalAccessArray
      .some(({access}) => access.includes(permission.toLocaleLowerCase()));
  }

}

module.exports = AccessService;
