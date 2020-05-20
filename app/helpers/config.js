const Figurecon = require('figurecon');
const packageJSON = require('../../package.json');
const path = require('path');
const os = require('os');

const ANONYMOUS = 0;
const USER = 12;
const MODER = 24;
const ADMIN = 42;

const HOST = '127.0.0.1:6749';

let config = {
  board: {
    boardLimit: 200, // threads
    bumpLimit: 500, // posts in a thread
    threadLimit: 1000, // posts

    defaultUserName: "",
    lastPostsNumber: 3,
    threadsPerPage: 20
  },
  captcha: {
    ttl: 60, // seconds
    postsPerCaptcha: 24,

    mime: 'image/jpeg',
    quality: 0.24, // for 'image/jpeg' [0 ... 1]
    compressionLevel: 4, // for 'image/png' [0 ... 9]

    width: 192,
    height: 64,
    //size: 6,
    latin: false,
    cyrillic: false,
    numbers: true,
    smallLetters: false,
    syllable: false,
    complexity: 66,
    fontPerks: true,
    noise: true,
    color: ['#f60', '#6a6', '#9de', '#6bc'],
    background: '#13161a'
  },
  debug: {
    enable: false,
    log: {
      requests: true,
      tokens: true,
      database: true,
      files: true
    }
  },
  db: {
    schema: 'foxtan',
    type: 'pg', // only 'pg' now, sorry!
    pg: {
      url: 'postgresql://localhost:5432/foxtantest'
    },
    redis: {
      url: 'redis://localhost:6379/0',
      options: {},

      nodes: null,
      enableReadyCheck: false,
      maxRedirections: 16,
      scaleReads: 'master',
      retryDelayOnFailover: 100,
      retryDelayOnClusterDown: 100,
      retryDelayOnTryAgain: 100
    }
  },
  files: {
    maxWidth: 10000,
    maxHeight: 10000,
    thumbnail: {
      extension: 'jpg',
      width: 200,
      height: 200,
      options: {
        quality: 67,
        progressive: true
      }
    },
  },
  server: {
    host: '0.0.0.0', // or 'localhost',
    output: 'port', // or 'socket'
    port: 6749,
    socket: path.resolve(os.tmpdir(), 'foxtan') + path.sep + 'socket',
    pathPrefix: '/',
    static: {
      external: false
    },
    useCustom: false,
    version: packageJSON.version
  },
  directories: {
    root: path.resolve(__dirname, '../..') + path.sep,
    temporary: path.resolve(os.tmpdir(), 'foxtan') + path.sep,

    public: path.resolve(__dirname, '../../public') + path.sep,
    upload: path.resolve(__dirname, '../../public/res') + path.sep,
    thumb: path.resolve(__dirname, '../../public/res/thumb') + path.sep
  },
  paths: { // with forward slashes!
    upload: `http://${HOST}/res/`,
    thumb: `http://${HOST}/res/thumb/`,
    ws: `ws://${HOST}/ws`
  },
  token: {
    expires: { // d    h    m    s
      access:              12 * 60
    },
    algo: "HS512",
    secret: '0n1y64k45d0n7ch4ng3p455w0rd5'
  },
  cookie: {
    signed: false,
    secret: 'p13453ch4ng3m364k4'
  },
  groups: {
    ANONYMOUS,
    USER,
    MODER,
    ADMIN
  },
  permissions: { // interactions without a password
    boards: {
      manage: ADMIN
    },
    threads: {
  //  lock: ADMIN,
      pin: ADMIN
    },
    posts: {
      delete: MODER
    },
  //files: {
  //  delete: MODER,
  //},
    users: {
  //  ban: MODER,
      delete: ADMIN,
      manage: ADMIN
    }
  }
};

module.exports = new Figurecon(__dirname + "/../../config.js", config);
