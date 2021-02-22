const DTO = require('./DTO.js');

class ThreadDTO extends DTO {

  get closedKeys() {
    return [];
  }

  constructor(data) {
    super();
    if (!data) {
      throw new TypeError();
    }

    this.id = data.id;
    this.boardName = data.boardName;
    this.limitsId = data.limitsId;
    this.pinned = data.pinned;
    this.modifiers = data.modifiers || [];

    this.posts = data.posts || [];

    return this;
  }

  setPosts(posts) {
    this.posts = posts;
  }

}

module.exports = ThreadDTO;
