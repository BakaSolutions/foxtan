const mimeType = require('mime-types');

const FS = require('./FS.js');

let Tools = module.exports = {};

Tools.ROOT = new RegExp(FS.ROOT.replace(/\\/g, '\\\\'), 'g');

Tools.moduleAvailable = name => {
  try {
    require.resolve(name);
    return true;
  } catch (e) {
    //
  }
  return false;
};

Tools.arrayify = input => {
  if (!input) {
    console.log('Tools.arrayify function caught an empty variable. This will emit error in a future.');
    debugger;
    return input;
  }
  if (!(input instanceof Array)) {
    input = [ input ];
  }
  return input;
};

Tools.sequence = async (func, items) => {
  let out = [];
  for (const promise of items) {
    out.push(await func(promise));
  }
  return out;
};

Tools.parallel = async (func, items, ...args) => {
  items = Tools.arrayify(items);
  let promises = items.map((item => func(item, ...args)));
  return Promise.all(promises);
};

Tools.readdirRecursive = async (directories, { mask, isFallible }) => {
  directories = Tools.arrayify(directories);
  let out = await Tools.parallel(async directory => {
    try {
      return await FS.readdir(directory, { onlyFiles: true });
    } catch (e) {
      if (!isFallible) {
        throw e;
      }
    }
  }, directories);
  out = out.flat();
  if (!mask) {
    return out;
  }
  return out.filter(file => file && file.isFile() && mask.test(file.name));
};

Tools.requireRecursive = async (directories, { mask, isFallible }) => {
  let out = await Tools.readdirRecursive(directories, { mask, isFallible });
  return out.map(({ name }) => {
    delete require.cache[require.resolve(name)];
    try {
       return require(name);
    } catch (e) {
      console.log(Tools.returnPrettyError(e));
    }
  })
};

Tools.returnPrettyError = e => {
  let stack = e.stack ?? e.description;
  stack = stack
    .replace(Tools.ROOT, '')
    .replace(/\\/g, '/')
    .split('\n');
  let title = stack.shift() ?? '';
  return `[FOXTAN] \x1b[1m${title}\x1b[0m\n${stack.join('\n')}`;
};

/**
 * Check if a variable is an object but not a map
 * @param obj
 * @param {boolean} [nullable]
 * @returns {boolean}
 */
Tools.isObject = (obj, nullable = true) => {
  if (!nullable && obj === null) {
    return false;
  }
  return {}.toString.call(obj) === '[object Object]';
};

/**
 * Check if a variable is a number
 * @param n
 * @returns {boolean}
 */
Tools.isNumber = n => !isNaN(parseFloat(n)) && isFinite(n);

Tools.sortObject = (object, order = 'asc') => {
  let arr = [];
  for (let key in object) {
    arr.push(key);
  }
  arr.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
  if (order !== 'asc') {
    arr.reverse();
  }
  let out = {};
  for (let i = 0; i < arr.length; i++ ) {
    out[ arr[i] ] = object[ arr[i] ];
  }
  return out;
};

/**
 * @param {String} string
 * @returns {String}
 */
Tools.capitalize = string => string.toLowerCase().replace(/(?:^|\s)\S/g, a => a.toUpperCase());

Tools.random = (type = 10, n) => {
  let max = 12; // 12 is the min safe number Math.random() can generate without it starting to pad the end with zeros.

  if (n > max) {
    return Tools.random(type, max) + Tools.random(type, n - max);
  }

  max        = Math.pow(type, n + 1);
  let min    = max/type; // Math.pow(10, n) basically
  let number = Math.floor(Math.random() * (max - min + 1)) + min;
  return ("" + number.toString(type)).substring(1);
};

Tools.randomInt = length => Tools.random(10, length);

Tools.randomHex = length => Tools.random(16, length);

Tools.randomSessionString = () => Math.random().toString(36).slice(-8); // 8 lowercase chars

Tools.startWith = (string, char) => (''+string).startsWith(char) ? string : char + string;

Tools.endWith = (string, char) => (''+string).endsWith(char) ? string : string + char;

Tools.wrapWith = (string, charStart, charEnd = charStart) => {
  return Tools.endWith(Tools.startWith(string, charEnd), charStart);
};

Tools.unique = arr => [ ...new Set(arr) ];

Tools.mimeToFormat = mime => {
  let extension = mimeType.extension(mime);
  if (extension) {
    if (extension === 'jpeg') {
      return 'jpg'; // TODO: detect via `file-type`?
    }
    return extension;
  }
  return mime.split('/')[1];
}
