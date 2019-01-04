const Tools = require('./tools');

let defaultOptions = {
  defaultValue: null
};

function Validator(fields = {}, options = defaultOptions) {
  let keys = Object.keys(fields);
  let out = {
    passed: false,
    errors: {},
    fields: {},
  };

  for (let i = 0; i < keys.length; i++) {
    let key = keys[i];
    let { value, type, required, min, max, func } = fields[key];

    if (typeof value === 'undefined') {
      if (required) {
        out.errors[key] = "Field is required";
      }
      out.fields[key] = options.defaultValue;
    }

    switch (type) {
      case "boolean":
        if (required && value === '') {
          out.errors[key] = "Field is required";
        } else {
          value = !!value;
        }
        break;
      case "string":
        value = '' + value;
        if (min && value.length < min) {
          out.errors[key] = "EMINLENGTH";
        } else if (max && value.length > max) {
          out.errors[key] = "EMAXLENGTH";
        }
        if (value === '') {
          if (required) {
            out.errors[key] = "Field is required";
          }
          value = options.defaultValue;
        }
        break;
      case "number":
        let passed = Tools.isNumber(value);
        if (passed) {
          value = +value;
        }
        if (min && value < min) {
          out.errors[key] = "EMIN";
        } else if (max && value > max) {
          out.errors[key] = "EMAX";
        }
        break;
    }

    if (typeof func === 'function') {
      func(value, (err, val) => {
        if (err) {
          return out.errors[key] = err;
        }
        value = (typeof val === 'undefined')
          ? options.defaultValue
          : val;
      }, out.fields);
    }

    out.fields[key] = value;
  }

  if (!Object.keys(out.errors).length) {
    out.passed = true;
  }

  return out;
}

module.exports = Validator;
