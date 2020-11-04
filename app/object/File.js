const AppObject = require('../core/AppObject.js');

class File extends AppObject {

  constructor() {
    super();
    super._init('hash');
    super._init('mime');
    super._init('title');
    super._init('width', this.setResolution);
    super._init('height', this.setResolution);
    super._init('thumbWidth', this.setResolution);
    super._init('thumbHeight', this.setResolution);
    super._init('modifiers', null, []);
    super._lock();
  }

  setResolution(resolution) {
    if (resolution === 0) {
      throw new Error('Width or height should be not equal zero');
    }
    return +resolution || null;
  }

}

module.exports = File;
