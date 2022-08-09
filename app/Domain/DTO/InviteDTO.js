const DTO = require('./DTO.js');

class InviteDTO extends DTO {

  get closedKeys() {
    return [];
  }

  constructor(data) {
    super();
    if (!data) {
      throw new TypeError();
    }

    this.id = data.id;
    this.authorId = data.authorId;
    this.groupName = data.groupName;
    this.code = data.code;
    this.createdAt = data.createdAt;
    this.expiredAt = data.expiredAt;

    return this;
  }

}

module.exports = InviteDTO;
