const IndexLogic = require('../../../logic');

const Controller = require('../index');

module.exports = [
  {
    command: 'INIT',
    middleware: init
  },
];

async function init(command, message, id, ws) {
  return Controller.success(ws, IndexLogic.index(), id);
}
