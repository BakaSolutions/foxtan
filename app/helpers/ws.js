const WSServer = require('../core/ws.js');

let instance = null;

module.exports = (server, path) => {
  if (instance === null) {
    instance = new WSServer(server, path);
  }
  return instance;
};
