const CommonLogic = require('./common');

const BoardModel = require('../models/mongo/board');

let Board = module.exports = {};

Board.create = async fields => {

  let boardInput = {
    board: fields.board,
    title: fields.title,
    subtitle: fields.subtitle || null,
    hidden: !!fields.hidden || false,
    closed: !!fields.closed || false,
    bumpLimit: fields.bumpLimit || 500,
    maxBoardSize: fields.maxBoardSize || -1,
    createdAt: new Date
  };

  let keys = CommonLogic.hasEmpty(boardInput);
  if (keys) {
    throw {
      status: 400,
      message: `Wrong parameter: \`${keys}\`.`
    };
  }
  
  let check = await BoardModel.readOne(fields.board);
  if (check !== null) {
    throw {
      status: 409,
      message: `Board already exists.`
    };
  }

  await BoardModel.create(boardInput);
  return Board.readOne(boardInput.board);
};

Board.readOne = async board => {
  return await BoardModel.readOne(board);
};

Board.readAll = async () => {
  return await BoardModel.readAll().then(boards => {
    let out = {};
    for (let i = 0; i < boards.length; i++) {
      let board = boards[i].board;
      delete boards[i].board;
      out[board] = boards[i];
    }
    return out;
  });
};

Board.delete = async fields => {
  let boardInput = {
    board: fields.board
  };

  let keys = CommonLogic.hasEmpty(boardInput);
  if (keys) {
    throw {
      status: 400,
      message: `Wrong parameters: \`${keys}\`.`
    };
  }

  let check = await BoardModel.readOne(fields.board);
  if (!check) {
    throw {
      status: 409,
      message: `Board doesn't exist.`
    };
  }

  return await BoardModel.deleteOne(boardInput);
};
