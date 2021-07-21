const DTO = require('./DTO.js');

class ThreadDTO extends DTO {

  get closedKeys() {
    return [];
  }

  get protectedKeys() {
    return ['id', 'head', 'posts'];
  }

  constructor(data) {
    super();
    if (!data) {
      throw new this.DtoError();
    }

    this.id = data.id;
    this.boardName = data.boardName;
    this.limitsId = data.limitsId;
    this.pinned = data.pinned;
    this.modifiers = data.modifiers || [];

    this.head = data.head || {};
    this.posts = data.posts || 0;

    return this;
  }

}

module.exports = ThreadDTO;
