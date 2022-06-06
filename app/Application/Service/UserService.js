const crypto = require('../../Infrastructure/Crypto.js');

class UserService {

  /**
   *
   * @param {UserModelInterface} UserModel
   */
  constructor(UserModel) {
    this._model = UserModel;
  }

  async validateRegistration(userObject) {
    let { name, email, password } = userObject;

    let obj = { name, email, password };
    for (let key of Object.keys(obj)) {
      if (!obj[key]) {
        throw {
          status: 400,
          message: `Please, enter your ${key}`
        };
      }
    }

    // TODO: Validate e-mail during the registration

    if (password.length < 8) {
      throw {
        status: 400,
        message: `Password must contain at least 8 characters`
      };
    }

    let user = await this.getUser({ name, email });
    if (user?.name?.toLowerCase() === name.toLowerCase()) {
      throw {
        status: 409,
        message: `User with this login already exists!`
      };
    }
    if (user?.email?.toLowerCase() === email.toLowerCase()) {
      throw {
        status: 409,
        message: `User with this e-mail already exists!`
      };
    }

    return true;
  }

  async validateLogin(userObject) {
    let { name, email, password } = userObject;
    if (!name && !email) {
      throw {
        status: 400,
        message: `Please, enter your credentials`
      };
    }
    if (!password) {
      throw {
        status: 400,
        message: `Please, enter your password`
      };
    }

    return true;
  }

  async register(userObject) {
    userObject.salt = UserService.createSalt();
    userObject.passwordHash = UserService.createHash(userObject.password, userObject.salt);
    delete userObject.password;
    userObject.registeredAt = new Date();

    let user = await this._model.create(userObject);
    return user.toObject();
  }

  async login(userObject) {
    let { name, password } = userObject;
    let user = await this._model.readOneByName(name);

    if (!user) {
      throw {
        status: 404,
        message: `User with this login does not exist!`
      };
    }
    if (!UserService.checkPassword(user, password)) {
      throw {
        status: 401,
        message: `Wrong password!`
      };
    }

    return user.toObject();
  }

  async logoff(userDTO) {

  }

  async getUser({ name, email }) {
    if (name && email) {
      return this._model.readOneByNameOrEmail({ name, email });
    }
    if (name) {
      return this._model.readOneByName(name);
    }
    return this._model.readOneByEmail(email);
  }

  static checkPassword(user, password) {
    let { passwordHash, salt } = user;
    password = UserService.createHash(password, salt);
    return password === passwordHash;
  }

  static createHash(password, salt) {
    if (!password) {
      throw {
        status: 400,
        message: `Password is empty!`
      };
    }
    if (!salt) {
      salt = UserService.createSalt();
    }
    return crypto.createPasswordHash(password, salt);
  }

  static createSalt() {
    // NOTE: We need only 3 chars due to DB schema
    return crypto.randomString(3);
  }

}

module.exports = UserService;
