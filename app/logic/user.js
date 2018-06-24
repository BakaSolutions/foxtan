const jwt = require('jwt-simple');
const ObjectID = require('mongodb').ObjectID;

const CommonLogic = require('./common');
const UserModel = require('../models/mongo/user');

const config = require('../helpers/config');
const Crypto = require('../helpers/crypto');

const JWT_ALGO = 'HS512';

let User = module.exports = {};

User.create = async ({ login, password } = {}) => {
  let user = await UserModel.readOne({ _id: login });

  if (user) {
    throw {
      status: 409,
      message: `User with this login already exists!`
    };
  }

  return await UserModel.create({
    _id: login,
    password: User.createHash(password),
    boards: ['*'],
    level: config('groups.USER')
  });
};

User.readOne = async ({ login } = {}) => {
  let user = await UserModel.readOne({ _id: login });

  if (!user) {
    throw {
      status: 404,
      message: `User doesn't exist!`
    };
  }

  return user;
};

User.readAll = async () => {
  let users = await UserModel.readAll();

  if (!users) {
    throw {
      status: 404,
      message: `Users don't exist!`
    };
  }

  return users;
};

User.deleteOne = async ({ login, password } = {}, checkPassword = true) => {
  let user = await User.readOne({ login });

  if (checkPassword && !User.checkPassword(password, user.password)) {
    throw {
      status: 401,
      message: `Wrong password!`
    };
  }

  return await UserModel.deleteOne({ login });
};


User.createHash = password => {
  if (CommonLogic.isEmpty(password)) {
    throw {
      status: 400,
      message: `Password is empty!`
    };
  }
  return Crypto.sha256(password);
};

User.createToken = (info, expires = config('token.expires.access')) => {
  let obj = Object.assign({}, info);
  obj.exp = Math.floor(+new Date/1000 + expires);

  return jwt.encode(obj, config('token.secret'), JWT_ALGO, {});
};

User.checkPassword = (password, hash) => {
  if (CommonLogic.isEmpty(password)) {
    throw {
      status: 400,
      message: `Password is empty!`
    };
  }
  return Crypto.sha256(password) === hash;
};

User.parseToken = token => jwt.decode(token, config('token.secret'), false, JWT_ALGO);

User.hasPermission = (user, action, board) => {
  if (!user || !action) {
    console.log('Something strange is happening here.');
    return false;
  }

  if (!user.level || user.level < action) {
    return false;
  }

  if (board && user.boards &&
      (!user.boards.includes(board) || !user.boards.includes('*'))) {
    return false;
  }

  return true;
};

User.login = async ({ login, password } = {}) => {
  let user = await User.readOne({ login });
  if (!User.checkPassword(password, user.password)) {
    throw {
      status: 401,
      message: `Wrong password!`
    };
  }
  return await User.generateTokens(user);
};

User.generateTokens = async ({_id, level, boards} = {}, refresh = true) => {
  let accessToken = User.createToken({ _id, level, boards });
  let refreshToken = null;
  if (refresh) {
    refreshToken = User.createToken({ _id }, config('token.expires.refresh'));

    if (_id) {
      await UserModel.update({
        query: { _id },
        fields: { refreshToken }
      });
    }
  }
  let expires = Math.floor(+new Date/1000 + config('token.expires.access'));

  return {
    accessToken,
    refreshToken,
    expires
  }
};

User.refreshTokens = async token => {
  if (!token) {
    throw {
      status: 400,
      message: `There is no refreshToken in header/cookies`
    };
  }

  let refreshInfo = User.parseToken(token);
  if (!refreshInfo) {
    throw {
      status: 403,
      message: `Invalid refreshToken`
    };
  }

  let user = await User.readOne({
    _id: ObjectID(refreshInfo._id)
  });
  if (!user || (token !== user.refreshToken)) {
    throw {
      status: 403
    };
  }

  return await User.generateTokens(user, refreshInfo.exp < (+new Date/1000) + config('token.expires.refresh'));
};

User.setCookies = (ctx, {accessToken, refreshToken, expires}) => {
  let options = {
    maxAge: expires,
    signed: config('cookie.signed'),
    expires,
    overwrite: true
  };

  ctx.cookies.set('accessToken', accessToken, options);

  options.maxAge = options.expires = config('token.expires.refresh') * 1000;
  ctx.cookies.set('refreshToken', refreshToken, options);

  return {
    accessToken,
    refreshToken,
    expires
  }
};
