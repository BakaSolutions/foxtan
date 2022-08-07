const DTO = require('./DTO.js');

class PrivilegeDTO extends DTO {

  get closedKeys() {
    return [];
  }

  constructor(data) {
    super();
    if (!data) {
      throw new TypeError();
    }

    this.id = data.id;
    this.newBoardsPerMinute = data.newBoardsPerMinute;
    this.newGroupsPerMinute = data.newGroupsPerMinute;
    this.newInvitesPerMinute = data.newInvitesPerMinute;

    return this;
  }

}

module.exports = PrivilegeDTO;
