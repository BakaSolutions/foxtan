const fs = require('fs');
const path = require('path');

let tools = module.exports = {};
let toString = {}.toString;

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
 * @param src
 * @param [mask]
 * @returns {Promise}
 */
tools.requireAll = async (src, mask) => {
  if (!Array.isArray(src)) {
    src = [ src ];
  }
  let plugins = [];
  src.forEach((source) => {
    let filePath = path.join(__dirname, '/../', source);
    plugins.push(new Promise((resolve, reject) => {
      fs.readdir(filePath, (err, files) => {
        if (err) {
          return reject(err);
        }
        resolve(requireAll(mask, files, filePath));
      });
    }));
  });
  return Promise.all(plugins).then((promises) => {
    return tools.flattenArray(promises.filter((plugin) => {
      return Array.isArray(plugin) && plugin.length;
    }));
  });
};

/**
 * Requires all files in a defined directory synchronously
 * @param src
 * @param [mask]
 * @returns {*}
 */
tools.requireAllSync = (src, mask) => {
  if (!Array.isArray(src)) {
    src = [ src ];
  }
  let plugins = [];
  src.forEach((source) => {
    let filePath = path.join(__dirname, '/../', source);
    let files = fs.readdirSync(filePath);
    plugins = plugins.concat(requireAll(mask, files, filePath));
  });
  return plugins;
};

/**
 * Common function for requireAll* functions
 * @param [mask]
 * @param files
 * @param {String} filePath
 * @returns {Array}
 */
function requireAll(mask, files, filePath) {
  let o = [];
  if (typeof files === 'undefined') {
    return o;
  }
  files.forEach((file) => {
    if(mask && !mask.test(file)) {
      return false;
    }
    delete require.cache[require.resolve(path.join(filePath, file))];
    try {
      o[o.length] = tools.requireWrapper(require(path.join(filePath, file)));
    } catch (e) {
      let stack = e.stack.split('\n');
      let title = stack.shift();
      console.log(`\x1b[30m${title}\x1b[0m\n${stack.join('\n')}`);
    }
  });
  return o;
}

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
