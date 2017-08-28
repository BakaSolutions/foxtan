const WebSocket = require('ws');

class WS {
  constructor (server) {
    this.handlers = [];
    this.wss = new WebSocket.Server({
      server: server,
      path: '/ws'
    });
    this.wss.on('connection', (ws) => {
      this.onOpen(ws);

      ws.on('message', (message) => {
        this.onMessage(message, ws);
      });
    });
  }

  use (command, handler) {
    if (!this.handlers[command]) {
      this.handlers[command] = [];
    }
    this.handlers[command].push(handler);
  }

  broadcast (data) {
    let client;
    for (let i = 0; i < this.wss.clients.length; i++) {
      client = this.wss.clients[i];
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    }
  }

  onOpen (ws) {

  }

  onMessage (message, ws) {
    message = message.split(' ');
    let command = message.shift();
    message = message.join();

    let sequence = this.handlers[command];

    if (!sequence) {
      return ws.send('404');
    }

    function solveMiddleware(command, message, ws) {
      if (!sequence.length) {
        return;
      }
      let fn = sequence.shift();

      function next() {
        solveMiddleware(command, message, ws);
      }
      fn(command, message, ws, next);
    }

    solveMiddleware(command, message, ws);
  }
}

module.exports = WS;
