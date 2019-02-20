const PostModel = require('../models/mongo/post');

const CommonLogic = require('../logic/common');
const Attachment = require('../logic/attachment');

const Crypto = require('../helpers/crypto');
const Tools = require('../helpers/tools');
const Validator = require('../helpers/validator');

module.exports = async (fields, params) => {
  let {board, isThread, token, lastNumber, now} = params;

  let input = {
    _id: {
      value: `${fields.boardName}:${lastNumber}`
    },
    boardName: {
      value: fields.boardName,  // is `v` in func
      required: true,
      func: async (v, done) => {
        if (!board) {
          return done('Board doesn\'t exist!');
        }
        if (board.closed) {
          return done('Board is closed!');
        }
      }
    },
    threadNumber: {
      value: isThread
        ? lastNumber
        : fields.threadNumber,
      type: 'number',
      required: true
    },
    number: {
      value: lastNumber,
      type: 'number',
      required: true
    },
    subject: {
      value: fields.subject
    },
    rawText: {
      value: fields.text
    },
    password: {
      value: CommonLogic.isEmpty(fields.password)
        ? null
        : Crypto.sha256(fields.password)
    },
    id: {
      value: token._id || token.tid,
      required: true
    },
    files: {
      value: fields.file || [],
      func: async (files, done, approved) => {
        let out = [];
        let fileAmount = Math.min(files.length, board.fileLimit); // TODO: Process only unique files

        if (!files.length && CommonLogic.isEmpty(approved.rawText)) {
          return done('Nor post nor file is present');
        }

        for (let i = 0; i < fileAmount; i++) {
          let file = files[i];
          if (CommonLogic.isEmpty(file)) {
            continue;
          }
          if (!file.mime) {
            return done(`This file has no MIME-type: ${file.name}`);
          }
          file.boardName = approved.boardName;
          file.postNumber = approved.number;
          if (fields.nsfwFile && fields.nsfwFile[i]) {
            file.nsfw = true;
          }

          let type = Tools.capitalize(file.mime.split('/')[0]);
          let attachment = (!Attachment[type])
            ? new Attachment(file)
            : new Attachment[type](file);

          if (!await attachment.checkFile()) {
            return done(`This type of file is not allowed: ${file.mime}`);
          }
          await attachment.store();

          let hash = attachment.file._id;
          if (!files.includes(hash)) {
            out.push(hash);
          }
        }
        done(null, out);
      }
    },
    sage: {
      value: fields.sage,
      type: 'boolean'
    },
    op: {
      value: fields.op,
      func: async (v, done, approved) => {
        if (!isThread) { // OP-post check
          let opPost = await PostModel.readOne({
            board: fields.boardName,
            post: fields.threadNumber,
            clear: false
          });
          if (v && (opPost.id === approved.id)) {
            return done(null, true);
          }
        } else if (v) {
          return done(null, true);
        }
        done();
      }
    },
    createdAt: {
      value: now
    },
    updatedAt: {
      value: null
    }
  };

  let validation = await Validator(input);
  if (!validation.passed) {
    throw {
      status: 400,
      message: validation.errors
    };
  }
  return validation.fields;
};
