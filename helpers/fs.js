const path = require('path'),
  fs = require('fs'),

  config = require('./config');

let FS = module.exports = {};
const ROOT = path.join(__dirname, '/../public/');

FS.cache = new Map();
FS.cacheInterval = setInterval(function () {
  FS.cache.clear();
}, config('fs.cache.interval'));

FS.normalize = function(filePath) {
  if (this.check(filePath))
    return filePath;
  return path.normalize(path.join(ROOT, filePath));
};

FS.check = function (filePath) {
  return filePath.indexOf(path.normalize(ROOT)) === 0;
};

FS.readSync = function (filePath) {
  filePath = FS.normalize(filePath);
  if (!this.check(filePath))
    return false;
  return fs.readFileSync(filePath, 'utf8');
};

FS.unlinkSync = function (filePath) {
  filePath = FS.normalize(filePath);
  if (!this.check(filePath))
    return false;
  return fs.unlinkSync(filePath);
};

FS.writeSync = function (filePath, content) {
  filePath = FS.normalize(filePath);
  content = content || '';
  if (!this.check(filePath))
    return false;
  let dir = path.parse(filePath).dir + '/';
  if (!this.existsSync(dir, 1))
    this.mkdirSync(dir);
  fs.writeFileSync(filePath, content);
  return true;
};

FS.existsSync = function (filePath, cache) {
  filePath = FS.normalize(filePath);
  let key = filePath, out;
  cache = cache && config('fs.cache');
  if(cache && this.cache.has(key))
    return this.cache.get(key);
  try {
    fs.accessSync(filePath, fs.constants.R_OK | fs.constants.W_OK);
    out = true;
  } catch (e) {
    out = false;
  }
  if (cache) this.cache.set(key, out);
  return out;
};

FS.mkdirSync = function (dir) {
  if (!Array.isArray(dir))
    dir = [ dir ];
  if (this.existsSync(dir[0]) || dir.length < 1)
    return true;
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
  if (dir.length < 1)
    return true;
  return this.mkdirSync(dir);
};

/*let start = +new Date();
for (let i = 0; i < 1000000; i++) {
  FS.existsSync('test/res/1.json');
}
console.log(+new Date() - start);

start = +new Date();
for (let i = 0; i < 1000000; i++) {
  FS.existsSync('test/res/1.json', 1);
}
console.log(+new Date() - start);*/
