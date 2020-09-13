const AttachmentModel = require('../models/dao').DAO('attachment');

const Attachment = require('../object/Attachment.js');

let AttachmentLogic = module.exports = {};

AttachmentLogic.create = async (fields) => {
  try {
    let {postId, fileHash} = fields;

    let attachment = new Attachment().bulk({
      postId,
      fileHash
    });
    attachment = await AttachmentModel.create(attachment);
  } catch (e) {

  }
};
