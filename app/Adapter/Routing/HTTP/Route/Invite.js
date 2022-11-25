const MainController = require('../MainController.js');

const InviteBO = require('../../../../Application/Business/InviteBO.js');

class InviteController extends MainController {

  // TODO: Remove this controller after debug!
  
  constructor(Router, { GroupService, InviteService }) {
    super(Router);
    this.invite = new InviteBO(InviteService, GroupService);
    // Setting up
    Router.post('api/createInvite', this.create.bind(this));
    Router.get('api/readInvite', this.read.bind(this));
  }

  async create(ctx) {
    try {
      let query = ctx.request.body;
      let member = await this.invite.create(query);
      this.success(ctx, member);
    } catch (e) {
      this.fail(ctx, e);
    }
  }

  async read(ctx) {
    try {
      let { id } = ctx.query;
      let invite = await this.invite.readOneById(id);
      this.success(ctx, invite);
    } catch (e) {
      this.fail(ctx, e);
    }
  }

}

module.exports = InviteController;
