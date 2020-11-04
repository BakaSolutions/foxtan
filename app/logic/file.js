const FileModel = require('../models/dao').DAO('file');
const AttachmentModel = require('../models/dao').DAO('attachment');

const AttachmentLogic = require('./attachment.js');

const Tools = require('../helpers/tools.js');

const FileType = {
  audio: require('./file/Audio.js'),
  image: require('./file/Image.js'),
  video: require('./file/Video.js'),
};

let FileLogic = module.exports = {};

FileLogic.create = async (fileInfo, post) => {
  let [mimeType, _] = fileInfo.mime.split('/');

  let fileEntry = new FileType[mimeType](fileInfo);
  let fileHash = await fileEntry.createHash();

  let exists = await FileModel.readOneByHash(fileHash);
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
    fileHash
  });
};


FileLogic.appendAttachments = async post => {
  post.attachments = [];
  let attachments = await AttachmentModel.readByPostId(post.id);
  if (!attachments.length) {
    return post;
  }
  let uniqueFileHashes = Tools.unique(attachments.map(i => i.fileHash));
  let files = await FileModel.readByHashes(uniqueFileHashes);
  for (let attachment of attachments) {
    let file = files.find(i => i.hash === attachment.fileHash);
    post.attachments.push(file);
  }
  return post;
};

FileLogic.delete = async fileHash => {
  // TODO: remove file from FS and DB
  throw {
    status: 501
  }
};
