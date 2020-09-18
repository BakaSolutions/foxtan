const CommonLogic = require('./common');

const Tools = require('../helpers/tools.js');

const BoardModel = require('../models/dao').DAO('board');

let BoardLogic = module.exports = {};

BoardLogic.create = async fields => {

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
  return BoardLogic.readOne(boardInput.board);
};

BoardLogic.readOne = async boardName => await BoardModel.readByName(boardName);

BoardLogic.readAll = async () => {
  let boards = await BoardModel.readAll();
  let out = {};
  for (let i = 0; i < boards.length; i++) {
    out[boards[i].name] = boards[i];
  }
  return out;
};

BoardLogic.delete = async ({board} = {}) => {
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

  return BoardModel.deleteOne(boardInput);
};

BoardLogic.sync = async (boardNames) => { // TODO: Check!
  boardNames = Tools.arrayify(boardNames);
  if (!boardNames) {
    return BoardModel.getLastPostNumbers();
  }
  return BoardModel.getLastPostNumbers(boardNames);
};
