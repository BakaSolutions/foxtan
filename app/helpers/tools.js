const path = require('path');

const FS = require('./fs');

let tools = module.exports = {};
let toString = {}.toString;

tools.filePaths = Symbol('_filePaths');
tools.fileNames = Symbol('_fileNames');

/*Object.defineProperty(tools, 'consts', {
  value: {},
  writable: false,
  enumerable: false,
  configurable: false
});


tools.createBitMask = (bits, params) => {
  let out = 0;
  for (let param in params) {
    if (params[param]) {
      out += bits[param];
    }
  }
  return out.toString(2);
};

tools.checkBitMask = (bit, mask) => {
  return !!(bit & mask);
};*/

tools.moduleAvailable = name => {
  try {
    require.resolve(name);
    return true;
  } catch(e) {
    //
  }
  return false;
};

/**
 * Requires all files in a defined directory
 * @param sources
 * @param [mask]
 * @returns {Promise}
 */
tools.requireAll = async (sources, mask) => {
  let {filePaths, fileNames} = await tools.readAll(sources, mask, -1);
  let out = _requireAll(filePaths);
  out[tools.filePaths] = filePaths;
  out[tools.fileNames] = fileNames;
  return out;
};

/**
 * Common function for requireAll* functions
 * @param files
 * @returns {Array}
 */
function _requireAll(files) {
  let o = [];
  if (typeof files === 'undefined') {
    return o;
  }
  files.forEach(file => {
    delete require.cache[require.resolve(file)];
    try {
      o[o.length] = tools.requireWrapper(require(file));
    } catch (e) {
      let stack = e.stack.split('\n');
      let title = stack.shift();
      console.log(`\x1b[30m${title}\x1b[0m\n${stack.join('\n')}`);
    }
  });
  return o;
}

tools.readAll = (sources, mask, fullPath = true) => {
  if (!Array.isArray(sources)) {
    sources = [ sources ];
  }
  let out = [];
  sources.forEach(async source => {
    out.push(new Promise(async resolve => {
      let dir = path.normalize(path.join(__dirname, '/../', source));
      let filePaths = (await FS.readdir(dir, true)).filter(filePath => mask && mask.test(filePath.replace(dir, '')) || !mask);
      let fileNames = filePaths.map(filePath => filePath.replace(dir, ''));
      resolve({filePaths, fileNames});
    }));
  });
  return Promise.all(out).then(promises => {
    switch (fullPath) {
      case 1:
      case true:
        return promises.reduce((prev, curr) => prev.concat(curr.filePaths), []);
      case 0:
      case false:
        return promises.reduce((prev, curr) => prev.concat(curr.fileNames), []);
      default:
        return {
          filePaths: promises.reduce((prev, curr) => prev.concat(curr.filePaths), []),
          fileNames: promises.reduce((prev, curr) => prev.concat(curr.fileNames), [])
        }
    }
  });
};

/**
 * Wraps file into a pluggable module
 * @param m
 * @returns {*|default}
 */
tools.requireWrapper = m => (m && m.default) || m;

/**
 * Check if a variable is an object but not a map
 * @param obj
 * @param {boolean} [nullable]
 * @returns {boolean}
 */
tools.isObject = (obj, nullable = true) => {
  if (!nullable && obj === null) {
    return false;
  }
  return toString.call(obj) === '[object Object]';
};

/**
 * Check if a variable is a map
 * @param obj
 * @returns {boolean}
 */
tools.isMap = obj => toString.call(obj) === '[object Map]';

/**
 * Check if a variable is a number
 * @param n
 * @returns {boolean}
 */
tools.isNumber = n => +n === n;
  //!isNaN(parseFloat(n)) && isFinite(n);

tools.sortObject = (object, order = 'asc') => {
  let arr = [];
  let out = {};
  for (let key in object) {
    arr.push(key);
  }
  arr.sort((a, b) => {
    return a.toLowerCase().localeCompare(b.toLowerCase());
  });
  if (order === 'desc') {
    arr.reverse();
  }
  for (let i = 0; i < arr.length; i++ ) {
    out[ arr[i] ] = object[ arr[i] ];
  }
  return out;
};

/**
 * "Flattens" an array (moves all elements to the root of an array)
 * @param {Array} a
 * @returns {Array}
 */
tools.flattenArray = a => {
  return a.reduce((result, current) => {
    if (Array.isArray(current)) {
      current = tools.flattenArray(current);
    }
    return result.concat(current);
  }, []);
};

tools.capitalize = string => string.toLowerCase().replace(/(?:^|\s)\S/g, a => a.toUpperCase());

tools.random = (type = 10, n) => {
  let max = 12; // 12 is the min safe number Math.random() can generate without it starting to pad the end with zeros.

  if (n > max) {
    return tools.random(type, max) + tools.random(type, n - max);
  }

  max        = Math.pow(type, n + 1);
  let min    = max/type; // Math.pow(10, n) basically
  let number = Math.floor(Math.random() * (max - min + 1)) + min;
  return ("" + number.toString(type)).substring(1);
};

tools.randomInt = length => tools.random(10, length);
tools.randomHex = length => tools.random(16, length);
