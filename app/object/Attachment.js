const AppObject = require('../core/AppObject.js');

class Attachment extends AppObject {

  constructor({ creative } = {creative: false}) {
    super();
    if (!creative) {
      super._init('id', this.setId);
    }

    super._init('postId');
    super._init('fileHash');
    super._lock();
  }

}

module.exports = Attachment;
