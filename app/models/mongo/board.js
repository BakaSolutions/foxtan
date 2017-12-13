const config = require('../../helpers/config');
const SuperModel = require('./super');

class BoardModel extends SuperModel {

  constructor() {
    super('board');
  }

  /**
   * Reads a board with defined board
   * @param {String} board
   * @return {Promise} -- with a board entry or an error
   */
  async readOne(board) {
    return await this.read({
      whereKey: 'board',
      whereValue: board,
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
  async readAll({includeHidden = false, order = null, orderBy = 'ASC', limit = 0, offset = 0} = {}) {
    return await this.read({
      whereKey: includeHidden
        ? 'hidden'
        : null,
      whereValue: 1,
      order: order,
      orderBy: orderBy,
      limit: limit,
      offset: offset
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
      whereKey: 'board',
      whereValue: board,
      order: 'createdAt',
      orderBy: 'DESC',
      limit: limit,
      offset: offset
    });
  }

}

module.exports = new BoardModel();
