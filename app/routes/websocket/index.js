const WebSocket = require('ws');

class WS {
  constructor (server) {
    this.handlers = [];
    this.instance = new WebSocket.Server({
      server: server,
      path: '/ws'
    });

    this.instance.on('connection', ws => {
      ws.isAlive = true;

      ws.on('pong', () => {
        ws.isAlive = true;
      });
      ws.on('message', (message) => {
        this.onMessage(message, ws);
      });
    });

    this.interval = setInterval(() => {
      for (let client of this.instance.clients) {
        if (!client.isAlive) {
          return client.terminate();
        }
        client.isAlive = false;
        client.ping('NUS', false, true);
      }
    }, 30000);
  }

  use (command, handler) {
    if (!this.handlers[command]) {
      this.handlers[command] = [];
    }
    this.handlers[command].push(handler);
  }

  broadcast (data) {
    for (let client of this.instance.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    }
  }

  onMessage (message, ws) {
    let id;
    if (/ @[0-9a-f]+$/.test(message)) {
      message = message.split(' @');
      id = ' @' + message.pop();
      message = message.join(' @');
    }

    message = message.split(' ');
    let command = message.shift();
    message = message.join(' ');

    let sequence = this.handlers[command];
    if (!sequence) {
      return fail(ws, {status: 404}, id);
    }
    sequence = sequence.slice();

    function solveMiddleware(command, message, id, ws) {
      if (!sequence.length) {
        return;
      }

      let fn = sequence.shift();
      function next() {
        solveMiddleware(command, message, id, ws);
      }
      fn(command, message, id, ws, next).then(next);
    }

    solveMiddleware(command, message, id, ws);
  }
}

let instance;

module.exports = server => {
  if (!instance) {
    instance = new WS(server);
  }
  return instance;
};

function success(ws, out, id) {
  if (typeof out === 'object') {
    try {
      out = JSON.stringify(out);
    } catch (e) {
      //
    }
  }
  if (id) {
    out += id;
  }
  ws.send(out);
}
module.exports.success = success;

function fail(ws, out, id) {
  let output = 'FAIL ';
  output += out
      ? out.status || 500
      : 500;
  if (out.message) {
    output += ' #' + out.message;
  }
  if (id) {
    output += id;
  }
  ws.send(output);
}
module.exports.fail = fail;
