
class DTO {

  get closedKeys() {
    return [];
  }

  constructor(data) {
    // this = data || ''

    return this;
  }

  lock() {
    Object.preventExtensions(this);
  }

  toArray() {
    return Object.values(this).map(value => {
      if (Array.isArray(value) && !value.length) {
        return null;
      }
      return value;
    });
  }

  toObject(hasPrivileges = false) {
    let out = Object.keys(this);
    if (!hasPrivileges) {
      out = out.filter((key) => !this.closedKeys.includes(key));
    }
    return out.reduce((obj, key) => {
      obj[key] = this[key];
      return obj;
    }, {});
  }

  static from(data) {
    return new this(data);
  }

}

module.exports = DTO;
