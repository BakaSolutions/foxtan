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
  async readOneByName(name) {
    return this._boardModel.readOneByName(name);
  }

  /**
   *
   * @param {Object}
   * @returns {Promise<Array>}
   */
  async readMany({ count, page, order } = {}) {
    return this._boardModel.readMany({ count, page, order });
  }
}

module.exports = BoardService;
