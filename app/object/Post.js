const AppObject = require('../core/AppObject.js');

class Post extends AppObject {

  constructor({ creative } = {creative: false}) {
    // "threadId", "userId", "number", "subject", "text", "sessionKey",
    // "modifiers", "ipAddress", "created", "updated", "deleled"
    super();
    if (!creative) {
      super._init('id', this.setId);
    }

    super._init('threadId', super.setId);
    super._init('userId', super.setId);
    super._init('number', super.setId);
    super._init('subject');
    super._init('text', this.setText);
    super._init('sessionKey');

    super._init('modifiers', null, creative ? null : []);
    super._init('ipAddress');
    super._init('created', super.setDate, new Date());
    super._init('updated', super.setDate);
    super._init('deleted', super.setDate);
    super._lock();
  }

  setText(text) {
    if (typeof text !== 'string') {
      throw new Error('Text must be a string');
    }
    if (text.length > 5000) {
      throw new Error('Text length is unacceptable');
    }
    return text;
  }

}

module.exports = Post;
