const AttachmentModel = require('../models/dao').DAO('attachment');

const Attachment = require('../object/Attachment.js');

let AttachmentLogic = module.exports = {};

AttachmentLogic.create = async attachment => {
  if (!(attachment instanceof Attachment)) {
    let { postId, fileHash } = attachment;
    attachment = new Attachment({creative: true});
    attachment.postId = postId;
    attachment.fileHash = fileHash;
  }
  await AttachmentModel.create(attachment);
};

AttachmentLogic.readByPostId = async postId => {
  return AttachmentModel.readByPostId(postId);
};