const AttachmentModel = require('../models/dao').DAO('attachment');
const PostModel = require('../models/dao').DAO('post');

const Attachment = require('../object/Attachment.js');

const Tools = require('../helpers/tools.js');

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

AttachmentLogic.delete = async ({boardName, postNumber, postId, fileHash} = {}, token) => {
  // Read a post to catch a token
  let post;
  if (boardName && postNumber) {
    post = await PostModel.readOneByBoardAndPost(boardName, postNumber);
    postId = post.id;
  } else if (postId) {
    post = await PostModel.readOneById(postId);
    if (!post) {
      return 0;
    }
  }

  // Compare tokens
  if (post && post.sessionKey !== token.tid) {
    return 0;
  }

  // Guess what's going on
  // Read all attachments
  let attachments;
  if (postId && fileHash) {
    // remove certain attachment
    attachments = await AttachmentModel.readOneByPostIdAndFileHash(postId, fileHash);
  } else if (!postId && fileHash) {
    // remove certain file with all attachments
    attachments = await AttachmentModel.readByFileHash(fileHash);
  } else if (postId && !fileHash) {
    // remove all post attachments
    attachments = await AttachmentModel.readByPostId(postId);
  }

  if (!attachments) {
    return 0;
  }

  attachments = Tools.arrayify(attachments);
  let attachmentIds = attachments.map(a => a.id);
  let results = await Tools.parallel(AttachmentModel.deleteById, attachmentIds);

  let deletedAttachments = results.reduce((a, b) => a + b, 0);
  return deletedAttachments;
};
