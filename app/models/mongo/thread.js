const config = require('../../helpers/config');
const SuperModel = require('./super');
const BoardModel = require('./board');

class ThreadModel extends SuperModel {

  constructor() {
    super('thread');
  }

  async read({limit, clear = true} = {}) {
    return await super.read(...arguments).then(async out => {
      if (!out || !clear) {
        return out;
      }

      if (!Array.isArray(out)) {
        out = [ out ];
      }

      out = out.map(entry => this.clearEntry(entry, true));

      return limit > 1 || !limit
          ? out
          : out[0];
    });
  }

  /**
   * Reads a thread with defined number
   * @param {String} board
   * @param {Number} thread
   * @return {Promise}
   */
  async readOne({board, thread} = {}) {
    return await this.read({
      query: {
        boardName: board,
        number: thread
      },
      limit: 1
    });
  }

  async countPage({board, limit} = {}) {
    let out = await this.count({
      query: {
        boardName: board
      }
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
      board,
      order: ['pinned', 'updatedAt'],
      orderBy: ['DESC'],
      limit,
      offset
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
  async readAll({board = null, order = 'createdAt', orderBy = 'DESC', limit = null, offset = null} = {}) {
    let query = {};
    if (board) {
      query.boardName = board;
    }

    return await this.read({
      query,
      order,
      orderBy,
      limit,
      offset
    })
  }

  /**
   * Gets number of posts of a thread with defined threadNames
   * @param {String, Array} [boards]
   * @param {String, Array} [threads]
   * @return {Promise}
   */
  async getCounters({boards, threads} = {}) {
    const PostModel = require('./post');

    if (typeof boards === 'undefined') {
      boards = (await BoardModel.readAll()).map(board => board.uri);
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
      let postEntry = await PostModel.readAll({
        board,
        thread,
        order: 'createdAt',
        orderBy: 'DESC',
        limit: 1
      });
      out[board][number] = postEntry !== null
        ? postEntry.number
        : null;
    }
    return threads.length === 1
      ? out[boards[0]][threads[0]]
      : out;
  }

}

module.exports = new ThreadModel();
