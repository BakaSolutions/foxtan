const fs = require('fs');
const path = require('path');

let tools = module.exports = {},
  toString = Object.prototype.toString;

/**
 * Requires all files in a defined directory
 * @param src
 * @param [mask]
 * @returns {Promise}
 */
tools.requireAll = async function (src, mask) {
  let filePath = path.join(__dirname + '/../', src) + '/';
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
  let filePath = path.join(__dirname + '/../', src) + '/',
      files = fs.readdirSync(filePath);
  return requireAll(mask, files, filePath);
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
    delete require.cache[require.resolve(filePath + file)];
    o[o.length] = tools.requireWrapper(require(filePath + file));
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
  return !isNaN(parseFloat(n)) && isFinite(n);
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
  if(tools.isMap(target)) {
    //let sources = [].slice.call(arguments, 1);
    let out = [...target];
    theArgs.forEach(function(arg) {
      out.push(...arg);
    });
    return new Map(out);
  }
  let sources = [].slice.call(arguments, 1);
  sources.forEach(function (source) {
    for (let prop in source) {
      if(source.hasOwnProperty(prop)) {
        target[prop] = (typeof source[prop] === 'object')? tools.merge(target[prop], source[prop]) : source[prop];
      }
    }
  });
  return target;
};
