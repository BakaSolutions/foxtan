const DTO = require('./DTO.js');

class AccessDTO extends DTO {

  get closedKeys() {
    return [];
  }

  constructor(data) {
    super();
    if (!data) {
      throw new TypeError();
    }

    this.id = data.id;
    this.appliesToBoard = data.appliesToBoard;
    this.appliesToThread = data.appliesToThread;
    this.access = data.access || [];

    return this;
  }

}

module.exports = AccessDTO;
