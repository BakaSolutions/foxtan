const config = require('../../../helpers/config');
const Tools = require('../../../helpers/tools');

let middleware = app => {
  if (config('server.enableStatic')) {
    if (Tools.moduleAvailable('koa-static')) {
      const Static = require('koa-static');
      app.use(Static(__dirname + '/../../../../public'));
    } else {
      console.warn(
          '\x1b[35mЧтобы использовать Foxtan без Nginx, установите модуль koa-static:\x1b[0m\n\n' +
          '\x1b[36m           npm i koa-static \x1b[0m или \x1b[36m yarn add koa-static\x1b[0m\n\n'
      );
    }
  }
};

module.exports = {
  middleware
};
