const Tools = require('../helpers/tools');

let Common = module.exports = {};

Common.hasEmpty = input => {
  if (!Tools.isObject(input, false)) {
    return Common.isEmpty(input);
  }
  let out = [];
  for (let key of input) {
    if (Common.isEmpty(input[key])) {
      out.push(key);
    }
  }
  return out.length
    ? out.join(', ')
    : false;
};

Common.isEmpty = input => (typeof input === 'undefined')
  || (input === '')
  || (input === null)
  || (Array.isArray(input) && !input.length);

Common.cleanEmpty = input => {
  for (let key of input) {
    if (Common.isEmpty(input[key])) {
      delete input[key];
    }
  }
  return input;
};
