const DTO = require('./DTO.js');

class BoardDTO extends DTO {

  get closedKeys() {
    return [];
  }

  constructor(data) {
    super();
    if (!data) {
      throw new TypeError();
    }

    this.name = data.name;
    this.limitsId = data.limitsId;
    this.title = data.title;
    this.defaultSubject = data.defaultSubject;
    this.description = data.description;
    this.modifiers = data.modifiers || [];
    this.created = data.created;
    this.deleted = data.deleted;

    this.threads = data.threads || [];
    this.threadCount = data.threadCount || 0;

    return this;
  }

}

module.exports = BoardDTO;
