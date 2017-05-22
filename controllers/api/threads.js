var router = module.exports = require('express').Router(),
  Tools = require('../../helpers/tools.js');

router.get("/:board/res/:id.json", (req, res) => {
  res.json(Tools.merge({}, req.params, req.query));
});

