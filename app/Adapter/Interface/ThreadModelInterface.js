class ThreadModelInterface {

  async create(thread) {}
  async readOneById(id) {}
  async readOneByHeadId(headId) {}
  async readMany({ count, page, order } = {}) {}
  async readAllByBoard(boardName, { count, page }) {}
  async countByBoard(boardName) {}
  async countByBoards() {}
  async readOneByBoardAndPost(boardName, postNumber) {}
  async update(thread) {}
  async deleteOne(thread) {}
  async deleteMany(thread) {}

}

module.exports = ThreadModelInterface;
