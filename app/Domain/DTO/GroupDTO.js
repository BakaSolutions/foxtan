const DTO = require('./DTO.js');

class GroupDTO extends DTO {

  get closedKeys() {
    return [];
  }

  constructor(data) {
    super();
    if (!data) {
      throw new TypeError();
    }

    this.name = data.name;
    this.privilegesId = data.privilegesId;
    this.description = data.description;

    return this;
  }

}

module.exports = GroupDTO;
