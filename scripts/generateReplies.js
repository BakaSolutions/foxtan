#!/usr/bin/env node
const Foxtan = require('../app/Application/Foxtan.js');
const BoardBO = require('../app/Application/Business/BoardBO.js');
const PostBO = require('../app/Application/Business/PostBO.js');

const postsPerPage = 50;

(async () => {
  let foxtan = new Foxtan();
  try {
    await foxtan.init();

    // TODO: Use services instead of business objects
    let Post = new PostBO(foxtan.services);
    let Board = new BoardBO(foxtan.services);

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
          let postNumbers = post.text.matchAll(/>>([0-9]+)/g) ?? [];
          for (let [, postNumber] of postNumbers) {
            try {
              let referredPost = await Post.readOneByBoardAndPost(boardName, +postNumber);
              console.log(post.id, 'replies to', referredPost.id);
              // TODO: Add replies to DB table
            } catch (e) {
              //
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
