var router = require('express').Router();

router.get("/", (req, res) => {
  var r = {
    "message": "*catching* :3"
  };
  res.json(r);
});

module.exports = router;