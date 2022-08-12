const GroupService = require('../../../Application/Service/GroupService.js');
const InviteBO = require('../../../Application/Business/InviteBO.js');
const InviteService = require('../../../Application/Service/InviteService.js');

class InviteController {

  constructor(DatabaseContext) {
    let inviteService = new InviteService(DatabaseContext.invite);
    let groupService = new GroupService(DatabaseContext.group);
    this.invite = new InviteBO(inviteService, groupService);

    return [
      {
        request: 'invite',
        middleware: async ({ groupName }, ws) => {
          let authorId = null; // TODO: Implement sessions in WS
          await this.invite.create({authorId, groupName});
        }
      }
    ];
  }

}

module.exports = InviteController;
