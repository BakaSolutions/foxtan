const fs = require('fs');
const path = require('path');
const merge = require('merge');

let tools = module.exports = {},
  toString = Object.prototype.toString;

Object.defineProperty(tools, 'consts', {
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
};

/**
 * Requires all files in a defined directory
 * @param src
 * @param [mask]
 * @returns {Promise}
 */
tools.requireAll = async function (src, mask) {
  let filePath = path.join(__dirname, '/../', src);
  return new Promise(function(resolve, reject) {
    fs.readdir(filePath, function(err, files) {
      resolve(requireAll(mask, files, filePath));
    });
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
    Array.prototype.push.apply(plugins, requireAll(mask, files, filePath));
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
  files.forEach(function (file) {
    if(mask && !mask.test(file)) {
      return false;
    }
    delete require.cache[require.resolve(path.join(filePath, file))];
    o[o.length] = tools.requireWrapper(require(path.join(filePath, file)));
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
  //return !isNaN(parseFloat(n)) && isFinite(n);
};

/**
 * "Flattens" an array (moves all elements to the root of an array)
 * @param {Array} obj
 * @returns {boolean}
 */
/*tools.flattenArray = function(a) {
  let out = [];
  for(let i = 0; i < a.length; i++) {
    if(Array.isArray(a[i])) {
      out = out.concat(this.flattenArray(a[i]));
    } else {
      out.push(a[i]);
    }
  }
  return out;
};*/

/**
 * Merges two or more objects into one
 * @param {Object|Map} target
 * @param {Object|Map} theArgs
 * @return {Object|Map} target
 */
tools.merge = function (target, ...theArgs) {
  target = tools.clone(target);
  if(tools.isMap(target)) {
    let out = [...target];
    theArgs.forEach(function(arg) {
      out.push(...arg);
    });
    return new Map(out);
  }
  let sources = Array.prototype.slice.call(arguments, 1);
  sources.forEach(function (source) {
    for (let prop in source) {
      if(source.hasOwnProperty(prop)) {
        if (typeof target === 'undefined') {
          target = {};
        }
        target[prop] = (typeof source[prop] === 'object')
            ? tools.merge(target[prop], source[prop])
            : source[prop];
      }
    }
  });
  return target;
};

tools.clone = function (value) {
  if (Array.isArray(value)) {
    return value.slice(0).map(val => tools.clone(val));
  } else if (tools.isObject(value)) {
    return merge.recursive(true, value);
  }
  return value;
};

tools.sortObject = function(object, order) {
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
