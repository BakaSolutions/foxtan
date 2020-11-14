class PostDTO {

  get closedKeys() {
    return ['userId', 'sessionKey', 'ipAddress'];
  }

  load(data) {
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
    this.created = data.created;
    this.updated = data.updated;
    this.deleted = data.deleted;

    this.attachments = data.attachments || [];

    return this;
  }

  lock() {
    Object.preventExtensions(this);
  }

  toArray() {
    return Object.values(this).map(value => {
      if (Array.isArray(value) && !value.length) {
        return null;
      }
      return value;
    });
  }

  toObject(hasPrivileges = false) {
    let out = Object.keys(this);
    if (!hasPrivileges) {
      out = out.filter((key) => !this.closedKeys.includes(key));
    }
    return out.reduce((obj, key) => {
      obj[key] = this[key];
      return obj;
    }, {});
  }

  static from(request) {
    let self = new PostDTO();
    return self.load(request);
  }

}

module.exports = PostDTO;
