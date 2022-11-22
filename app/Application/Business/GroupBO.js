class GroupBO {

  /**
   *
   * @param {GroupService} GroupService
   * @param {AccessService} AccessService
   */
  constructor(GroupService, AccessService) {
    if (!GroupService) {
      throw new Error('No GroupService');
    }
    this.GroupService = GroupService;
    if (!AccessService) {
      throw new Error('No AccessService');
    }
    this.AccessService = AccessService;
  }

  async create(groupObject) {
    return this.GroupService.create(groupObject);
  }

  async readOneByName(name) {
    let group = await this.GroupService.readOneByName(name);
    return await this.process(group);
  }

  async process(group) {
    group.access = group.accessId
      ? await this.AccessService.readMany(group.accessId)
      : {};
    delete group.accessId;
    return group;
  }

}

module.exports = GroupBO;
