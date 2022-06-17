const MainController = require('../MainController.js');

const MemberBO = require('../../../../Application/Business/MemberBO.js');
const MemberService = require('../../../../Application/Service/MemberService.js');
const UserService = require('../../../../Application/Service/UserService.js');
const GroupService = require('../../../../Application/Service/GroupService.js');

class MemberController extends MainController {

  constructor(Router, DatabaseContext) {
    super(Router);

    let memberService = new MemberService(DatabaseContext.member);
    let userService = new UserService(DatabaseContext.user);
    let groupService = new GroupService(DatabaseContext.group);
    this.member = new MemberBO(memberService, userService, groupService);
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
      let { groupName, userId } = ctx.request.body;
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
