const path = require('path');
const fs = require('fs');
const { promisify } = require('util');

const stat = promisify(fs.stat);
const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);


const Pledge = Promise; //require('./promise'); TODO: Import from Kuri
const config = require('./config');

let FS = module.exports = {};
const ROOT = path.normalize(path.join(__dirname, '/../../'));

/**
 * Normalizes the path (removes all unnecessary "../")
 * @param {String} filePath
 * @returns {String}
 */
FS.normalize = filePath => {
  let rooted = filePath.indexOf(ROOT) === 0 || filePath.indexOf(config('tmpDir')) === 0;
  return path.normalize(rooted
    ? filePath
    : path.join(ROOT, filePath));
};

/**
 * Checks if filePath matches with the engine's directory
 * @param {String} filePath
 * @returns {boolean}
 */
FS.check = filePath => filePath.indexOf(ROOT) === 0 || filePath.indexOf(config('tmpDir')) === 0;

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
 * @returns {boolean}
 */
FS.writeFileSync = (filePath, content) => {
  filePath = FS.normalize(filePath);
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
 * @returns {boolean}
 */
FS.mkdirSync = dir => {
  if (!Array.isArray(dir)) {
    dir = [ dir ];
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
  if(!FS.check(dir)) {
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
    if(!FS.check(source)) {
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

FS.createWriteStream = filePath => {
  filePath = FS.normalize(filePath);

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

FS.writeFile = async (filePath, content) => {
  return new Pledge(async (resolve, reject) => {
    filePath = FS.normalize(filePath);
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
