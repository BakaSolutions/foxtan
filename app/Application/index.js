const Foxtan = require('./Foxtan.js');

let foxtan = new Foxtan();

(async () => {
  try {
    await foxtan.init();
    await foxtan.launchServer();
  } catch (e) {
    foxtan.logError(e);
    process.exit(1);
  }
})();
