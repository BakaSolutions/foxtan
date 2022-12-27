const { BoardNotFoundError } = require('../../Domain/Error/index.js');
const EventBus = require('../../Infrastructure/EventBus.js');

class BoardBO {

  constructor({ BoardService, ThreadService }) {
    this.BoardService = BoardService;
    this.ThreadService = ThreadService;
  }

  async create(board) {
    let Board = await this.BoardService.create(board);
    EventBus.emit('broadcast', 'board', 'created', Board);
    return Board;
  }

  async readOne(boardName) {
    let board = await this.BoardService.readOneByName(boardName);
    board.threadCount = await this.ThreadService.countByBoard(boardName);
    return board;
  }

  async readMany({ count, page, order, asObject } = {}) {
    let boards = await this.BoardService.readMany({ count, page, order });
    if (!asObject) {
      return boards;
    }

    let boardCounts = await this.ThreadService.countByBoards();

    let out = {};
    for (let i = 0; i < boards.length; i++) {
      let boardName = boards[i].name;
      out[boardName] = boards[i];
      out[boardName].threadCount = boardCounts[boardName] || 0;
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

  incrementLastPostNumber(name) {
    if (!name) {
      throw new BoardNotFoundError('No board name to increment last post number!');
    }
    return this.BoardService.incrementLastPostNumber(name);
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
