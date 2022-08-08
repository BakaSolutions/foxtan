class PrivilegeModelInterface {

  async create({
    newBoardsPerDay,
    newInvitesPerDay
  }) {}
  async readOneById(id) {}

}

module.exports = PrivilegeModelInterface;
