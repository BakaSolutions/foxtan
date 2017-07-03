const Common = require('../common'),
    model = require('../../models/json/thread');

let router = module.exports = require('express').Router();

router.get("/:board/res/:id.json", async function (req, res)
{
  try
  {
    let out = await model.read(req.params.board, req.params.id).catch(function (e)
    {
      Common.throw(res, 500, e)
    });
    if(typeof out !== 'object' || 1 > out.length)
    {
      return Common.throw(res, 404);
    }
    out.forEach(function (post)
    {
      delete post['posts_password'];
      if(post['posts_thread'] !== null)
      {
        Common.removeInfo(post);
      }
    });
    res.status(200).json(out);
  } catch (e)
  {
    Common.throw(res, 500);
  }
});

router.get("/:board/feed.json", function (req, res)
{
  Common.throw(res, 501);
});

router.get("/:board/catalog.json", function (req, res)
{
  Common.throw(res, 501);
});

router.post("/api/thread.create", async function (req, res)
{
  await Common.parseForm(req);
  let query = await model.create(req.body);
  if (req.body.redirect)
  {
    res.redirect(303, `/${query.board}/res/${query.thread}.json`)
  }
  else
  {
    res.status(201).json(query);
  }
});

router.post("/api/thread.delete", async function (req, res)
{
  await Common.parseForm(req);
  if (typeof req.body.password === 'undefined' || req.body.password === '')
  {
    return Common.throw(res, 200, "Please, define a password");
  }
  let out = await model.delete(req.body.boardName, req.body.postNumber, req.body.password);
  if (out.ok)
  {
    res.status(200).json({"ok": typeof out.result === 'undefined'? 0 : out.result.affectedRows});
  }
  else
  {
    Common.throw(res, 200, out.exists ? "Wrong password" : "It doesn't exist!");
  }
});
