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


tools.createBitMask = function (bits, params) {
  let out = 0;
  for (let param in params) {
    if (params[param]) {
      out += bits[param];
    }
  }
  return out.toString(2);
};

tools.checkBitMask = function (bit, mask) {
  return !!(bit & mask);
};*/

tools.moduleAvailable = function (name) {
  try {
    require.resolve(name);
    return true;
  } catch(e) {

  }
  return false;
};

/**
 * Requires all files in a defined directory
 * @param src
 * @param [mask]
 * @returns {Promise}
 */
tools.requireAll = async function (src, mask) {
  if (!Array.isArray(src)) {
    src = [ src ];
  }
  let plugins = [];
  src.forEach((source) => {
    let filePath = path.join(__dirname, '/../', source);
    plugins.push(new Promise(function(resolve, reject) {
      fs.readdir(filePath, function(err, files) {
        if (err) reject(err);
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
tools.requireAllSync = function (src, mask) {
  if (!Array.isArray(src)) {
    src = [ src ];
  }
  let plugins = [];
  src.forEach(function (source) {
    let filePath = path.join(__dirname, '/../', source);
    let files = fs.readdirSync(filePath);
    [].push.apply(plugins, requireAll(mask, files, filePath));
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
function requireAll(mask, files, filePath) { // TODO: Do it recursively
  let o = [];
  if (typeof files === 'undefined') {
    return o;
  }
  files.forEach(function (file) {
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
tools.requireWrapper = function (m) {
  return (m && m.default) || m;
};

/**
 * Check if a variable is an object but not a mop
 * @param obj
 * @returns {boolean}
 */
tools.isObject = function(obj) {
  return toString.call(obj) === '[object Object]';
};

/**
 * Check if a variable is a map
 * @param obj
 * @returns {boolean}
 */
tools.isMap = function(obj) {
  return toString.call(obj) === '[object Map]';
};

/**
 * Check if a variable is a number
 * @param n
 * @returns {boolean}
 */
tools.isNumber = function(n) {
  return +n === n;
  // NOTE: Such an interesting hack! It's fair to use:
  // return !isNaN(parseFloat(n)) && isFinite(n);
};

tools.sortObject = function(object, order = 'asc') {
  let arr = [];
  let out = {};
  for (let key in object) {
    arr.push(key);
  }
  arr.sort(function(a, b) {
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
tools.flattenArray = function(a) {
  let out = [];
  for(let i = 0; i < a.length; i++) {
    if(Array.isArray(a[i])) {
      out = out.concat(this.flattenArray(a[i]));
    } else {
      out.push(a[i]);
    }
  }
  return out;
};
