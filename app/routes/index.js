const Controllers = module.exports = {};

const Busboy = require('busboy');
const Tools = require('../helpers/tools');
const config = require('../helpers/config');
const UserLogic = require('../logic/user');
const WS = require('./websocket');

/**
 * Inits controllers: requires all .js from /controllers/http/ and sets routers
 * @param app
 */
Controllers.initHTTP = async app => {
  if (config('server.enableStatic')) {
    if (Tools.moduleAvailable('koa-static')) {
      const Static = require('koa-static');
      app.use(Static(__dirname + '/../../public'));
    } else {
      console.warn(
          '\x1b[35mЧтобы использовать Foxtan без Nginx, установите модуль koa-static:\x1b[0m\n\n' +
          '\x1b[36m           npm i koa-static \x1b[0m или \x1b[36m yarn add koa-static\x1b[0m\n\n'
      );
    }
  }

  app.use(async (ctx, next) => {
    try {
      await Controllers.parseForm(ctx);
      if (config('server.enableStatic')) {
        ctx.set('Access-Control-Allow-Origin', '*');
      }
      await next();
    } catch (err) {
      ctx.status = err.status || 500;
      ctx.body = config('debug') && ctx.status >= 500
          ? '<pre>\n' + (err.stack || err) + '\n</pre>'
          : {error: err.name, message: err.message};
      ctx.app.emit('error', err, ctx);
    }
  });

  app.keys = [Buffer.from(config('server.cookie.secret'))];
  app.use(async (ctx, next) => {
    let token;
    if (ctx.headers['X-Access-Token']) {
      token = ctx.headers['X-Access-Token'];
    } else {
      token = ctx.cookies.get('accessToken', {signed: config('server.cookie.signed')})
    }
    if (!token) {
      return await next();
    }
    try {
      ctx.request.user = UserLogic.checkToken(token);
    } catch (e) {
      ctx.throw(403, {
        message: e.message
      });
    }
    await next();
  });

  app.use(async (ctx, next) => {
    const start = +new Date;
    await next();
    const ms = +new Date - start;
    ctx.set('X-Response-Time', `${ms} ms`);
    if (config('debug') && config('debugOptions.logRequests')) {
      console.log(`[${ctx.method}] ${ctx.url} - ${ms}`);
    }
  });

  let plugins = await Tools.requireAll(
      [
        'routes/http',
        'routes/http/api',
        'routes/http/api/v1'
      ],
      /^(?!.*index)\w+\.js$/
  );
  for (let i = 0; i < plugins.length; i++) {
    app.use(plugins[i].routes());
    app.use(plugins[i].allowedMethods());
  }

  app.on('error', (err, ctx) => {
    if (ctx.status >= 500) {
      console.log('[ERR]', ctx.header.host, ctx.status, ctx.url, err.message);
    }
  });
};

Controllers.initWebsocket = server => {
  let WSInstance = WS(server);

  let handlers = Tools.requireAllSync('routes/websocket', /^(?!.*index)\w+\.js$/);

  for (let i = 0; i < handlers.length; i++) {
    if (!Array.isArray(handlers[i])) {
      handlers[i] = [ handlers[i] ];
    }
    for (let j = 0; j < handlers[i].length; j++) {
      let { command, handler } = handlers[i][j];
      WSInstance.use(command, handler);
    }
  }
};

Controllers.parseForm = ctx => {
  ctx.request.body = {};
  if (!ctx.request.is('urlencoded', 'multipart')) {
    return;
  }
  return new Promise((resolve, reject) => {
    let busboy = new Busboy({ headers: ctx.req.headers });
    let fields = {};
    busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
      console.log('File [' + fieldname + ']: filename: ' + filename + ', encoding: ' + encoding + ', mimetype: ' + mimetype);
      file.on('data', data => {
        console.log('File [' + fieldname + '] got ' + data.length + ' bytes');
      });
      file.on('end', () => {
        console.log('File [' + fieldname + '] Finished');
      });
    }); // TODO: Parse files
    busboy.on('field', (fieldname, val) => {
      let matches = fieldname.match(/(.+)\[(.*)]$/);
      if (!matches) {
        return fields[fieldname] = val;
      }
      if (!fields[matches[1]]) {
        fields[matches[1]] = [];
      }
      if (!matches[2]) {
        return fields[matches[1]].push(val);
      }
      if (!fields[matches[1]][matches[2]]) {
        fields[matches[1]][matches[2]] = [];
      }
      fields[matches[1]][matches[2]].push(val);
    });
    busboy.on('finish', () => {
      busboy = null;
      if (Object.keys(fields).length) {
        ctx.request.body = fields;
      }
      resolve(ctx.request.body);
    });
    busboy.on('error', reject);

    ctx.req.pipe(busboy);
    setTimeout(() => reject('Body parsing timeout'), 1000);
  });
};

Controllers.isAJAXRequested = ctx => {
  return ctx.headers["X-Requested-With"] === "XMLHttpRequest";
};

Controllers.success = (ctx, out) => {
  if (!out) {
    return ctx.throw(404);
  }
  ctx.body = out;
};

Controllers.fail = (ctx, out) => {
  let code = out
    ? out.status || 500
    : 500;
  return ctx.throw(code, out.message, out);
};
