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
        query: {
          _id: out.ops[0].boardName
        },
        fields: {
          lastPostNumber: out.ops[0].number
        }
      });
      return this.clearEntry(out.ops[0]);
    }).then(async out => {
      if (!out.sage) {
        await ThreadModel.update({
          query: {
            boardName: out.boardName,
            number: out.threadNumber
          },
          fields: {
            updatedAt: new Date
          }
        })
      }
      return out;
    });
  }

  async read({limit, clear = true} = {}) {
    return await super.read(...arguments).then(async out => {
      if (!out) {
        return out;
      }

      if (!Array.isArray(out)) {
        out = [ out ];
      }

      out = await Promise.all(out.map(async entry => {
        if (clear) {
          entry = this.clearEntry(entry, true);
        }
        if (!entry.text) {
          entry.text = '';
        }
        if (!entry.sage) {
          entry.sage = false;
        }
        return entry;
      }));

      return limit !== 1
          ? out
          : out[0];
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
      query: {
        boardName: board,
        number: +post
      },
      limit: 1,
      clear
    });
  }

  /**
   * Counts how many posts are exist with defined board
   * @param {String} board
   * @param {Number} [thread]
   * @param {Number} limit
   * @return {Promise}
   */
  async countPage({board, thread, limit} = {}) {
    let query = {};
    if (board) {
      query.boardName = board;
    }
    if (thread) {
      query.threadNumber = thread;
    }
    let out = await this.count({ query });
    return Math.ceil(out / limit);
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
      query: {
        boardName: board,
        threadNumber: thread
      },
      order: 'createdAt',
      orderBy: 'ASC',
      limit,
      offset
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
    let query = {};
    if (board) {
      query.boardName = board;
    }
    if (thread) {
      query.threadNumber = thread;
    }
    return await this.read({
      query,
      order,
      orderBy,
      limit,
      offset
    })
  }

  clearEntry(entry) {
    super.clearEntry(entry, true);
    delete entry.password;
    delete entry.id;
    return entry;
  }

}

module.exports = new PostModel();
