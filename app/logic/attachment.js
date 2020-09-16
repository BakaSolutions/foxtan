const AttachmentModel = require('../models/dao').DAO('attachment');

const Attachment = require('../object/Attachment.js');

let AttachmentLogic = module.exports = {};

AttachmentLogic.create = async (attachment) => {
  try {
    if (!(attachment instanceof Attachment)) {
      throw new Error('Cannot create an attachment without Attachment object');
    }
    attachment = await AttachmentModel.create(attachment);
  } catch (e) {

  }
};
