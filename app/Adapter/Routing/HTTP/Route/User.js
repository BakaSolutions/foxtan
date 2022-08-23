const MainController = require('../MainController.js');

const UserBO = require('../../../../Application/Business/UserBO.js');
const UserService = require('../../../../Application/Service/UserService.js');
const InviteService = require('../../../../Application/Service/InviteService.js');
const MemberService = require('../../../../Application/Service/MemberService.js');
const GroupService = require('../../../../Application/Service/GroupService.js');

class UserController extends MainController {

  constructor(Router, DatabaseContext) {
    super(Router);
    this.user = new UserBO({
      GroupService: new GroupService(DatabaseContext.group),
      InviteService: new InviteService(DatabaseContext.invite),
      MemberService: new MemberService(DatabaseContext.member),
      UserService: new UserService(DatabaseContext.user),
    });
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
      // TODO: let userDTO = new UserDTO(...query);
      let userDTO = {
        name: query.name?.trim(),
        email: query.email?.trim(),
        password: query.password,
        invite: query.invite?.trim(),
      }
      let user = await this.user.register(userDTO);
      this.setUserSession(ctx, user);
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
      this.setUserSession(ctx, user);
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

  setUserSession(ctx, user) {
    ctx.sessionHandler.regenerateId();
    ctx.session.user = user;
  }

}

module.exports = UserController;
