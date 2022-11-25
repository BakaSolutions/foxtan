const MainController = require('../MainController.js');

const MemberBO = require('../../../../Application/Business/MemberBO.js');

class MemberController extends MainController {

  constructor(Router, { GroupService, MemberService, UserService }) {
    super(Router);
    this.member = new MemberBO(MemberService, UserService, GroupService);
    // Setting up
    Router.post('api/createMember', this.create.bind(this));
    Router.get('api/readMember', this.read.bind(this));
  }

  async create(ctx) {
    try {
      let query = ctx.request.body;
      let member = await this.member.create(query);
      this.success(ctx, member);
    } catch (e) {
      this.fail(ctx, e);
    }
  }

  async read(ctx) {
    try {
      let { groupName, userId } = ctx.query;
      let member;
      /*if (groupName) {
        member = await this.member.readOneByGroupName(groupName);
      }*/
      if (userId) {
        member = await this.member.readOneByUserId(userId);
      }
      this.success(ctx, member);
    } catch (e) {
      this.fail(ctx, e);
    }
  }

}

module.exports = MemberController;
