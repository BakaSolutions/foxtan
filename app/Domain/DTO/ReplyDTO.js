const DTO = require('./DTO.js');

class ReplyDTO extends DTO {

  constructor(data) {
    super();
    if (!data) {
      throw new TypeError();
    }

    this.id = data.id;
    this.fromId = data.fromId;
    this.toId = data.toId;

    return this;
  }

}

module.exports = ReplyDTO;
