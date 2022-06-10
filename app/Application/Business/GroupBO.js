class GroupBO {

  /**
   *
   * @param {GroupService} GroupService
   */
  constructor(GroupService) {
    if (!GroupService) {
      throw new Error('No GroupService');
    }
    this.GroupService = GroupService;
  }

  async create(groupObject) {
    return this.GroupService.create(groupObject);
  }

  async readOneByName(name) {
    return this.GroupService.readOneByName(name);
  }

}

module.exports = GroupBO;
