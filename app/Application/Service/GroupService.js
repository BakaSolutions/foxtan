class GroupService {

  /**
   *
   * @param {GroupModelInterface} GroupModel
   */
  constructor(GroupModel) {
    this._model = GroupModel;
  }

  async create(groupObject) {
    let group = await this._model.create(groupObject);
    return group.toObject();
  }


  async readOneByName(name) {
    name = name.toLocaleLowerCase();
    return this._model.readOneByName(name);
  }

}

module.exports = GroupService;
