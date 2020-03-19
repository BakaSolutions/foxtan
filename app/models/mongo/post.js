const SuperModel = require('./super');
const CounterModel = require('./counter');

class PostModel extends SuperModel {

  constructor() {
    super('post');
  }

  async create() {
    return await super.create(...arguments).then(async out => {
      let createdPost = out.ops[0]; // NOTE: super.create() can work with 1+ posts ;)
      await CounterModel.update({
        query: {
          _id: createdPost.boardName
        },
        fields: {
          lastPostNumber: createdPost.number
        }
      });
      return this.clearEntry(createdPost);
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
   * @param {String} boardName
   * @param {Number} postNumber
   * @param {Boolean} [clear]
   * @return {Promise}
   */
  async readOne({boardName, postNumber: number, clear} = {}) {
    return await this.read({
      query: {
        boardName,
        number
      },
      limit: 1,
      clear
    });
  }

  /**
   * Counts how many posts are exist with defined board
   * @param {String} boardName
   * @param {Number} [threadNumber]
   * @param {Number} [limit]
   * @return {Promise}
   */
  async countPage({boardName, threadNumber, limit} = {}) {
    let query = {
      boardName
    };
    if (threadNumber) {
      query.threadNumber = threadNumber;
    }
    let out = await this.count({ query });
    return Math.ceil(out / limit);
  }

  /**
   * Reads post pages
   * @param {String} boardName
   * @param {Number} [threadNumber]
   * @param {Number} [page]
   * @param {Number} [limit]
   * @return {Promise}
   */
  async readPage({boardName, threadNumber, page = 0, limit = 0}) {
    let offset = page * limit;
    return await this.readAll({
      boardName,
      threadNumber,
      order: 'createdAt',
      orderBy: 'ASC',
      limit,
      offset
    });
  }

  /**
   * Reads all posts
   * @param {String} boardName
   * @param {Number} [threadNumber]
   * @param {String} [order]
   * @param {String} [orderBy]
   * @param {Number} [limit]
   * @param {Number} [offset]
   * @return {Promise}
   */
  async readAll({boardName, threadNumber, order = 'createdAt', orderBy = 'ASC', limit = null, offset = null}) {
    let query = {};
    if (boardName) {
      query.boardName = boardName;
    }
    if (threadNumber) {
      query.threadNumber = threadNumber;
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
    super.clearEntry(entry, false);
    delete entry.password;
    delete entry.id;
    return entry;
  }

}

module.exports = new PostModel();
