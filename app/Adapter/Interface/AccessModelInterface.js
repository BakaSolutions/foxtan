class AccessModelInterface {

  async create(board, thread, access) {}
  async readOne(id) {}
  async readMany(idArray) {}
  async readByGroupAndBoard(group, board) {}

}

module.exports = AccessModelInterface;
