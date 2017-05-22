const fs = require('fs');
const path = require('path');

var tools = module.exports = {},
  toString = Object.prototype.toString;

tools.requireAll = async function(src, mask) {
  var filePath = path.join(__dirname + '/../', src) + '/',
    files = await fs.readdir(filePath);
  return requireAll(mask, files, filePath);
};
tools.requireAllSync = function(src, mask) {
  var filePath = path.join(__dirname + '/../', src) + '/',
      files = fs.readdirSync(filePath);
  return requireAll( mask, files, filePath);
};
function requireAll( mask, files, filePath) {
  var o = [];
  files.forEach(function(file){
    if(mask && !mask.test(file))
      return false;
    delete require.cache[require.resolve(filePath + file)];
    o[o.length] = tools.requireWrapper(require(filePath + file));
  });
  return o;
}
tools.requireWrapper = function (m) {
  return (m && m.default) || m;
};
tools.isObject = function(obj) {
  return toString.call(obj) === '[object Object]';
};
/*tools.flattenArray = function(a) {
  var out = [];
  for(var i = 0; i < a.length; i++) {
    if(Array.isArray(a[i]))
      out = out.concat(this.flattenArray(a[i]));
    else
      out.push(a[i]);
  }
  return out;
};*/
tools.merge = function (target) {
  var sources = [].slice.call(arguments, 1);
  sources.forEach(function (source) {
    for (var prop in source) {
      target[prop] = source[prop];
    }
  });
  return target;
};
