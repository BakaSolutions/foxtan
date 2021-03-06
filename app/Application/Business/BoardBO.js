const { BoardNotFoundError } = require('../../Domain/Error/index.js');

class BoardBO {

  constructor(BoardService) {
    this.BoardService = BoardService;
  }

  create(board) {
    return this.BoardService.create(board);
  }

  readOne(name) {
    return this.BoardService.readOneByName(name);
  }

  async readMany({ count, page, order, asObject }) {
    let boards = await this.BoardService.readMany({ count, page, order });
    if (!asObject) {
      return boards;
    }

    let out = {};
    for (let i = 0; i < boards.length; i++) {
      out[boards[i].name] = boards[i];
    }
    return out;
  }

  sync() {
    return this.BoardService.getLastPostNumbers();
  }

  getLastPostNumber(name) {
    if (!name) {
      throw new BoardNotFoundError('No board name to select last post number!');
    }
    return this.BoardService.getLastPostNumber(name);
  }

  /*
  close(boardName, closed) {
    this.BoardService.close(closed);
  }

  rename(name, newName) {
    this.BoardService.rename(name, newName);
  }

  deleteOne(name) {
    this.BoardService.deleteOne(name);
  }

  deleteMany(names) {
    this.BoardService.deleteMany(names);
  }
  */

}

module.exports = BoardBO;
