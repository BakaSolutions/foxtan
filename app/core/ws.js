const WebSocket = require('ws');

const EventBus = require('./event.js');

module.exports = class WS {
  constructor (server, path = '/ws') {
    this.middlewares = {};
    this.instance = new WebSocket.Server({
      server,
      path
    });

    this.instance.on('connection', ws => {
      ws.isAlive = true;

      ws.on('pong', () => ws.isAlive = true);
      ws.on('message', async message => await this.onMessage(message, ws));
    });

    this.interval = setInterval(() => {
      for (let client of this.instance.clients) {
        if (!client.isAlive) {
          return client.terminate();
        }
        client.isAlive = false;
        client.ping();
      }
    }, 30000);

    EventBus.on('ws.broadcast', data => this.broadcast(data));
  }

  use (command, handler) {
    if (!this.middlewares[command]) {
      this.middlewares[command] = [];
    }
    this.middlewares[command].push(handler);
  }

  broadcast (data) {
    for (let client of this.instance.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    }
  }

  async onMessage (message, ws) {
    try {
      let params = JSON.parse(message);

      let sequence = this.middlewares[params.request];
      if (!sequence) {
        return this.fail(ws, {code: 404});
      }


      try {
        await WS._solveMiddlewares(sequence.slice(), params, ws);
      } catch (e) {
        if (e instanceof Error) {
          EventBus.emit('error', e);
          return this.fail(ws, params, {code: 500});
        }
        return this.fail(ws, params, e);
      }
    } catch (e) {
      return this.fail(ws, {}, {code: 400});
    }
  }

  static async _solveMiddlewares(middlewares, params, ws) {
    let middlewareIterator = middlewares[Symbol.iterator]();
    let next = async () => await WS._solveMiddleware(middlewareIterator, params, ws, next);
    await next();
  }

  static async _solveMiddleware(middlewareIterator, params, ws, next) {
    let m = middlewareIterator.next();
    if (m.done) return;
    if (m.value.constructor.name === "AsyncFunction") {
      await m.value(params, ws);
      await next();
      return;
    }
    m.value(params, ws, next);
  }

  success(ws, what, data) {
    let out = Object.assign({what}, {data});
    ws.send(JSON.stringify(out));
  }

  fail(ws, what, e) {
    let error = {
      message: e ? e.message : e,
      description: e ? e.description : e,
      code: e
        ? e.code || 500
        : e
    };

    let out = Object.assign({what}, {error});
    ws.send(JSON.stringify(out));
  }
};
