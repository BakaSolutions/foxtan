const DTO = require('./DTO.js');

class FileDTO extends DTO {

  get closedKeys() {
    return [];
  }

  get protectedKeys() {
    return ['hash'];
  }

  constructor(data) {
    super();
    if (!data) {
      throw new TypeError();
    }

    this.hash = data.hash;
    this.mime = data.mime;
    this.name = data.name;
    this.size = data.size;
    this.width = data.width;
    this.height = data.height;
    this.modifiers = data.modifiers || [];

    return this;
  }

}

module.exports = FileDTO;
