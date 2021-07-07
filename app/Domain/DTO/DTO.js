
class DTO {

  get closedKeys() {
    return [];
  }

  get protectedKeys() {
    return [];
  }

  constructor(data) {
    // this = data || ''

    return this;
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

  static from(data) {
    return new this(data);
  }

}

module.exports = DTO;
