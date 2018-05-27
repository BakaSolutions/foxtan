const { Attachment } = require('./index');

class VideoAttachment extends Attachment {

  constructor(file) {
    super(file);
  }

  /*async checkFile() {
    //
  }*/

  /*async createThumb() {
    //
  }*/

}

module.exports = VideoAttachment;