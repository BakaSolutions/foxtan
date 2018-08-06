const config = require('../../helpers/config');
const SuperModel = require('./super');

class BoardModel extends SuperModel {

  constructor() {
    super('board');
  }

  async read({limit, clear = true} = {}) {
    return await super.read(...arguments).then(async out => {
      if (!out || !clear) {
        return out;
      }

      if (!Array.isArray(out)) {
        out = [ out ];
      }

      out = out.map(entry => {
        this.clearEntry(entry, true);

        if (!entry.hidden) {
          entry.hidden = false;
        }
        if (!entry.closed) {
          entry.closed = false;
        }
        if (!entry.subtitle) {
          entry.subtitle = '';
        }
        if (!entry.fileLimit) {
          entry.fileLimit = 0;
        }
        if (!entry.defaultUsername) {
          entry.defaultUsername = '';
        }

        return entry;
      });

      return limit !== 1
          ? out
          : out[0];
    });
  }

  /**
   * Reads a board with defined board
   * @param {String} board
   * @return {Promise} -- with a board entry or an error
   */
  async readOne(board) {
    return await this.read({
      query: { board },
      limit: 1
    });
  }

  /**
   * Reads all boards
   * @param {Boolean} [includeHidden]
   * @param {String} [order]
   * @param {String} [orderBy]
   * @param {Number} [limit]
   * @param {Number} [offset]
   * @return {Promise}
   */
  async readAll({includeHidden = false, order = 'board', orderBy = 'ASC', limit = 0, offset = 0} = {}) {
    let query = {};
    if (includeHidden) {
      query.hidden = 1;
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
   * Reads board pages
   * @param {String|Array} [board]
   * @param {Number} [page]
   * @param {Number} [limit]
   * @return {Promise} -- with board entries or an error
   */
  async readPage({board = null, page = 0, limit = config('board.threadsPerPage')} = {}) {
    let offset = page * limit;
    return await this.readAll({
      query: { board },
      order: 'createdAt',
      orderBy: 'DESC',
      limit,
      offset
    });
  }

}

module.exports = new BoardModel();
