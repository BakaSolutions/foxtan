const CommonLogic = require('./common');

const CounterModel = require('../models/mongo/counter');

let Counter = module.exports = {};

Counter.read = async () => {
  return await CounterModel.read();
};

Counter.readOne = async board => {
  if (CommonLogic.isEmpty(board)) {
    throw {
      status: 404
    };
  }
  return await CounterModel.readOne(board);
};
