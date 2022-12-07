const DTO = require('./DTO.js');

class PostDTO extends DTO {

  get closedKeys() {
    return ['userId', 'sessionKey', 'ipAddress', 'canDelete'];
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
    this.threadId = data.threadId;
    this.userId = data.userId;
    this.number = data.number;
    this.subject = data.subject;
    this.text = data.text;
    this.sessionKey = data.sessionKey;
    this.modifiers = data.modifiers || [];
    this.ipAddress = data.ipAddress;
    this.isHead = data.isHead;
    this.created = data.created;
    this.updated = data.updated;
    this.deleted = data.deleted;

    this.attachments = data.attachments || [];
    this.canDelete = null;

    return this;
  }

}

module.exports = PostDTO;
