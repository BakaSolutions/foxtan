const emailValidator = require("email-validator");

const crypto = require('../../Infrastructure/Crypto.js');
const {
  MissingParamError,
  BadRequestError,
  NotAuthorizedError,
  NotFoundError,
  ConflictError
} = require('../../Domain/Error/index.js');

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
        throw new MissingParamError(`Please, enter your ${key}`);
      }
    }

    // TODO: Add a stricter validator
    if (!emailValidator.validate(email)) {
      throw new BadRequestError(`Please, enter a valid e-mail`);
    }

    if (password.length < 8) {
      throw new BadRequestError(`Password must contain at least 8 characters`);
    }

    let user = await this.getUser({ name, email });
    if (user?.name?.toLowerCase() === name.toLowerCase()) {
      throw new ConflictError(`User with this login already exists!`);
    }
    if (user?.email?.toLowerCase() === email.toLowerCase()) {
      throw new ConflictError(`User with this e-mail already exists!`);
    }

    return true;
  }

  async validateLogin(userObject) {
    let { name, email, password } = userObject;
    if (!name && !email) {
      throw new MissingParamError(`Please, enter your credentials`);
    }
    if (!password) {
      throw new MissingParamError(`Please, enter your password`);
    }

    return true;
  }

  async register(userObject) {
    userObject.salt = UserService.createSalt();
    userObject.passwordHash = UserService.createHash(userObject.password, userObject.salt);
    delete userObject.password;
    userObject.registeredAt = new Date();

    let user = await this._model.create(userObject);
    if (user === null) {
      console.log("this usually does not happen. study logs!");
      throw new BadRequestError("Can not register user with your credentials");
    }
    return user.toObject();
  }

  async login(userObject) {
    let { name, email, password } = userObject;

    let user = await this.getUser({ name , email });
    if (!user) {
      throw new NotFoundError(`User with this login does not exist!`);
    }
    if (!UserService.checkPassword(user, password)) {
      throw new NotAuthorizedError(`Wrong password!`);
    }

    return user.toObject();
  }

  async getUser({ name, email }) {
    return name
      ? await this._model.readOneByName(name?.toLocaleLowerCase())
      : email
        ? await this._model.readOneByEmail(email?.toLocaleLowerCase())
        : null;
  }

  async readOneById(id) {
    return this._model.readOneById(+id);
  }

  static checkPassword(user, password) {
    let { passwordHash, salt } = user;
    password = UserService.createHash(password, salt);
    return password === passwordHash;
  }

  static createHash(password, salt) {
    if (!password) {
      throw new BadRequestError(`Password is empty!`);
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
