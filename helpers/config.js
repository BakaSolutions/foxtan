//const FSWatcher = require('./fs-watcher');
const Tools = require('./tools');
const FS = require('fs');

let config = new Map([
  ['db', 'mysql'], // 'mysql' | 'sqlite' | 'postgres' | 'mssql'
  ['db.mysql.username', 'root'],
  ['db.mysql.password', ''],
  ['db.mysql.hostname', 'localhost'],
  ['db.mysql.database', 'sobaka'],

  ['fs.existscache', true],
  ['fs.existscache.interval', 1000 * 60 * 5], // 5 min
  ['fs.cache.json', true],

  ['log.db.noerr', /ER_(NO_SUCH_TABLE|DUP_ENTRY)/],

  ['markup.patterns',
    [
      [/h3sot/gi, '<b>H<sub>3</sub>S&Ouml;T</b>'],
      [/\(c\)/gi, '&copy;'],
      [/\(r\)/gi, '&reg;'],
      [/\(tm\)/gi, '&trade;'],
      [/&quot;(.+?)&quot;/g, '«$1»']
    ]
  ],
  ['markup.tags',
    [
      ['b'], ['i'], ['u'], ['s'], ['sup'], ['sub'],
      ['\\*\\*\\*', ['<s>','</s>']],
      ['\\*\\*', ['<b>','</b>']],
      ['\\*', ['<i>','</i>']],
      ['___', ['<u>','</u>']],
      ['__', ['<b>','</b>']],
      ['_', ['<i>','</i>']],
      ['%%', ['<span class="spoiler">', '</span>']],
      [['\\[spoiler]','\\[\\/spoiler]'], ['<span class="spoiler">', '</span>']],
    ]
  ],

  ['server.host', 'localhost'],
  ['server.output', 'port'],
  ['server.port', 1337],
  ['server.output', '/tmp/sock']
]);

/**
 * Figurecon -- small module for a configuration. It gets from a file `/config.js` or a map `config` if variable doesn't exists in a config file.
 * @param key
 * @param defaults
 * @constructor
 */
function Figurecon(key, defaults) {
  if(defaults && Tools.isMap(defaults)) {
    return Figurecon.init(...arguments);
  }
  return Figurecon.get(...arguments);
}

/**
 * Gets a variable or throw an error if variable doesn't exist anywhere
 * @param key
 * @param def
 * @returns {*}
 * @throws {Error}
 */
Figurecon.get = function (key, def) {
  if (typeof def === 'undefined') {
    if (typeof this.config.get(key) !== 'undefined') {
      return this.config.get(key)
    }
    return new Error('Undefined config item: "' + key + '"!')
  }
  return def;
};

/**
 * Read a config file and merges config map with it
 * @param file
 * @param defaults
 * @returns {Figurecon}
 */
Figurecon.init = function (file, defaults) {
  let self = this,
    exists = FS.existsSync(file);
  self.config = exists? Tools.merge(defaults, require(file)) : defaults;
  //let c = FSWatcher.createWatchedResource(file, (path) => { ... }); TODO: Real-time updates
  return self;
};

module.exports = new Figurecon(__dirname + "/../config.js", config);
//module.exports.watcher = FSWatcher;
