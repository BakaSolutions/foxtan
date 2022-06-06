const DTO = require('./DTO.js');

class UserDTO extends DTO {

  get closedKeys() {
    return ['privilegesId', 'passwordHash', 'salt'];
  }

  get protectedKeys() {
    return ['id'];
  }

  constructor(data) {
    super();
    if (!data) {
      throw new TypeError();
    }

    this.id = data.id;
    this.privilegesId = data.privilegesId;
    this.name = data.name;
    this.email = data.email;
    this.passwordHash = data.passwordHash;
    this.salt = data.salt;
    this.registeredAt = data.registeredAt;
    this.expiredAt = data.expiredAt;

    return this;
  }

}

module.exports = UserDTO;
