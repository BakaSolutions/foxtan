class AccessModelInterface {

  async create(board, thread, access) {}
  async readOne(id) {}
  async readMany(idArray) {}

}

module.exports = AccessModelInterface;
