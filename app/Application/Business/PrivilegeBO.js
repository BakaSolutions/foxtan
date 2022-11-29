class PrivilegeBO {

  /**
   *
   * @param {PrivilegeService} PrivilegeService
   */
  constructor({PrivilegeService}) {
    this.PrivilegeService = PrivilegeService;
  }

  async create(privilegeObject) {
    return this.PrivilegeService.create(privilegeObject);
  }

  async readOneById(id) {
    return this.PrivilegeService.readOneById(id);
  }

}

module.exports = PrivilegeBO;
