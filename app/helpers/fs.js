const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const mime = require("mime");

const stat = promisify(fs.stat);
const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const rename = promisify(fs.rename);

const Pledge = Promise; //require('./promise'); TODO: Import from Kuri
const config = require('./config');

let FS = module.exports = {};

/**
 * Normalizes the path (removes all unnecessary "../")
 * @param {String} filePath
 * @param {String} [rootType]
 * @returns {String}
 */
FS.normalize = (filePath, rootType = 'root') => {
  let rooted = FS.check(filePath);
  return path.normalize(rooted
    ? filePath
    : path.join(config('directories')[rootType], filePath));
};

/**
 * Checks if filePath matches with the engine's directory
 * @param {String} filePath
 * @returns {boolean}
 */
FS.check = filePath => {
  let filterArray = Object.values(config('directories')).filter(dir => filePath.indexOf(dir) === 0);
  return filterArray.length > 0;
};

/**
 * Read file synchronously with checking the filePath
 * @param {String} filePath
 * @param {String} [encoding]
 * @returns {*}
 */
FS.readSync = (filePath, encoding = 'utf8') => {
  filePath = FS.normalize(filePath);
  if (!FS.check(filePath)) {
    return false;
  }
  try {
    return fs.readFileSync(filePath, encoding);
  } catch (e) {
    return false;
  }
};

/**
 * Delete file synchronously with checking the filePath
 * @param {String} filePath
 * @returns {boolean}
 */
FS.unlinkSync = filePath => {
  filePath = FS.normalize(filePath);
  if (!FS.check(filePath)) {
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
 * @param {String} [rootType]
 * @returns {boolean}
 */
FS.writeFileSync = (filePath, content, rootType) => {
  filePath = FS.normalize(filePath, rootType);
  if (!FS.check(filePath)) {
    return false;
  }

  let dir = path.parse(filePath).dir + path.sep;
  if (!FS.existsSync(dir)) {
    FS.mkdirSync(dir);
  }

  fs.writeFileSync(filePath, content || '');
  return true;
};

/**
 * Check if file exists directly
 * @param {String} filePath
 * @returns {boolean}
 */
FS.existsSync = filePath => {
  filePath = FS.normalize(filePath);
  let out;
  try {
    fs.accessSync(filePath, fs.constants.R_OK | fs.constants.W_OK);
    out = true;
  } catch (e) {
    out = false;
  }
  return out;
};

/**
 * Creates new folder _recursively_
 * @param {String|Array} dir
 * @param {String} [rootType]
 * @returns {boolean}
 */
FS.mkdirSync = (dir, rootType) => {

  if (!Array.isArray(dir)) {
    dir = [ dir ];
  } else {
    dir = FS.normalize(dir, rootType);
    if (!FS.check(dir)) {
      return false;
    }
  }

  if (FS.existsSync(dir[0]) || dir.length < 1) {
    return true;
  }

  try {
    fs.mkdirSync(dir[dir.length - 1]);
  } catch (e) {
    let parent = dir[dir.length - 1].replace(/\/$/, '').split('/');
    parent.pop();
    parent = parent.join('/');
    dir[dir.length] = parent;
    return FS.mkdirSync(dir);
  }
  dir.pop();
  if (dir.length < 1) {
    return true;
  }
  return FS.mkdirSync(dir);
};

FS.readdirSync = (dir, recursive = true) => {
  dir = FS.normalize(dir);
  if (!FS.check(dir)) {
    return false;
  }

  let results = [];
  let list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    let stat = fs.statSync(file);
    if (recursive && stat && stat.isDirectory()) {
      results = results.concat(FS.readdirSync(file, true));
    } else {
      results.push(file);
    }
  });
  return results;
};

FS.copyFile = async (source, target) => {
  return new Pledge((resolve, reject) => {
    source = FS.normalize(source);
    if (!FS.check(source)) {
      return reject('Forbidden');
    }
    let rd = fs.createReadStream(source);
    rd.on('error', rejectCleanup);
    let wr = fs.createWriteStream(target);
    wr.on('error', rejectCleanup);
    function rejectCleanup(err) {
      rd.destroy();
      wr.end();
      reject(err);
    }
    wr.on('finish', resolve);
    rd.pipe(wr);
  });
};

FS.createWriteStream = (filePath, rootType) => {
  filePath = FS.normalize(filePath, rootType);

  if (!FS.check(filePath)) {
    return false;
  }

  let dir = path.parse(filePath).dir + path.sep;
  if (!FS.existsSync(dir)) {
    FS.mkdirSync(dir);
  }

  return fs.createWriteStream(filePath);
};


FS.readdir = async (dir, recursive = true) => {
  return new Pledge(async (resolve, reject) => {
    dir = FS.normalize(dir);
    if (!FS.check(dir)) {
      return reject('Forbidden');
    }
    let list = await readdir(dir);
    let files = await Promise.all(list.map(async subdir => {
      let res = path.resolve(dir, subdir);
      return ((await stat(res)).isDirectory() && recursive)
        ? FS.readdir(res)
        : res;
    }));
    let out = files.reduce((a, f) => a.concat(f), []);
    resolve(out);
  });
};


FS.readFile = async (filePath, encoding = 'utf8') => {
  return new Pledge(async (resolve, reject) => {
    filePath = FS.normalize(filePath);
    if (!FS.check(filePath)) {
      return reject('Forbidden');
    }
    let out = await readFile(filePath, encoding);
    resolve(out);
  });
};

FS.writeFile = async (filePath, content, rootType) => {
  return new Pledge(async (resolve, reject) => {
    filePath = FS.normalize(filePath, rootType);
    if (!FS.check(filePath)) {
      return reject('Forbidden');
    }

    let dir = path.parse(filePath).dir + path.sep;
    if (!FS.existsSync(dir)) {
      FS.mkdirSync(dir);
    }

    let out = await writeFile(filePath, content || '');
    resolve(out);
  });
};


FS.renameFile = async (old, mew, rootType) => {
  return new Pledge(async (resolve, reject) => {
    old = FS.normalize(old);
    if (!FS.check(old)) {
      return reject('Forbidden');
    }

    mew = FS.normalize(mew, rootType);
    if (!FS.check(mew)) {
      return reject('Forbidden');
    }

    let dir = path.parse(mew).dir + path.sep;
    if (!FS.existsSync(dir)) {
      FS.mkdirSync(dir);
    }

    let out = await rename(old, mew).catch(async () => await FS.copyFile(old, mew));

    resolve(out);
  });
};

FS.getMime = async filePath => await mime.getType(filePath);

FS.getExtension = async filePath => await mime.getExtension(filePath);
