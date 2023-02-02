const { DtoError } = require('../Error/index.js');


class DTO {

  constructor() {
    Object.defineProperty(this, "DtoError", {
      value: DtoError,
      enumerable: false
    });
  }

  get closedKeys() {
    return [];
  }

  get protectedKeys() {
    return [];
  }

  lock() {
    Object.preventExtensions(this);
  }

  toArray(hasPrivileges = false) {
    let keys = Object.keys(this);
    if (!hasPrivileges) {
      keys = keys.filter(key => !this.protectedKeys.includes(key));
    }
    return keys.reduce((obj, key) => {
      let value = this[key];
      if (Array.isArray(value) && !value.length) {
        value = null;
      }
      obj.push(value);
      return obj;
    }, []);
  }

  toObject(hasPrivileges = false) {
    let keys = Object.keys(this);
    if (!hasPrivileges) {
      keys = keys.filter(key => !this.closedKeys.includes(key));
    }
    return keys.reduce((obj, key) => {
      obj[key] = this[key];
      return obj;
    }, {});
  }

  cleanOutput(hasPrivileges) {
    return this.toObject(hasPrivileges);
  }

  static from(data) {
    return new this(data);
  }

}

module.exports = DTO;
