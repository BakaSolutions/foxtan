const config = require('../../helpers/config');
const SuperModel = require('./super');
const BoardModel = require('./board');
const CounterModel = require('./counter');

class ThreadModel extends SuperModel {

  constructor() {
    super('thread');
  }

  /**
   * Reads a thread with defined number
   * @param {String} board
   * @param {Number} thread
   * @return {Promise}
   */
  async readOne({board, thread} = {}) {
    return await this.read({
      whereKey: ['boardName', 'number'],
      whereValue: [board, +thread],
      limit: 1
    });
  }

  async countPage({board, limit = config('board.threadsPerPage')} = {}) {
    let out = await this.count({
      whereKey: 'boardName',
      whereValue: board
    });
    return Math.ceil(out / limit);
  }

  /**
   * Reads thread pages
   * @param {String} [board]
   * @param {Number} [page]
   * @param {Number} [limit]
   * @return {Promise}
   */
  async readPage({board = null, page = 0, limit = config('board.threadsPerPage')} = {}) {
    let offset = page * limit;
    return await this.readAll({
      board: board,
      order: 'updatedAt',
      orderBy: 'DESC',
      limit: limit,
      offset: offset
    });
  }

  /**
   * Reads thread posts
   * @param {String} [board]
   * @param {String} [order]
   * @param {String} [orderBy]
   * @param {Number} [limit]
   * @param {Number} [offset]
   * @return {Promise}
   */
  async readAll({board = null, order = 'createdAt', orderBy = 'ASC', limit = null, offset = null} = {}) {
    return await this.read({
      whereKey: board ? 'boardName' : null,
      whereValue: board,
      order: order,
      orderBy: orderBy,
      limit: limit,
      offset: offset
    })
  }

  /**
   * Gets number of posts of a thread with defined threadNames
   * @param {String, Array} [boards]
   * @param {String, Array} [threads]
   * @return {Promise}
   */
  async getCounters({boards, threads} = {}) {
    if (typeof boards === 'undefined') {
      boards = await BoardModel.readAll();
      boards = boards.map(function(board) {
        return board.uri;
      });
    } else if (!Array.isArray(boards)) {
      boards = [ boards ];
    }

    if (!Array.isArray(threads)) {
      threads = [ threads ];
    }

    let out = {};
    for (let i = 0; i < threads.length; i++) {
      let board = boards[i] || boards[0];
      let number = threads[i] || null;
      if (!out[board]) {
        out[board] = {};
      }
      let threadEntry = await this.readOne({
        board: board,
        thread: number
      });
      out[board][number] = threadEntry['number'];
    }
    return threads.length === 1
      ? out[boards[0]][threads[0]]
      : out;
  }


  /**
   * Return some counters to be a client synced
   * @return {Promise}
   */
  async syncData() {
    const PostModel = require('./post');
    let out = {
      lastPostNumbers: await CounterModel.read(),
      threadCounts: {}
    };
    await this.readAll().then(async threads => {
      for (let i = 0; i < threads.length; i++) {
        if (typeof out.threadCounts[threads[i].boardName] === 'undefined') {
          out.threadCounts[threads[i].boardName] = {};
        }
        out.threadCounts[threads[i].boardName][+threads[i].number] = await PostModel.count({
          whereKey: ['boardName', 'threadNumber'],
          whereValue: [threads[i].boardName, +threads[i].number]
        });
      }
    });
    return out;
  }
}

module.exports = new ThreadModel();