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

AttachmentLogic.deleteByHashes = async hashes => {
  hashes = Tools.arrayify(hashes);
  if (!hashes.length) {
    return 0;
  }

  let allExistingItems = await AttachmentModel.readByFileHashes(hashes);
  let postIds = allExistingItems.map(i => i.postId);
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