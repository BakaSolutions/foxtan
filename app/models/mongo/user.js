const config = require('../../helpers/config');
const SuperModel = require('./super');

class UserModel extends SuperModel {

  constructor() {
    super('user');
  }

  /**
   * Reads a user with defined login
   * @param {String} [_id]
   * @param {String} [token]
   * @param {Boolean} [clear]
   * @return {Promise}
   */
  async readOne({_id, token, clear = false} = {}) {
    return await this.read({
      query: {
        token,
        _id
      },
      limit: 1,
      clear
    });
  }

  async countPage({query, limit = config('board.threadsPerPage')} = {}) {
    let out = await this.count(query);
    return Math.ceil(out / limit);
  }

  /**
   * Reads some users
   * @param {Object} [query]
   * @param {Number} [page]
   * @param {Number} [limit]
   * @return {Promise}
   */
  async readPage({query, page = 0, limit = config('board.threadsPerPage')} = {}) {
    let offset = page * limit;
    return await this.readAll({
      query,
      order: 'updatedAt',
      orderBy: 'DESC',
      limit,
      offset
    });
  }

  /**
   * Reads all users
   * @param {Object} [query]
   * @param {String} [order]
   * @param {String} [orderBy]
   * @param {Number} [limit]
   * @param {Number} [offset]
   * @return {Promise}
   */
  async readAll({query, order = 'createdAt', orderBy = 'ASC', limit = null, offset = null} = {}) {
    return await this.read({
      query,
      order,
      orderBy,
      limit,
      offset
    })
  }

}

module.exports = new UserModel();
