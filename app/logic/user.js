const jwt = require('jwt-simple');

const CommonLogic = require('./common');
const UserModel = require('../models/mongo/user');

const config = require('../helpers/config');
const Crypto = require('../helpers/crypto');
const Tools = require('../helpers/tools');

const JWT_ALGO = config('token.algo');

let User = module.exports = {};

User.create = async ({ login, password } = {}) => {
  let user = await UserModel.readOne({
    _id: {
      $regex: `^${login}$`,
      $options: 'i'
    }
  });

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
  if (!login) {
    throw {
      status: 400,
      message: `There's no login in form/cookies!`
    };
  }

  let user = await UserModel.readOne({
    _id: {
      $regex: `^${login}$`,
      $options: 'i'
    }
  });

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

User.createJWT = (info, expires = config('token.expires.access')) => {
  let obj = Object.assign({}, info);
  obj.tid = obj.tid || Tools.randomHex(24);
  obj.exp = Math.floor(+new Date/1000 + expires);

  if (config('debug.enable') && config('debug.log.tokens')) {
    console.log(`Created access token: ${JSON.stringify(obj)}`);
  }

  return jwt.encode(obj, config('token.secret'), JWT_ALGO, {});
};

User.parseJWT = (token, unsafe = false) => {
  let obj = jwt.decode(token, config('token.secret'), unsafe, JWT_ALGO);

  if (config('debug.enable') && config('debug.log.tokens')) {
    console.log(`Parsed access token: ${JSON.stringify(obj)}`);
  }

  return obj;
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

User.hasPermission = (user, action, board) => { // TODO: Rewrite vichan's ported version
  if (!user || !action) {
    console.log('Something strange is happening here.');
    console.log(user, action, board);
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
  return User.createToken(user);
};

User.createToken = info => {
  return {
    accessToken: User.createJWT(info),
    expires: Math.floor(+new Date/1000 + config('token.expires.access'))
  }
};

User.refreshToken = async (token, unsafe) => {
  if (!token) {
    return false;
  }

  let refreshInfo = User.parseJWT(token, unsafe);
  if (!refreshInfo) {
    throw {
      status: 403,
      message: `Invalid token`
    };
  }

  let user = {
    tid: refreshInfo.tid,
    trustedPostCount: refreshInfo.trustedPostCount || 0
  };

  if (refreshInfo._id) {
    let user = await User.readOne({
      login: refreshInfo._id
    });
    if (!user) {
      throw {
        status: 403
      };
    }
  }

  return User.createToken(user);
};

User.setToken = (ctx, {accessToken, expires}) => {
  let options = {
    signed: config('cookie.signed'),
    overwrite: true
  };
  options.maxAge = options.expires = config('token.expires.refresh') * 1000;

  ctx.cookies.set('accessToken', accessToken, options);

  return {
    accessToken,
    expires
  }
};
