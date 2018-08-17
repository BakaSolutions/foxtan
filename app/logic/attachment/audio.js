const { Attachment } = require('./index');

class AudioAttachment extends Attachment {

  constructor(file) {
    super(file);
  }

  async checkFile() {
    return true;
  }

}

module.exports = AudioAttachment;