let lastPostNumbers = {}; // TODO: Redis caching

class BoardService {

  /**
   * @param {BoardModelInterface} BoardModel
   */
  constructor(BoardModel) {
    this._boardModel = BoardModel;
  }

  /**
   * @param {BoardDTO} boardDTO
   * @returns {Promise<String>} name
   */
  async create(boardDTO = {}) {
    if (!boardDTO.name) {
      throw new Error('Board name is not present');
    }
    if (!boardDTO.title) {
      throw new Error('Board title is not present');
    }
    let board = await this._boardModel.create(boardDTO);

    return board.name;
  }

  /**
   * @param {String} name
   * @returns {Promise<BoardDTO>}
   */
  readOneByName(name) {
    name = name?.toLocaleLowerCase();
    return this._boardModel.readOneByName(name);
  }

  /**
   * @param {Object}
   * @returns {Promise<Array>}
   */
  readMany({ count, page, order } = {}) {
    return this._boardModel.readMany({ count, page, order });
  }

  /**
   * @param {Number} postId
   * @returns {Promise<BoardDTO>}
   */
  readByPostId(postId) {
    return this._boardModel.readByPostId(postId);
  }

  async getLastPostNumbers() {
    let query = await this._boardModel.getLastPostNumbers();
    let out = {};
    for (let i = 0; i < query.length; i++) {
      let [key, value] = Object.values(query[i]);
      out[key] = value;
    }
    return out;
  }

  async getLastPostNumber(boardName) {
    if (lastPostNumbers[boardName]) {
      return lastPostNumbers[boardName];
    }
    let { max } = await this._boardModel.getLastPostNumber(boardName);
    lastPostNumbers[boardName] = max;
    return max;
  }

  async incrementLastPostNumber(boardName) {
    let currentLPN = await this.getLastPostNumber(boardName);
    return lastPostNumbers[boardName] = ++currentLPN;
  }
}

module.exports = BoardService;
