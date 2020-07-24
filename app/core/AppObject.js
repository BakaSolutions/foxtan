const Tools = require('../helpers/tools.js');

class AppObject {

  _lock() {
    Object.preventExtensions(this);
  }

  _init(key, setter, defaultValue = null) {
    Object.defineProperty(this, key, {
      configurable: true,
      enumerable: true,
      get: () => defaultValue,
      set: value => {
        if (typeof setter === 'function') {
          value = setter(value, defaultValue);
        }
        if (value !== defaultValue) {
          this._setOnce(key, value)
        }
      }
    });
  }

  _setOnce(key, value) {
    try {
      Object.defineProperty(this, key, {
        configurable: false,
        enumerable: true,
        value
      });
    } catch {
      //
    }
  }

  bulk(obj = {}) {
    Object.keys(obj).map(key => {
      try {
        Object.assign(this, { [key]: obj[key] });
      } catch (e) {
        //console.log(e);
      }
    });
    return this;
  }

  setId(id) {
    if (!Tools.isNumber(id)) {
      throw new Error('Id must be a number')
    }
    if (id < 1) {
      throw new Error('Id can not be less than 1')
    }
    return +id;
  }

  setDate(date, defaultValue) {
    if (Object.prototype.toString.call(date) === '[object Date]') { // prevent new Date('invalid string')
      // date = +date;  Date to Timestamp
      return date;
    }
    return defaultValue;
  }

  toObject() {
    let out = {};
    for (let [key, value] of Object.entries(this)) {
      out[key] = value;
    }
    return out;
  }

  toArray() {
    return Object.values(this);
  }

}

module.exports = AppObject;
