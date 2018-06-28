const config = require('../../helpers/config')

const SuperModel = require('./super');
const ThreadModel = require('./thread');
const CounterModel = require('./counter');
const AttachmentModel = require('./attachment');

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
          entry = this.clearEntry(entry);
        }
        if (!entry.files.length) {
          return entry;
        }
        return await this._appendAttachments(entry);
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
      query: {
        boardName: board,
        threadNumber: thread
      },
      order,
      orderBy,
      limit,
      offset
    })
  }

  clearEntry(entry) {
    super.clearEntry(entry);
    if ( (entry.number !== entry.threadNumber)
      && (typeof entry.subject === 'undefined' || entry.subject === '') ) {
        entry.subject = config(`board.${entry.boardName}.defaultUserName`, config('board.defaultUserName'))
    }
    delete entry.password;
    return entry;
  }

  async _appendAttachments(post) {
    for (let i = 0; i < post.files.length; i++) {
      let hash = post.files[i];
      post.files[i] = await AttachmentModel.readOne({
        _id: hash
      });
    }
    return post;
  }


}

module.exports = new PostModel();
