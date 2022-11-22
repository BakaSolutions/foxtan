const MainController = require('../MainController.js');

const GroupBO = require('../../../../Application/Business/GroupBO.js');
const GroupService = require('../../../../Application/Service/GroupService.js');
const AccessService = require('../../../../Application/Service/AccessService.js');

class GroupController extends MainController {

  constructor(Router, DatabaseContext) {
    super(Router);

    let groupService = new GroupService(DatabaseContext.group);
    let accessService = new AccessService(DatabaseContext.access);
    this.group = new GroupBO(groupService, accessService);
    // Setting up
    Router.post('api/createGroup', this.create.bind(this));
    Router.get('api/readGroup', this.readOne.bind(this));
  }

  async create(ctx) {
    try {
      let query = ctx.request.body;
      let group = await this.group.create(query);
      this.success(ctx, group);
    } catch (e) {
      this.fail(ctx, e);
    }
  }

  async readOne(ctx) {
    try {
      let { name } = ctx.query;
      let group = await this.group.readOneByName(name);
      this.success(ctx, group);
    } catch (e) {
      this.fail(ctx, e);
    }
  }

}

module.exports = GroupController;
