const MainController = require('../MainController.js');

const UserBO = require('../../../../Application/Business/UserBO.js');
const UserService = require('../../../../Application/Service/UserService.js');

class UserController extends MainController {

  constructor(Router, DatabaseContext) {
    super(Router);

    let userService = new UserService(DatabaseContext.user);
    this.user = new UserBO(userService);
    // Setting up
    Router.post('api/register', this.register.bind(this));
    Router.post('api/logOn', this.logOn.bind(this));
    Router.post('api/logOff', this.logOff.bind(this));
    // TODO: /api/requestLoginByEmail
  }

  async register(ctx) {
    try {
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
      ctx.session.user = user;
      ctx.sessionHandler.regenerateId();
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

  isLoggedIn(ctx) {
    return !!ctx.session.user;
  }

}

module.exports = UserController;
