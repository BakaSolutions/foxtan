const {
  MissingParamError,
  ThreadNotFoundError,
  ThreadsNotFoundError
} = require('../../Domain/Error/index.js');

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
   * @returns {Promise<ThreadDTO>}
   */
  async create(threadDTO) {
    if (!threadDTO.boardName) {
      throw new MissingParamError('Board name is not present');
    }
    return await this._threadModel.create(threadDTO);
  }

  /**
   *
   * @param {Number} id
   * @returns {Promise<ThreadDTO>}
   */
  async readOneById(id) {
    try {
      return this._threadModel.readOneById(id);
    } catch (e) {
      throw new ThreadNotFoundError();
    }
  }

  /**
   *
   * @param {Number} headId
   * @returns {Promise<ThreadDTO>}
   */
  async readOneByHeadId(headId) {
    try {
      return this._threadModel.readOneByHeadId(headId);
    } catch (e) {
      throw new ThreadNotFoundError();
    }
  }

  /**
   *
   * @param {String} boardName
   * @param {Number} postNumber
   * @returns {Promise<ThreadDTO>}
   */
  async readOneByBoardAndPost(boardName, postNumber) {
    try {
      return this._threadModel.readOneByBoardAndPost(boardName, postNumber);
    } catch (e) {
      throw new ThreadNotFoundError();
    }
  }

  /**
   *
   * @param {Object}
   * @returns {Promise<Array>}
   */
  async readMany({ count, page, order } = {}) {
    try {
      return this._threadModel.readMany({ count, page, order });
    } catch (e) {
      throw new ThreadsNotFoundError();
    }
  }

  /**
   *
   * @param {String} boardName
   * @param {Number} count
   * @param {Number} page
   * @returns {Promise<Array>} boards
   */
  async readAllByBoard(boardName, { count, page } = {}) {
    try {
      return this._threadModel.readAllByBoard(boardName, { count, page });
    } catch (e) {
      throw new ThreadsNotFoundError();
    }
  }

  async countByBoard(boardName) {
    try {
      return await this._threadModel.countByBoard(boardName);
    } catch (e) {
      return 0;
    }
  }

  async countByBoards() {
    return this._threadModel.countByBoards();
  }

  /**
   *
   * @param {Number} id
   * @param {Number} priority
   * @returns {Promise<{updated: Number}>}
   */
  async pin({ id, priority} = {}) {
    try {
      let updated = await this._threadModel.pin({ id, priority });
      return { updated };
    } catch (e) {
      return { updated: 0 };
    }
  }

  deleteOne(thread) {
    return this._threadModel.deleteOne(thread);
  }

}

module.exports = ThreadService;
