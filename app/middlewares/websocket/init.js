const IndexLogic = require('../../logic');

const Controller = require('../../helpers/ws.js');

module.exports = [
  {
    command: 'INIT',
    middleware: init
  },
];

async function init(command, message, id, ws) {
  return Controller.success(ws, IndexLogic.index(), id);
}
