const InviteBO = require('../../../Application/Business/InviteBO.js');

class InviteController {

  constructor({ GroupService, InviteService }) {
    this.invite = new InviteBO(InviteService, GroupService);

    return [
      {
        request: 'invite',
        middleware: async ({ groupName }, ws) => {
          let authorId = ws.session.user?.id;
          return this.invite.create({authorId, groupName});
        }
      }
    ];
  }

}

module.exports = InviteController;
