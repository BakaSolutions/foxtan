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

Common.isEmpty = input => (typeof input === 'undefined') || (input === '') || (input === null);

Common.cleanEmpty = input => {
  for (let key in input) {
    if (input[key] === '' || (Array.isArray(input[key]) && !input[key].length)) {
      delete input[key];
    }
  }
  return input;
};
