const router = require('koa-router')({ prefix: '/api/v1/post.' });

const config = require('../../../../helpers/config');

const Controller = require('../../index');
const PostLogic = require('../../../../logic/post');
const UserLogic = require('../../../../logic/user');

router.post('create', async ctx => {
  let { body: query, token } = ctx.request;

  if (typeof token.trustedPostCount === 'undefined' || !token.trustedPostCount) {
    if (Controller.isAJAXRequested(ctx)) {
      let out = {
        status: 400,
        message: 'No more posts without captcha!',
        url: '/captcha.html'
      };
      return Controller.fail(ctx, out);
    }
    return ctx.redirect('/', '/captcha.html', 303);
  }

  await PostLogic.create(query, ctx).then(
    async out => {
      token.trustedPostCount--;
      let tokens = await UserLogic.generateTokens(token, false);
      await UserLogic.setCookies(ctx, tokens);

      if (!Controller.isAJAXRequested(ctx) && Controller.isRedirect(query)) {
        let map = {
          ':board': out.boardName,
          ':thread': out.threadNumber,
          ':post': out.number
        };
        return redirect(ctx, query, /:(?:board|thread|post)/g, map);
      }
      out.message = 'Post was successfully created!';
      out.trustedPostCount = token.trustedPostCount;
      Controller.success(ctx, out);
    },
    out => Controller.fail(ctx, out)
  )
});

['get', 'post'].forEach(method => {
  router[method]('read', async ctx => {
    if (method === 'post') {
      ctx.request.query = ctx.request.body;
    }

    await PostLogic.readOne(ctx.request.query)
      .then(
        out => Controller.success(ctx, out),
        out => Controller.fail(ctx, out)
      )
  });
});


router.post('delete', async ctx => {
  let query = ctx.request.body;

  let grantedUser = UserLogic.hasPermission(ctx.request.token, config('permissions.posts.delete'));

  await PostLogic.delete(query, !grantedUser)
    .then(async result => {
      if (Controller.isRedirect(query)) {
        return await redirect(ctx, ctx.request.body);
      }
      return result;
    }).then(
      out => Controller.success(ctx, out),
      out => Controller.fail(ctx, out)
    )
});

function redirect(ctx, query, regexp, map) {
  if (!Controller.isRedirect(query)) {
    return false;
  }
  return new Promise(resolve => {
    if (typeof map !== 'undefined') {
      query.redirect = query.redirect.replace(regexp, m => map[m]);
    }
    return resolve(ctx.redirect(query.redirect));
  })
}

module.exports = router;
