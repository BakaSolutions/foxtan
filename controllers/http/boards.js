const Common = require('../common'),
  Tools = require('../../helpers/tools.js');

let router = module.exports = require('express').Router();

router.get("/boards.json", function (req, res) {
  Common.throw(res, 501);
});

router.get("/boards/:board.json", function (req, res) {
  res.json(Tools.merge({}, req.params, req.query));
});

router.post("/create/board", function (req, res) {
  Common.throw(res, 501);
});
