class BoardService {

  /**
   *
   * @param {BoardModelInterface} BoardModel
   */
  constructor(BoardModel) {
    this._boardModel = BoardModel;
  }

  /**
   *
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
   *
   * @param {String} name
   * @returns {Promise<BoardDTO>}
   */
  readOneByName(name) {
    return this._boardModel.readOneByName(name);
  }

  /**
   *
   * @param {Object}
   * @returns {Promise<Array>}
   */
  readMany({ count, page, order } = {}) {
    return this._boardModel.readMany({ count, page, order });
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

  async getLastPostNumber(name) {
    let { max } = await this._boardModel.getLastPostNumber(name);
    return max;
  }
}

module.exports = BoardService;
