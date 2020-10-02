const AppObject = require('../core/AppObject.js');
const BoardLogic = require('../logic/board.js');

class Thread extends AppObject {

  constructor({ creative } = {creative: false}) {
    super();
    if (!creative) {
      super._init('id', this.setId);
    }
    super._init('boardName', creative ? this.setBoardName : null);
    super._init('pinned', null, 0);
    super._init('modifiers', null, []);
    super._lock();
  }

  setBoardName(boardName) {
    let board = BoardLogic.readOne(boardName);
    if (!board) {
      throw new Error('Board doesn\'t exist!');
    }
    if (board.closed) {
      throw new Error('Board is closed!');
    }
    return boardName;
  }

}

module.exports = Thread;
