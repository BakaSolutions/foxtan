class PrivilegeService {

  /**
   *
   * @param {PrivilegeModelInterface} PrivilegeModel
   */
  constructor(PrivilegeModel) {
    if (!PrivilegeModel) {
      throw new Error('No PrivilegeModel');
    }
    this._model = PrivilegeModel;
  }

  async create(privilegeObject) {
    let privilege = await this._model.create(privilegeObject);
    return privilege.toObject();
  }


  async readOneById(id) {
    return this._model.readOneById(id);
  }

}

module.exports = PrivilegeService;
