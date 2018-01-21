const router = require('koa-router')({ prefix: '/api/v1/post.' });

const Controllers = require('../../../index');
const PostLogic = require('../../../../logic/post');

router.post('create', async ctx => {
  let query = ctx.request.body;

  await PostLogic.create(query, ctx).then(async post => {
    let map = {
      ':board': post.boardName,
      ':thread': post.threadNumber,
      ':post': post.number
    };
    if (isRedirect(query)) {
      return await redirect(ctx, query, /:(?:board|thread|post)/g, map);
    }
    return post;
  }).then(
    out => Controllers.success(ctx, out),
    out => Controllers.fail(ctx, out)
  )
});

['get', 'post'].forEach((method) => {
  router[method]('read', async (ctx) => {
    if (method === 'post') {
      ctx.request.query = ctx.request.body;
    }

    await PostLogic.readOne(ctx.request.query, ctx)
      .then(
        out => Controllers.success(ctx, out),
        out => Controllers.fail(ctx, out)
      )
  });
});


router.post('delete', async (ctx) => {
  let query = ctx.request.body;

  await PostLogic.delete(query, ctx)
    .then(async (result) => {
      if (isRedirect(query)) {
        return await redirect(ctx, ctx.request.body);
      }
      return result;
    }).then(
      out => Controllers.success(ctx, out),
      out => Controllers.fail(ctx, out)
    )
});

function isRedirect(query) {
  return !(typeof query.redirect === 'undefined' || query.redirect === '');
}

function redirect(ctx, query, regexp, map) {
  return new Promise(resolve => {
    if (typeof query.redirect !== 'undefined' && query.redirect !== '') {
      if (typeof map !== 'undefined') {
        query.redirect = query.redirect.replace(regexp, m => map[m]);
      }
      return setTimeout(() => {
        ctx.redirect(query.redirect);
        return resolve();
      }, 1000);
    }
  })
}

module.exports = router;
