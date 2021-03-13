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
   * @returns {Promise<String>} name
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
   * @returns {Promise<BoardDTO>}
   */
  async readOneById(id) {
    return this._threadModel.readOneById(id);
  }

  /**
   *
   * @param {Object}
   * @returns {Promise<Array>}
   */
  async readMany({ count, page, order } = {}) {
    return this._threadModel.readMany({ count, page, order });
  }

  async readAllByBoard(boardName) {
    return this._threadModel.readAllByBoard(boardName);
  }

  addPosts(thread, posts) {
    thread.posts = posts;
    return thread;
  }

}

module.exports = ThreadService;
