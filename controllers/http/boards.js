const Common = require('../common'),
  model = require('../../models/db/board');

let router = module.exports = require('express').Router();

router.get("/boards.json", async function (req, res) {
  let out = await model.readAll();
  res.json(out);
});

router.get("/lastPostNumbers.json", async function (req, res) {
  let out = await model.getCounters();
  res.json(out);
});

router.get("/:board/board.json", async function (req, res) {
  let out = await model.read(req.params.board);
  res.json(out);
});

router.post("/api/board.create", async function (req, res) {
  await Common.parseForm(req);
  let query = await model.create(req.body).catch(e => Common.throw(res, 500, e));
  if (typeof query === 'undefined')
    return false;
  let out = {ok: query.affectedRows === 1};
  res.status(201).json(out);
});
