const FileFromPath = require('./index.js');

module.exports = class Audio extends FileFromPath {
  constructor(args) {
    super(args);
  }
  async check() {
    await super.check();
  }
};
