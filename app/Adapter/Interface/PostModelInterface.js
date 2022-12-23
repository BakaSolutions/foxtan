class PostModelInterface {

  async create(post) {}
  async readOneById(id) {}
  async readOneByThreadId(threadId) {}
  async readOneByBoardAndPost(boardName, number) {}
  async readManyByBoardAndPosts(boardName, numbers) {}
  async readByThreadId(threadId, { count, page, order } = {}) {}
  async readByBoardNameAndThreadNumber(boardName, threadNumber, { count, page, order } = {}) {}
  async readByBoardName(boardName, { count, page, order } = {}) {}
  async readByAttachmentHash(hash) {}
  async countByThreadId(threadId) {}
  async countByBoardName(boardName) {}
  async update(post) {}
  async deleteOne(post) {}
  async deleteMany(post) {}

}

module.exports = PostModelInterface;
