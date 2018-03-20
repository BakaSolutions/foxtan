const SuperModel = require('./super');
const ThreadModel = require('./thread');
const CounterModel = require('./counter');

class PostModel extends SuperModel {

  constructor() {
    super('post');
  }

  async create() {
    return await super.create(...arguments).then(async out => {
      await CounterModel.update({
        whereKey: '_id',
        whereValue: out.ops[0].boardName,
        fields: {
          lastPostNumber: out.ops[0].number
        }
      });
      return super.clearEntry(out.ops[0]);
    }).then(async out => {
      if (!out.sage) {
        await ThreadModel.update({
          whereKey: ['boardName', 'number'],
          whereValue: [out.boardName, out.threadNumber],
          fields: {
            updatedAt: new Date
          }
        })
      }
      return out;
    });
  }

  /**
   * Reads a post with defined number
   * @param {String} board
   * @param {String|Number} post
   * @param {Boolean} [clear]
   * @return {Promise}
   */
  async readOne({board, post, clear}) {
    return await this.read({
      whereKey: ['boardName', 'number'],
      whereValue: [board, +post],
      limit: 1,
      clear: clear
    });
  }

  /**
   * Reads post pages
   * @param {String} board
   * @param {Number} [thread]
   * @param {Number} [page]
   * @param {Number} [limit]
   * @return {Promise}
   */
  async readPage({board, thread, page = 0, limit = 0}) {
    let offset = page * limit;
    return await this.readAll({
      whereKey: ['boardName', 'threadNumber'],
      whereValue: [board, thread],
      order: 'createdAt',
      orderBy: 'ASC',
      limit: limit,
      offset: offset
    });
  }

  /**
   * Reads all posts
   * @param {String} board
   * @param {Number} [thread]
   * @param {String} [order]
   * @param {String} [orderBy]
   * @param {Number} [limit]
   * @param {Number} [offset]
   * @return {Promise}
   */
  async readAll({board, thread, order = 'createdAt', orderBy = 'ASC', limit = null, offset = null}) {
    return await this.read({
      whereKey: ['boardName', 'threadNumber'],
      whereValue: [board, thread],
      order: order,
      orderBy: orderBy,
      limit: limit,
      offset: offset
    })
  }

}

module.exports = new PostModel();
