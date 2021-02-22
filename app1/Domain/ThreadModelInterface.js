class ThreadModelInterface {

  async create(thread) {}
  async readOneById(id) {}
  async readMany({ count, page, order } = {}) {}
  async update(thread) {}
  async deleteOne(thread) {}
  async deleteMany(thread) {}

}

module.exports = ThreadModelInterface;
