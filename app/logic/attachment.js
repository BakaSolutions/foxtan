const AttachmentModel = require('../models/dao').DAO('attachment');
const FileModel = require('../models/dao').DAO('file');

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

AttachmentLogic.readByPostId = async postId => {
  return AttachmentModel.readByPostId(postId);
};

AttachmentLogic.readByPostIds = async postIds => {
  return AttachmentModel.readByPostIds(postIds);
};

AttachmentLogic.readByFileHash = async fileHash => {
  return AttachmentModel.readByFileHash(fileHash);
};

AttachmentLogic.readByFileHashes = async fileHashes => {
  return AttachmentModel.readByFileHashes(fileHashes);
};

AttachmentLogic.readOneByPostIdAndFileHash = async (postId, fileHash) => {
  return AttachmentModel.readOneByPostIdAndFileHash(postId, fileHash);
};

AttachmentLogic.deleteByFileHashes = async fileHashes => {
  fileHashes = Tools.arrayify(fileHashes);
  if (!fileHashes.length) {
    return 0;
  }

  let items = await AttachmentModel.readByFileHashes(fileHashes);
  if (!items.length) {
    return 0;
  }
  let postIds = items.map(i => i.postId);
  postIds = Tools.unique(postIds);
  let posts = await AttachmentLogic.readByPostIds(postIds);
  console.log(posts);

  let promises = posts.map(post => {
    return FileModel.deleteOne(post.id)
      ? 1
      : 0;
  });
  let results = await Promise.all(promises);
  return /* deletedFiles = */ results.reduce((a, b) => a + b, 0);
};

AttachmentLogic.deleteByPostIdAndFileHash = async (postId, fileHash) => {
  let item = await AttachmentModel.readOneByPostIdAndFileHash(postId, fileHash);
  if (!item) {
    return 0;
  }

  return await AttachmentModel.deleteByPostIdAndFileHash(postId, fileHash)
    ? 1
    : 0;
};