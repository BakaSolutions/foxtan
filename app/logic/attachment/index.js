const Crypto = require('../../helpers/crypto');
const FS = require('../../helpers/fs');
const AttachmentModel = require('../../models/mongo/attachment');

let Attachment = {};

Attachment.createHash = data => Crypto.crc32(data);

Attachment.store = async (hash, {boardName, postNumber, extension} = {}, data) => {
  let label = {
    boardName,
    postNumber
  };
  let now = new Date;

  let exists = AttachmentModel.readOne({
    _id: hash
  });
  if (!exists) {
    await AttachmentModel.create({
      _id: hash,
      posts: [
        label
      ],
      ext: extension,
      createdAt: now,
      updatedAt: now
    });
  } else {
    exists.posts.push(label);

    await AttachmentModel.update({
      whereKey: '_id',
      whereValue: hash,
      fields: {
        posts: exists.posts,
        updatedAt: now
      }
    })
  }

  await FS.writeFile(`/public/res/${hash}.${extension}`, data);
};

Attachment.unlink = hash => {
  let meta = AttachmentModel.readOne({
    _id: hash
  });
  if (!meta) {
    return false;
  }
  FS.unlinkSync(`/public/res/${hash}.${meta.ext}`);
};

module.exports = Attachment;
