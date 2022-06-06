class UserBO {

  /**
   *
   * @param {UserService} UserService
   */
  constructor(UserService) {
    if (!UserService) {
      throw new Error('No UserService');
    }
    this.UserService = UserService;
  }

  async register(userObject) {
    await this.UserService.validateRegistration(userObject);
    return this.UserService.register(userObject);
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
