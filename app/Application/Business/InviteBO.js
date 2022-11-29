const {
  MissingParamError,
  NotAuthorizedError,
  NotFoundError
} = require('../../Domain/Error/index.js');

class InviteBO {

  /**
   *
   * @param {GroupService} GroupService
   * @param {InviteService} InviteService
   */
  constructor({GroupService, InviteService}) {
    this.GroupService = GroupService;
    this.InviteService = InviteService;
  }

  /**
   * @param {Object} inviteObject
   * @param {Number} inviteObject.authorId
   * @param {String} inviteObject.groupName
   * @param {String} [inviteObject.code]
   * @param {Date} [inviteObject.createdAt]
   * @param {Date} [inviteObject.expiredAt]
   */
  async create(inviteObject) {
    if (!inviteObject.authorId) {
      throw new NotAuthorizedError();
    }
    if (!inviteObject.groupName) {
      throw new MissingParamError(`Define a "groupName" for the invite`);
    }
    let group = await this.GroupService.readOneByName(inviteObject.groupName);
    if (!group) {
      throw new NotFoundError(`Group "${inviteObject.groupName}" was not found`);
    }
    inviteObject.groupName = group.name; // case-insensitive read,=> case-sensitive write
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
