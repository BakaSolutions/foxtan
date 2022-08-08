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
    this.newBoardsPerDay = data.newBoardsPerDay;
    this.newInvitesPerDay = data.newInvitesPerDay;

    return this;
  }

}

module.exports = PrivilegeDTO;
