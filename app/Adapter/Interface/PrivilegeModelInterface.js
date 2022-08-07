class PrivilegeModelInterface {

  async create({
    newBoardsPerMinute,
    newGroupsPerMinute,
    newInvitesPerMinute
  }) {}
  async readOneById(id) {}

}

module.exports = PrivilegeModelInterface;
