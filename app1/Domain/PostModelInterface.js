class PostModelInterface {

  async create(post) {}
  async readOneById(id) {}
  async readOneByThreadId(threadId) {}
  async readByThreadId(threadId, { count, page, order } = {}) {}
  async readByBoardName(boardName, { count, page, order } = {}) {}
  async countByThreadId(threadId) {}
  async update(post) {}
  async deleteOne(post) {}
  async deleteMany(post) {}

}

module.exports = PostModelInterface;
