const { BadRequestError } = require('../../Domain/Error/index.js');

class UserBO {

  /**
   *
   * @param {UserService} UserService
   * @param {InviteService} InviteService
   */
  constructor(UserService, InviteService) {
    if (!UserService) {
      throw new Error('No UserService');
    }
    this.UserService = UserService;
    this.InviteService = InviteService;
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

    let isRegistered = await this.UserService.register(userObject);

    if (isRegistered && code) {
      await this.InviteService.redeem(invite);
    }
    return isRegistered;
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
