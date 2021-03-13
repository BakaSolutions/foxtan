
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

  readMany({ count, page, order }) {
    return this.BoardService.readMany({ count, page, order });
  }

  sync() {
    return this.BoardService.getLastPostNumbers();
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
