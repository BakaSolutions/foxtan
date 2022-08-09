const MainController = require('../MainController.js');

const InviteBO = require('../../../../Application/Business/InviteBO.js');
const InviteService = require('../../../../Application/Service/InviteService.js');

class InviteController extends MainController {

  // TODO: Remove this controller after debug!
  
  constructor(Router, DatabaseContext) {
    super(Router);

    let inviteService = new InviteService(DatabaseContext.invite);
    this.invite = new InviteBO(inviteService);
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
