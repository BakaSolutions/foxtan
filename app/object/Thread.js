const AppObject = require('../core/AppObject.js');

class Thread extends AppObject {

  constructor({ creative } = {creative: false}) {
    super();
    if (!creative) {
      super._init('id', this.setId);
    }
    super._init('boardName', this.setBoardName);
    super._init('pinned', null, 0);
    super._init('modifiers', null, []);
    super._lock();
  }

  setBoardName(boardName) {
    let board = /*BoardLogic.getByName(*/boardName;
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
