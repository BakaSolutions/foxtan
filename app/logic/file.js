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

  let exists = await FileLogic.readOneByHash(hash);
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

FileLogic.readOneByHash = async hash => {
  return FileModel.readOneByHash(hash)
};

FileLogic.readByHashes = async hashes => {
  return FileModel.readByHashes(hashes);
};

FileLogic.deleteOneByHash = async hash => {

};