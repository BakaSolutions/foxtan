const Tools = require('../Infrastructure/Tools.js');
const jwt = require('jwt-simple');

class TokenService {

  constructor(config) {
    this.algo = config('token.algo');
    this.secret = config('token.secret');
    this.expires = config('token.expires.access');
    this.debug = config('debug.enable') && config('debug.log.tokens');
  }

  createToken(info) {
    return {
      accessToken: this.createJWT(info),
      expires: Math.floor(+new Date/1000 + this.expires)
    }
  }

  setToken(ctx, { accessToken, expires } = {}) {
    let options = {
      signed: config('cookie.signed'),
      overwrite: true
    };
    options.maxAge = options.expires = config('token.expires.refresh') * 1000;

    ctx.cookies.set('accessToken', accessToken, options);

    return {
      accessToken,
      expires
    };
  }

  createJWT(info, expires = this.expires) {
    let obj = Object.assign({}, info);
    obj.tid = obj.tid || Tools.randomHex(24);
    obj.exp = Math.floor(+new Date/1000 + expires);

    if (this.debug) {
      console.log(`Created access token: ${JSON.stringify(obj)}`);
    }

    return jwt.encode(obj, this.secret, this.algo);
  }

  parseJWT(token, unsafe = false) {
    let obj = jwt.decode(token, this.secret, unsafe, this.algo);

    if (this.debug) {
      console.log(`Parsed access token: ${JSON.stringify(obj)}`);
    }

    return obj;
  }

}

module.exports = TokenService;
