class ThreadService {

  /**
   *
   * @param {ThreadModelInterface} ThreadModel
   */
  constructor(ThreadModel) {
    this._threadModel = ThreadModel;
  }

  /**
   *
   * @param {ThreadDTO} threadDTO
   * @returns {Promise<Number>} id
   */
  async create(threadDTO = {}) {
    if (!threadDTO.boardName) {
      throw new Error('Board name is not present');
    }
    let thread = await this._threadModel.create(threadDTO);

    return thread.id;
  }

  /**
   *
   * @param {Number} id
   * @returns {Promise<ThreadDTO>}
   */
  async readOneById(id) {
    return this._threadModel.readOneById(id);
  }

  /**
   *
   * @param {Number} headId
   * @returns {Promise<ThreadDTO>}
   */
  async readOneByHeadId(headId) {
    return this._threadModel.readOneByHeadId(headId);
  }

  /**
   *
   * @param {String} boardName
   * @param {Number} postNumber
   * @returns {Promise<ThreadDTO>}
   */
  async readOneByBoardAndPost(boardName, postNumber) {
    return this._threadModel.readOneByBoardAndPost(boardName, postNumber);
  }

  /**
   *
   * @param {Object}
   * @returns {Promise<Array>}
   */
  async readMany({ count, page, order } = {}) {
    return this._threadModel.readMany({ count, page, order });
  }

  /**
   *
   * @param {String} boardName
   * @param {Number} count
   * @param {Number} page
   * @returns {Promise<Array>} boards
   */
  async readAllByBoard(boardName, { count, page } = {}) {
    return this._threadModel.readAllByBoard(boardName, { count, page });
  }

}

module.exports = ThreadService;
