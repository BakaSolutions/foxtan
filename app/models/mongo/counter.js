//const config = require('../../helpers/config');
const SuperModel = require('./super');

class CounterModel extends SuperModel {

  constructor() {
    super('counter');
  }

  async read() {
    return await super.read().then(counters => {
      let out = {};
      for (let i = 0; i < counters.length; i++) {
        out[counters[i]['_id']] = counters[i].lastPostNumber;
      }
      return out;
    });
  }

  async readOne(board) {
    return await super.read({
      whereKey: '_id',
      whereValue: board,
      limit: 1
    }).then(counter => {
      let out = {};
        out[counter['_id']] = counter.lastPostNumber;
      return out;
    });
  }

}

module.exports = new CounterModel();
