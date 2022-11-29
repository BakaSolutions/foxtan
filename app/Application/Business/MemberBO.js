class MemberBO {

  /**
   *
   * @param {MemberService} MemberService
   * @param {UserService} UserService
   * @param {GroupService} GroupService
   */
  constructor({GroupService, MemberService, UserService}) {
    this.GroupService = GroupService;
    this.MemberService = MemberService;
    this.UserService = UserService;
  }

  async create(member) {
    let user = await this.UserService.readOneById(member.userId);
    if (!user) {
      throw {
        status: 404,
        message: `There is no such a user`
      }
    }
    let group = await this.GroupService.readOneByName(member.groupName);
    if (!group) {
      throw {
        status: 404,
        message: `There is no such a group`
      }
    }

    return this.MemberService.create(member);
  }

  async readOneByUserId(userId) {
    let user = await this.UserService.readOneById(userId);
    if (!user) {
      throw {
        status: 404,
        message: `There is no such a user`
      }
    }
    return this.MemberService.readOneByUserId(userId);
  }

}

module.exports = MemberBO;
