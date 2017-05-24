const EventEmitter = require('events').EventEmitter;
const FS = require('fs');

module.exports = class FSWatcher extends EventEmitter {
  static createWatchedResource(path, synchronous, asynchronous, logger) {
    if (!FS.existsSync(path))
      return;
    logger = (typeof logger === 'object')? logger : console;
    if (typeof asynchronous === 'function') {
      (new FSWatcher(path)).on('change', async function() {
        try {
          let exists = FS.existsSync(path);
          if (exists)
            await asynchronous(path);
        } catch (err) {
          logger.error(err.stack || err);
        }
      });
    }
    return synchronous(path);
  }

  constructor(fileName) {
    super();
    this.fileName = fileName;
    this.resetWatcher();
  }

  resetWatcher() {
    if (this.watcher) {
      this.watcher.removeAllListeners('change');
      this.watcher.close();
    }
    let exists = FS.existsSync(this.fileName);
    if (!exists)
      return;
    this.watcher = FS.watch(this.fileName);
    this.watcher.on('change', (type, fileName) => {
      if ('rename' === type) {
        if (this.fileName.split('/').pop() !== fileName)
          return;
        this.resetWatcher();
      } else if ('change' === type)
        this.emit('change');
    });
  }
};
