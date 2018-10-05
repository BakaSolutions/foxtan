const Redis = require('ioredis');
const config = require('../helpers/config');

let defaultClient = null;
let clients = new Map();

function createClient() {
  let redis;
  let redisNodes = config('db.redis.nodes');
  if (Array.isArray(redisNodes) && redisNodes.length) {
    redis = new Redis.Cluster(redisNodes, {
      clusterRetryStrategy: config('db.redis.clusterRetryStrategy', times => Math.min(100 + times * 2, 2000)),
      enableReadyCheck: config('db.redis.enableReadyCheck'),
      scaleReads: config('db.redis.scaleReads'),
      maxRedirections: config('db.redis.maxRedirections'),
      retryDelayOnFailover: config('db.redis.retryDelayOnFailover'),
      retryDelayOnClusterDown: config('db.redis.retryDelayOnClusterDown'),
      retryDelayOnTryAgain: config('db.redis.retryDelayOnTryAgain'),
      redisOptions: config('db.redis.options')
    });
  } else {
    redis = new Redis(config('db.redis.url'), config('db.redis.options'));
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
