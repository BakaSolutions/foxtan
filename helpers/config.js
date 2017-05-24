//const FSWatcher = require('./fs-watcher');
const Tools = require('./tools');
const FS = require('fs');

let config = new Map([
  ['server.host', 'localhost'],
  ['server.output', 'port'],
  ['server.port', 1337],
  ['server.output', '/tmp/sock']
]);

function Figurecon(key, defaults) {
  if(defaults && defaults.toString() === '[object Map]')
    return Figurecon.init(...arguments);
  return Figurecon.get(...arguments);
}

Figurecon.get = function (key, def) {
  return (typeof def === 'undefined')?
    (typeof this.config.get(key) !== 'undefined')?
      this.config.get(key):
    new Error(`Undefined config item: "${key}"!`):
  def;
};

Figurecon.init = function (file, defaults) {
  let self = this,
    exists = FS.existsSync(file);
  self.config = exists? Tools.merge(defaults, require(file)) : defaults;
  //let c = FSWatcher.createWatchedResource(file, (path) => { ... }); TODO: Real-time updates
  return self;
};

module.exports = new Figurecon(__dirname + "/../config.js", config);
//module.exports.watcher = FSWatcher;
