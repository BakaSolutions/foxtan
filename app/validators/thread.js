const ThreadModel = require('../models/mongo/thread');

const Validator = require('../helpers/validator');

module.exports = async (fields, params) => {
  let {board, isThread, lastNumber, now} = params;

  let input = {
    _id: {
      value: `${fields.boardName}:${lastNumber}`
    },
    boardName: {
      value: fields.boardName,
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
      value: fields.threadNumber,
      type: 'number',
      func: async (v, done, approved) => {
        if (!isThread) {
          let thread = await ThreadModel.readOne({
            board: approved.boardName,
            thread: v
          });
          if (!thread) {
            return done('Thread doesn\'t exist!');
          }
          if (thread.closed) {
            return done('Thread is closed!');
          }
        }
      }
    },
    number: {
      value: lastNumber,
      type: 'number'
    },
    createdAt: {
      value: now,
      type: 'date'
    },
    updatedAt: {
      value: now,
      type: 'date'
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
