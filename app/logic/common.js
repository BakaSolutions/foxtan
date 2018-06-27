const Tools = require('../helpers/tools');

let Common = module.exports = {};

Common.hasEmpty = input => {
  if (!Tools.isObject(input, false)) {
    return Common.isEmpty(input);
  }
  let out = [];
  for (let key in input) {
    if (Common.isEmpty(input[key])) {
      out.push(key);
    }
  }
  return out.length
    ? out.join(', ')
    : false;
};

Common.isEmpty = input => (typeof input === 'undefined') || (input === '');
