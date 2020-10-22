const FileModel = require('../models/dao').DAO('file');

const AttachmentLogic = require('./attachment.js');

const FileType = {
  audio: require('./file/Audio.js'),
  image: require('./file/Image.js'),
  video: require('./file/Video.js'),
};

let FileLogic = module.exports = {};

FileLogic.create = async (fileInfo, post) => {
  let [mimeType, _] = fileInfo.mime.split('/');

  let fileEntry = new FileType[mimeType](fileInfo);
  let hash = await fileEntry.createHash();

  let exists = await FileModel.readOneByHash(hash);
  if (!exists) {
    await fileEntry.check();
    await fileEntry.store();
    await fileEntry.createThumb();
    await FileModel.create(fileEntry.file);
  } else {
    await fileEntry.unlink();
  }

  await AttachmentLogic.create({
    postId: post.id,
    fileHash: hash
  });
};

FileLogic.readByHashes = FileModel.readByHashes.bind(FileModel);

FileLogic.deleteByPostIdAndFileHash = async ({postId, fileHash} = {}, token) => {
  if (!postId || !fileHash) {
    return 0;
  }

  const PostLogic = require('./post.js');

  let post = await PostLogic.readOneById(postId);
  if (post.sessionKey !== token.tid) {
    return 0;
  }

  return AttachmentLogic.deleteByPostIdAndFileHash(postId, fileHash);
};
