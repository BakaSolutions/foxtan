const DTO = require('./DTO.js');

class MemberDTO extends DTO {

  get closedKeys() {
    return ['userId', 'invitedById'];
  }

  get protectedKeys() {
    return ['id'];
  }

  constructor(data) {
    super();
    if (!data) {
      throw new TypeError();
    }

    this.id = data.id;
    this.groupName = data.groupName;
    this.userId = data.userId;
    this.invitedById = data.invitedById;
    this.invitedAt = data.invitedAt;
    this.expiredAt = data.expiredAt;

    return this;
  }

}

module.exports = MemberDTO;
