const path = require('path'),
  fs = require('fs'),

  config = require('./config');

let FS = module.exports = {};
const ROOT = path.join(__dirname, '/../public/');

function onConfigChange(key, oldValue, newValue) {
  if (!newValue.enabled) {
    clearInterval(FS.cacheInterval);
    return FS.cacheInterval = null;
  }
  FS.cache = new Map();
  FS.cacheInterval = setInterval(function () {
    FS.cache.clear();
  }, newValue.interval);
}

config.on('fs.cache.exists', onConfigChange);
onConfigChange(null, null, config('fs.cache.exists'));

/**
 * Normalizes the path (removes all unnecessary "../")
 * @param {String} filePath
 * @returns {String}
 */
FS.normalize = function(filePath) {
  if (this.check(filePath)) {
    return filePath;
  }
  return path.normalize(path.join(ROOT, filePath));
};

/**
 * Checks if filePath matches with the engine's directory
 * @param {String} filePath
 * @returns {boolean}
 */
FS.check = function (filePath) {
  return filePath.indexOf(path.normalize(ROOT)) === 0;
};

/**
 * Read file synchronously with checking the filePath
 * @param {String} filePath
 * @returns {*}
 */
FS.readSync = function (filePath) {
  filePath = FS.normalize(filePath);
  if (!this.check(filePath)) {
    return false;
  }
  return fs.readFileSync(filePath, 'utf8');
};

/**
 * Delete file synchronously with checking the filePath
 * @param {String} filePath
 * @returns {boolean}
 */
FS.unlinkSync = function (filePath) {
  filePath = FS.normalize(filePath);
  if (!this.check(filePath)) {
    return false;
  }

  try {
    return fs.unlinkSync(filePath);
  } catch (e) {
    return false;
  }
};

/**
 * Write content into file synchronously with checking the filePath
 * @param {String} filePath
 * @param {String, Buffer} content
 * @returns {boolean}
 */
FS.writeSync = function (filePath, content) {
  filePath = FS.normalize(filePath);
  content = content || '';
  if (!this.check(filePath)) {
    return false;
  }
  let dir = path.parse(filePath).dir + '/';
  if (!this.existsSync(dir, 1)) {
    this.mkdirSync(dir);
  }
  fs.writeFileSync(filePath, content);
  return true;
};

/**
 * Check if file exists directly or from cache
 * @param {String} filePath
 * @param {Boolean} [cache]
 * @returns {boolean}
 */
FS.existsSync = function (filePath, cache) {
  filePath = FS.normalize(filePath);
  let key = filePath, out;

  cache = cache && config('fs.existscache');
  if(cache && this.cache.has(key)) {
    return this.cache.get(key);
  }
  try {
    fs.accessSync(filePath, fs.constants.R_OK | fs.constants.W_OK);
    out = true;
  } catch (e) {
    out = false;
  }

  if (cache) {
    this.cache.set(key, out);
  }
  return out;
};

/**
 * Creates new folder _recursively_
 * @param {String|Array} dir
 * @returns {boolean}
 */
FS.mkdirSync = function (dir) {
  if (!Array.isArray(dir)) {
    dir = [ dir ];
  }
  if (this.existsSync(dir[0]) || dir.length < 1) {
    return true;
  }

  try {
    fs.mkdirSync(dir[dir.length - 1]);
  } catch (e) {
    let parent = dir[dir.length - 1].replace(/\/$/, '').split('/');
    parent.pop();
    parent = parent.join('/');
    dir[dir.length] = parent;
    return this.mkdirSync(dir);
  }
  dir.pop();
  if (dir.length < 1) {
    return true;
  }
  return this.mkdirSync(dir);
};
