const SuperModel = require('./super');

class AttachmentModel extends SuperModel {

  constructor() {
    super('attachment');
  }

}

module.exports = new AttachmentModel();
