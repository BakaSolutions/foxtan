const WebSocket = require('ws');
const { parse } = require('url');
const { BadRequestError, NotFoundError, CustomError } = require('../Domain/Error/index.js');
const EventBus = require('./EventBus.js');
const Session = require('./Session.js');

module.exports = class WS {

  /**
   *
   * @param app
   * @param {Server} server
   * @param {String} [path]
   */
  constructor (app, server, path = '/ws') {
    this.middlewares = {};
    this.instance = new WebSocket.Server({ noServer: true });

    server.on('upgrade', (request, socket, head) => {
      const { pathname } = parse(request.url);

      if (pathname === path) {
        let ctx = app.createContext(request);
        Session(ctx, async () => {
          this.instance.handleUpgrade(request, socket, head, ws => {
            ws.session = ctx.session;
            this.instance.emit('connection', ws, request);
          });
        });
        return;
      }
      socket.destroy();
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

    EventBus.on('broadcast', (type, event, data) => this.broadcast(type, event, data));
  }

  use (command, handler) {
    command = command?.toLocaleLowerCase();
    if (!this.middlewares[command]) {
      this.middlewares[command] = [];
    }
    this.middlewares[command].push(handler);
  }

  broadcast (type, event, data) {
    for (let client of this.instance.clients) {
      if (client.readyState === WebSocket.OPEN) {
        let out = this.process({type, event, data});
        client.send(out);
      }
    }
  }

  async onMessage (message, ws) {
    let params = {};
    try {
      params = JSON.parse(message);

      let sequence = this.middlewares[params.request?.toLocaleLowerCase()];
      if (!sequence) {
        return this.fail(ws, params, new NotFoundError());
      }

      try {
        let data = await WS._solveMiddlewares(sequence.slice(), params, ws);
        return this.success(ws, params, data ?? null);
      } catch (e) {
        message = JSON.stringify(params);
        if (e instanceof CustomError) {
          console.error(`[WS] [ERR] [${e.status}] ${message} ([${e.code}] ${e.message})`);
          return this.fail(ws, params, e.display());
        }
        console.error(`[WS] [ERR] [500] ${message} ([${e.code}] ${e.message})`);
        return this.fail(ws, params, {code: 500});
      }
    } catch (e) {
      return this.fail(ws, params, new BadRequestError());
    }
  }

  static async _solveMiddlewares(middlewares, params, ws) {
    let middlewareIterator = middlewares[Symbol.iterator]();
    let next = async () => await WS._solveMiddleware(middlewareIterator, params, ws, next);
    return next();
  }

  static async _solveMiddleware(middlewareIterator, params, ws, next) {
    let m = middlewareIterator.next();
    if (m.done) return;
    if (m.value.constructor.name === "AsyncFunction") {
      let out = await m.value(params, ws);
      await next();
      return out;
    }
    return m.value(params, ws, next);
  }

  success(ws, what, data) {
    let body = this.process({ what, data });
    ws.send(body);
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

  /**
   * Remove nulls, NaNs, empty strings and empty arrays from data
   * Sadly it won't work for empty nested objects
   */
  process (out = {}) {
    return JSON.stringify(
      out,
      (_, value) => {
        if ([null, NaN, undefined].includes(value)) {
          return undefined;
        }

        if (0 === value?.length) {
          return undefined;
        }

        return value;
      }
    );
  }

};
