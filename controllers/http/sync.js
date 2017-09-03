const Common = require('../common');
const Tools = require('../../helpers/tools');
const Thread = require('../../models/json/thread');

let router = module.exports = require('express').Router();

router.get("/syncData.json", async function (req, res) {
  try {
    let out = await Thread.syncData();
    if (!Tools.isObject(out)) {
      return Common.throw(res, 404);
    }
    res.status(200).json(out);
  } catch (e) {
    return Common.throw(res, 500, e);
  }
});
