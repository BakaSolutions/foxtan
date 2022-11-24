class BoardModelInterface {

  async create(board) {}
  async readOneByName(name) {}
  async readMany({ count, page, order } = {}) {}
  async readByPostId(postId) {}
  async getLastPostNumbers() {}
  async getLastPostNumber(name) {}
  async update(board) {}
  async deleteOne(board) {}
  async deleteMany(board) {}

}

module.exports = BoardModelInterface;
