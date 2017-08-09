let router = module.exports = require('express').Router();

router.get("/", async function (req, res) {
  res.json( {"message": "*pong*"} );
});
