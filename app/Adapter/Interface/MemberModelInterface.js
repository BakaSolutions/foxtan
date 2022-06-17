class MemberModelInterface {

  async create({ groupName, userId, invitedById, invitedAt, expiredAt }) {}
  async readOneById(id) {}
  async readOneByUserId(userId) {}
  async readOneByGroupName(groupName) {}

}

module.exports = MemberModelInterface;
