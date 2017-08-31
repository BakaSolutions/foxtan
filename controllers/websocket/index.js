const WebSocket = require('ws');

class WS {
  constructor (server) {
    this.handlers = [];
    this.instance = new WebSocket.Server({
      server: server,
      path: '/ws'
    });
    this.instance.on('connection', (ws) => {
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
    for (let i = 0; i < this.instance.clients.length; i++) {
      client = this.instance.clients[i];
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    }
  }

  onMessage (message, ws) {
    message = message.split(' ');
    let command = message.shift();
    message = message.join(' ');

    message = message.split(' @');
    let id = ' @' + message.pop();
    message = message.join(' @');

    let sequence = this.handlers[command];
    if (!sequence) {
      return this.throw(ws, 404, id);
    }
    sequence = sequence.slice();

    function solveMiddleware(command, message, id, ws, err) {
      if (!sequence.length) {
        return;
      }
      let fn = sequence.shift();

      function next() {
        solveMiddleware(command, message, id, ws, err);
      }
      fn(command, message, id, ws, err, next);
    }

    solveMiddleware(command, message, id, ws, this.throw);
  }

  throw (ws, code, id, err) {
    let out = 'FAIL ';
    out += (code)
      ? code
      : 500;
    if (err) out += ' #' + err;
    if (id)  out += id;
    ws.send(out);
  }
}

module.exports = WS;
