const CommonLogic = require('./common');

const BoardModel = require('../models/mongo/board');

let Board = module.exports = {};

Board.create = async fields => {

  let boardInput = {
    _id: fields.board,
    board: fields.board,
    title: fields.title
  };

  let keys = CommonLogic.hasEmpty(boardInput);
  if (keys) {
    throw {
      status: 400,
      message: `Wrong parameter: \`${keys}\`.`
    };
  }

  boardInput = Object.assign(boardInput, {
    subtitle: fields.subtitle || '',
    defaultUsername: fields.defaultUsername || '',
    hidden: !!fields.hidden || '',
    closed: !!fields.closed || '',
    bumpLimit: +fields.bumpLimit || 500,
    fileLimit: +fields.fileLimit || '',
    createdAt: new Date
  });

  boardInput = CommonLogic.cleanEmpty(boardInput);
  
  let check = await BoardModel.readOne(boardInput._id);
  if (check !== null) {
    throw {
      status: 409,
      message: `Board already exists.`
    };
  }

  await BoardModel.create(boardInput);
  return Board.readOne(boardInput.board);
};

Board.readOne = async board => await BoardModel.readOne(board);

Board.readAll = async () => {
  return await BoardModel.readAll().then(boards => {
    let out = {};
    for (let i = 0; i < boards.length; i++) {
      boards[i].name = boards[i].board;
      delete boards[i].board;
      out[boards[i].name] = boards[i];
    }
    return out;
  });
};

Board.delete = async ({board} = {}) => {
  let boardInput = { board };

  let keys = CommonLogic.hasEmpty(boardInput);
  if (keys) {
    throw {
      status: 400,
      message: `Wrong parameters: \`${keys}\`.`
    };
  }

  let check = await BoardModel.readOne(board);
  if (!check) {
    throw {
      status: 409,
      message: `Board doesn't exist.`
    };
  }

  return await BoardModel.deleteOne(boardInput);
};
