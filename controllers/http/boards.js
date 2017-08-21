const Common = require('../common'),
  model = require('../../models/json/board');

let router = module.exports = require('express').Router();

router.get("/boards.json", async function (req, res) {
  try {
    let includeHidden = !!req.query.includeHidden;
    let out = await model.readAll(includeHidden);
    res.json(out);
  } catch (e) {
    return Common.throw(res, 500, e);
  }
});

router.get("/lastPostNumbers.json", async function (req, res) {
  try {
    let out = await model.getCounters();
    res.json(out);
  } catch (e) {
    return Common.throw(res, 500, e);
  }
});

router.get("/:board/board.json", async function (req, res) {
  try {
    let out = await model.read(req.params.board);
    if (!out) {
      return Common.throw(res, 404);
    }
    res.json(out);
  } catch (e) {
    return Common.throw(res, 500, e);
  }
});

router.post("/api/board.create", async function (req, res) {
  try {
    await Common.parseForm(req);
    let query = await model.create(req.body);
    if (typeof query === 'undefined') {
      return false;
    }
    let out = {ok: query.affectedRows === 1};
    res.status(201).json(out);
  } catch (e) {
    return Common.throw(res, 500, e);
  }
});
