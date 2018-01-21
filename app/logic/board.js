const BoardModel = require('../models/mongo/board');

let Board = module.exports = {};

Board.create = async (fields, ctx) => {

  let boardInput = {
    board: fields.board,
    title: fields.title,
    subtitle: fields.subtitle || null,
    hidden: !!fields.hidden || false,
    closed: !!fields.closed || false,
    bumpLimit: fields.bumpLimit || 500,
    maxBoardSize: fields.maxBoardSize || -1,
    createdAt: new Date()
  };

  for (let key in boardInput) {
    if (typeof boardInput[key] === 'undefined' || boardInput[key] === '') {
      return ctx.throw(400, `Wrong \`${key}\` parameter.`); //TODO: Make it a separate function! Damn you!
    }
  }
  
  let check = await BoardModel.readOne(fields.board);
  if (check !== null) {
    return ctx.throw(409, 'Board already exists.');
  }

  return new Promise(async resolve => {
    await BoardModel.create(boardInput);
    resolve(await BoardModel.readOne(boardInput.board));
  })
};

Board.readOne = async (board) => {
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

Board.delete = async (fields, ctx) => {
  let boardInput = {
    board: fields.board
  };

  for (let key in boardInput) {
    if (typeof boardInput[key] === 'undefined' || boardInput[key] === '') {
      return ctx.throw(400, `Wrong \`${key}\` parameter.`);
    }
  }

  let check = await BoardModel.readOne(fields.board);
  if (check === null) {
    return ctx.throw(409, 'Board doesn\'t exist.');
  }

  return await BoardModel.deleteOne(boardInput);
};
