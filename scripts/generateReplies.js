#!/usr/bin/env node
const Foxtan = require('../app/Application/Foxtan.js');
const postsPerPage = 50;

(async () => {
  let foxtan = new Foxtan();
  try {
    await foxtan.init();

    let {
      BoardService: Board,
      PostService: Post,
      ReplyService: Reply
    } = foxtan.services;

    let boards = await Board.readMany();
    for (let { name: boardName } of boards) {
      //console.log(`Processing board /${boardName}/...`);
      let postsCount = await Post.countByBoardName(boardName);
      let pages = Math.ceil(postsCount / postsPerPage);
      //console.log(`Posts: ${postsCount}`);
      //console.log(`Pages: ${pages}`);
      for (let i = 0; i < pages; i++) {
        let posts = await Post.readBoardFeed(boardName, {
          count: postsPerPage,
          page: i,
          order: 'ASC'
        });
        for (let post of posts) {
          //console.log(`Processing post #${post.id}...`);
          let replies = Post.parseReplies(post);
          // TODO: Use internal Foxtan functions
          for (let [, postNumber] of replies) {
            try {
              let referredPost = await Post.readOneByBoardAndPost(boardName, +postNumber);
              //console.log(post.id, 'replies to', referredPost.id);
              let replies = await Reply.readPostReplies(referredPost.id);
              if (replies.some(reply => reply.toId === referredPost.id)) {
                console.log(`[${post.id} => ${referredPost.id}] Reply exists. Skipping...`);
                continue;
              }
              console.log(`[${post.id} => ${referredPost.id}] Storing the reply...`);
              await Reply.create(post.id, referredPost.id);
            } catch (e) {
              if (!e.code || e.code !== 404) {
                console.log(e);
              }
            }
          }
        }
      }
    }
    process.exit(0);
  } catch (e) {
    foxtan.logError(e);
    process.exit(1);
  }
})();
