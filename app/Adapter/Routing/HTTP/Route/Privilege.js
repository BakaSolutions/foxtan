const MainController = require('../MainController.js');

const PrivilegeBO = require('../../../../Application/Business/PrivilegeBO.js');

class PrivilegeController extends MainController {

  constructor(Router, Services) {
    super(Router);

    this.privilege = new PrivilegeBO(Services);
    // Setting up
    Router.post('api/createPrivilege', this.create.bind(this));
    Router.get('api/readPrivilege', this.read.bind(this));
  }

  async create(ctx) {
    try {
      let query = ctx.request.body;
      let member = await this.privilege.create(query);
      this.success(ctx, member);
    } catch (e) {
      this.fail(ctx, e);
    }
  }

  async read(ctx) {
    try {
      let { id } = ctx.query;
      let privilege = await this.privilege.readOneById(id);
      this.success(ctx, privilege);
    } catch (e) {
      this.fail(ctx, e);
    }
  }

}

module.exports = PrivilegeController;
