const path = require('path');
const fs = require('fs');
const fsPromises = require('fs').promises;
const mime = require("mime");

const { access, readdir, copyFile, readFile, writeFile, mkdir, rename, unlink } = fsPromises;

const config = require('./config.js');

let FS = module.exports = {};

FS.ROOT = config('directories')['root'];

class FSError extends Error {
  constructor(error) {
    super(error);
    Error.captureStackTrace(this, this.constructor);
    this.name = "FSError";
  }
}
class FSAccessError extends FSError {
  constructor(error) {
    super(error);
    this.name = "FSAccessError";
  }
}

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
FS.check = filePath => Object.values(config('directories')).some(dir => filePath.startsWith(dir));

/**
 * Delete file asynchronously with checking the filePath
 * @param {String} filePath
 * @returns {boolean}
 */
FS.unlink = async filePath => {
  try {
    filePath = FS.normalize(filePath);
    if (!FS.check(filePath)) {
      return false;
    }

    await unlink(filePath);
    return true;
  } catch {
    return false;
  }
};


/**
 * Check if file exists directly
 * @param {String} filePath
 * @returns {boolean}
 */
FS.exists = async filePath => {
  let out;
  try {
    filePath = FS.normalize(filePath);
    await access(filePath, fs.constants.R_OK | fs.constants.W_OK);
    out = true;
  } catch {
    out = false;
  }
  return out;
};

/**
 * Creates new folder _recursively_
 * @param {String} dir
 * @param {String} [rootType]
 * @param {boolean} [recursive]
 * @returns {boolean|*}
 */
FS.mkdir = async (dir, rootType, recursive = true) => {
  try {
    dir = FS.normalize(dir, rootType);
    if (!FS.check(dir)) {
      return throwFSError(new FSAccessError('Forbidden'));
    }

    if (await FS.exists(dir)) {
      return true;
    }

    await mkdir(dir, { recursive });
    return true;
  } catch (e) {
    return throwFSError(e);
  }
};

FS.copyFile = async (source, target, flags) => {
  try {
    source = FS.normalize(source);
    target = FS.normalize(target);

    if (!FS.check(source) || !FS.check(target)) {
      return throwFSError(new FSAccessError('Forbidden'));
    }

    return copyFile(source, target, flags);
  } catch (e) {
    return throwFSError(e);
  }
};

FS.createWriteStream = (filePath) => {
  filePath = FS.normalize(filePath);
  if (!FS.check(filePath)) {
    return throwFSError(new FSAccessError('Forbidden'));
  }
  return fs.createWriteStream(filePath);
};

/**
 *
 * @param directory
 * @param recursive
 * @param onlyFiles
 * @returns {Array|*}
 */
FS.readdir = async (directory, {recursive = true, onlyFiles = true} = {}) => {
  try {
    directory = FS.normalize(directory);
    if (!FS.check(directory)) {
      return throwFSError(new FSAccessError('Forbidden'));
    }

    let dir = await readdir(directory, {withFileTypes: true});
    let promises = dir.map(async dirent => {
      dirent.name = path.resolve(directory, dirent.name);
      if (recursive && dirent.isDirectory()) {
        return FS.readdir(dirent.name, { recursive, onlyFiles });
      }
      return dirent;
    });
    let list = await Promise.all(promises);
    if (recursive) {
      list = list.flat(Infinity);
    }
    if (onlyFiles) {
      list = list.filter(dirent => dirent.isFile());
    }
    return list;
  } catch (e) {
    return throwFSError(e);
  }
};

FS.readFile = async (filePath, encoding = 'utf8') => {
  try {
    filePath = FS.normalize(filePath);
    if (!FS.check(filePath)) {
      return throwFSError(new FSAccessError('Forbidden'));
    }
    return await readFile(filePath, encoding);
  } catch (e) {
    return throwFSError(e);
  }
};

FS.writeFile = async (filePath, content, rootType) => {
  try {
    await createDirectoryIfNotExists(filePath, rootType);
    return await writeFile(filePath, content || '');
  } catch (e) {
    return throwFSError(e);
  }
};


FS.renameFile = async (old, mew, rootType) => {
  try {
    old = FS.normalize(old);
    if (!FS.check(old)) {
      return throwFSError(new FSAccessError('Forbidden'));
    }

    mew = await createDirectoryIfNotExists(mew, rootType);

    return await rename(old, mew).catch(async () => await FS.copyFile(old, mew));
  } catch (e) {
    return throwFSError(e);
  }
};

FS.getMime = async filePath => await mime.getType(filePath);

FS.getExtension = async filePath => await mime.getExtension(filePath);

async function createDirectoryIfNotExists(directory, rootType) {
  directory = FS.normalize(directory, rootType);
  if (!FS.check(directory)) {
    return throwFSError(new FSAccessError('Forbidden'));
  }

  let dir = path.parse(directory).dir + path.sep;
  if (!(await FS.exists(dir))) {
    await FS.mkdir(dir);
  }
  return directory;
}

function throwFSError(e) {
  //if (e instanceof FSError) {
  //  TODO: Wrap FS errors
  //}
  //} else {
    throw e;
  //}
}
