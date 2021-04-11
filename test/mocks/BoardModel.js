const BoardModelInterface = require('../../app/Domain/BoardModelInterface.js');
const BoardDTO = require('../../app/Infrastructure/BoardDTO.js');

class BoardModelMock extends BoardModelInterface {

  constructor() {
    super();
    this.flush();
  }

  async create(board) {
    this.storage.push(board);
    return {
      name: board.name
    };
  }

  async readOneByName(name) {
    let board = this.storage.filter(board => board.name);
    return Array.isArray(board)
      ? BoardDTO.from(board[0])
      : BoardDTO.from(board);
  }

  flush() {
    this.storage = [];
  }

}

module.exports = BoardModelMock;
