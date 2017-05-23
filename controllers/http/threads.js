const Common = require('../common'),
    Tools = require('../../helpers/tools.js');

var router = module.exports = require('express').Router();

router.get("/:board/res/:id.json", (req, res) => {
  res.json(Tools.merge({}, req.params, req.query));
});

router.get("/:board/feed.json", (req, res) => {
  Common.throw(res, 501);
});

router.get("/:board/catalog.json", (req, res) => {
  Common.throw(res, 501);
});

router.post("/create/thread", (req, res) => {
  Common.throw(res, 501);
});
