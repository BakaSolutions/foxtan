const { BadRequestError } = require('../../Domain/Error/index.js');

class UserBO {

  /**
   *
   * @param {GroupService} GroupService
   * @param {InviteService} InviteService
   * @param {MemberService} MemberService
   * @param {UserService} UserService
   */
  constructor({
    InviteService,
    GroupService,
    MemberService,
    UserService
  }) {
    if (!GroupService) {
      throw new Error('No GroupService');
    }
    if (!InviteService) {
      throw new Error('No InviteService');
    }
    if (!MemberService) {
      throw new Error('No MemberService');
    }
    if (!UserService) {
      throw new Error('No UserService');
    }
    this.GroupService = GroupService;
    this.InviteService = InviteService;
    this.MemberService = MemberService;
    this.UserService = UserService;
  }

  async register(userObject) {
    await this.UserService.validateRegistration(userObject);

    let code = userObject.invite;
    let invite = code
      ? await this.InviteService.readOneByCode(code)
      : null;
    if (!invite) {
      throw new BadRequestError('Please, present your invitation code');
    }
    if (invite.expiredAt) {
      throw new BadRequestError('This invite is expired');
    }

    let group = await this.GroupService.readOneByName(invite.groupName);
    if (!group) {
      throw new BadRequestError(`There is no such a group: "${invite.groupName}"`);
    }

    let registeredUser = await this.UserService.register(userObject);

    let membership = {
      groupName: invite.groupName,
      userId: registeredUser.id,
      invitedById: invite.authorId,
    }
    await this.MemberService.create(membership);
    await this.InviteService.redeem(invite);

    return registeredUser;
  }

  async login(userObject) {
    await this.UserService.validateLogin(userObject);
    return this.UserService.login(userObject);
  }

  async getUser({ name, email }) {
    return this.UserService.getUser({ name, email });
  }

  logoff() {
    return true;
  }

}

module.exports = UserBO;
