const MainController = require('../MainController.js');

const UserBO = require('../../../../Application/Business/UserBO.js');
const UserService = require('../../../../Application/Service/UserService.js');
const InviteService = require('../../../../Application/Service/InviteService.js');

class UserController extends MainController {

  constructor(Router, DatabaseContext) {
    super(Router);

    let userService = new UserService(DatabaseContext.user);
    let inviteService = new InviteService(DatabaseContext.invite);
    this.user = new UserBO(userService, inviteService);
    // Setting up
    Router.get('api/whoAmI', this.whoAmI.bind(this));
    Router.post('api/logOff', this.logOff.bind(this));
    Router.post('api/logOn', this.logOn.bind(this));
    Router.post('api/register', this.register.bind(this));
    // TODO: /api/requestLoginByEmail
  }

  async register(ctx) {
    try {
      if (this.isLoggedIn(ctx)) {
        return this.success(ctx, ctx.session.user);
      }
      let query = ctx.request.body;
      let user = await this.user.register(query);
      this.success(ctx, user);
    } catch (e) {
      this.fail(ctx, e);
    }
  }

  async logOn(ctx) {
    try {
      if (this.isLoggedIn(ctx)) {
        return this.success(ctx, ctx.session.user);
      }
      let query = ctx.request.body;
      let user = await this.user.login(query);
      ctx.sessionHandler.regenerateId();
      ctx.session.user = user;
      this.success(ctx, user);
    } catch (e) {
      this.fail(ctx, e);
    }
  }

  async logOff(ctx) {
    ctx.session = null;
    let out = {
      success: this.user.logoff()
    };
    this.success(ctx, out);
  }

  async whoAmI(ctx) {
    this.success(ctx, ctx.session?.user || {});
  }

  isLoggedIn(ctx) {
    return !!ctx.session?.user;
  }

}

module.exports = UserController;
