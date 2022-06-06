const Redis = require('ioredis');
const config = require('./Config.js');

let defaultClient = null;
let clients = new Map();

function createClient() {
  let redis;
  let redisNodes = config.get('db.redis.nodes');
  if (Array.isArray(redisNodes) && redisNodes.length) {
    redis = new Redis.Cluster(redisNodes, {
      clusterRetryStrategy: config.get('db.redis.clusterRetryStrategy', times => Math.min(100 + times * 2, 2000)),
      enableReadyCheck: config.get('db.redis.enableReadyCheck'),
      scaleReads: config.get('db.redis.scaleReads'),
      maxRedirections: config.get('db.redis.maxRedirections'),
      retryDelayOnFailover: config.get('db.redis.retryDelayOnFailover'),
      retryDelayOnClusterDown: config.get('db.redis.retryDelayOnClusterDown'),
      retryDelayOnTryAgain: config.get('db.redis.retryDelayOnTryAgain'),
      redisOptions: config.get('db.redis.options')
    });
  } else {
    redis = new Redis(config.get('db.redis.url'), config.get('db.redis.options'));
  }

  redis.on("error", e => {
    switch (e.code) {
      case "ECONNREFUSED":
        console.log("Start `redis-server` on " + e.address + ":" + e.port + "!");
        break;
      default:
        console.log("Redis connection error", e);
    }
  });

  return redis;
}

module.exports = id => {
  if (id && (typeof id === 'object' || typeof id === 'boolean')) {
    return createClient();
  }

  if (!id) {
    if (!defaultClient) {
      defaultClient = createClient();
    }
    return defaultClient;
  }

  let client = clients.get(id);
  if (!client) {
    client = createClient();
    clients.set(id, client);
  }
  return client;
};
