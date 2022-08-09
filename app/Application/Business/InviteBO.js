class InviteBO {

  /**
   *
   * @param {InviteService} InviteService
   */
  constructor(InviteService) {
    if (!InviteService) {
      throw new Error('No InviteService');
    }
    this.InviteService = InviteService;
  }

  async create(inviteObject) {
    return this.InviteService.create(inviteObject);
  }

  async readOneById(id) {
    return this.InviteService.readOneById(id);
  }

  async redeem(code) {
    let invite = await this.InviteService.readOneByCode(code);
    return this.InviteService.redeem(invite);
  }

}

module.exports = InviteBO;
