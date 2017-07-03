const fs = require('fs');
const path = require('path');

let tools = module.exports = {},
  toString = Object.prototype.toString;

tools.requireAll = async function (src, mask)
{
  let filePath = path.join(__dirname + '/../', src) + '/',
    files = await fs.readdir(filePath);
  return requireAll(mask, files, filePath);
};

tools.requireAllSync = function (src, mask)
{
  let filePath = path.join(__dirname + '/../', src) + '/',
      files = fs.readdirSync(filePath);
  return requireAll(mask, files, filePath);
};
function requireAll(mask, files, filePath)
{
  let o = [];
  files.forEach(function (file)
  {
    if(mask && !mask.test(file))
    {
      return false;
    }
    delete require.cache[require.resolve(filePath + file)];
    o[o.length] = tools.requireWrapper(require(filePath + file));
  });
  return o;
}
tools.requireWrapper = function (m)
{
  return (m && m.default) || m;
};
tools.isObject = function(obj)
{
  return toString.call(obj) === '[object Object]';
};
tools.isMap = function(obj)
{
  return toString.call(obj) === '[object Map]';
};
tools.isNumber = function(n)
{
  return !isNaN(parseFloat(n)) && isFinite(n);
};
/*tools.flattenArray = function(a)
{
  let out = [];
  for(let i = 0; i < a.length; i++)
  {
    if(Array.isArray(a[i]))
      {
      out = out.concat(this.flattenArray(a[i]));
      }
    else
    {
      out.push(a[i]);
    }
  }
  return out;
};*/
/**
 * Merges two or more arrays into one
 * @param {Array, Map} target
 * @param {Array, Map} arguments
 * @return {Array, Map} target
 */
tools.merge = function (target)
{
  if(tools.isMap(target))
  {
    let sources = [].slice.call(arguments, 1);
    return new Map([...target, ...sources[0]]); //TODO: Merge >2 Maps
  }
  let sources = [].slice.call(arguments, 1);
  sources.forEach(function (source)
  {
    for (let prop in source)
    {
      if(source.hasOwnProperty(prop))
      {
        target[prop] = (typeof source[prop] === 'object')? tools.merge(target[prop], source[prop]) : source[prop];
      }
    }
  });
  return target;
};
