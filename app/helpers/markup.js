const Tools = require('./tools');
const PostModel = require('../models/mongo/post');

let Markup = module.exports = {};

Markup.patterns = [
  [/&gt;&gt;(\/?.+\/)?([0-9]+)/ig, async function (capture, matches, board, thread, post) {
    let [boardFromMatch, postFromMatch] = matches;
    if (boardFromMatch) board = boardFromMatch.replace(/\//g, '');
    if (+postFromMatch !== thread && +postFromMatch !== post) {
      let query = await PostModel.readOne({
        board: board,
        post: postFromMatch
      });
      if (!Tools.isObject(query)) {
        return capture;
      }
      thread = query.threadNumber;
    }
    return `<a href="/${board}/res/${thread}.html#${postFromMatch}">${capture}</a>`;
  }],
  [/^(&gt;[^&gt;].+)$/mg, '<span class="quotation">$1</span>'],
  [/((https?|s?ftp):\/\/[a-zA-Z0-9\-.]+)\/?[a-zA-Z0-9?&=.:;#\/\-_~%+]*/ig, processURL],
  [/--\s+/g, '&mdash; '],
  [/\[b](.*)\[\/b]/ig, '<b>$1</b>'],
  [/\[i](.*)\[\/i]/ig, '<i>$1</i>'],
  [/\[u](.*)\[\/u]/ig, '<u>$1</u>'],
  [/\[s](.*)\[\/s]/ig, '<s>$1</s>'],
  [/\s?\n/g, '<br />'],
  [/(?:<br \/>){4,}/ig, new Array(4).join('<br />')],
];

Markup.process = async function (text, board, thread, post) {
  if (!text) {
    return '';
  }

  text = escape(text).trim();

  for (let i = 0; i < Markup.patterns.length; i++) {
    if (typeof Markup.patterns[i][1] === 'function') {
      let matches = getMatches(text, Markup.patterns[i][0]);
      for (let j = 0; j < matches.capture.length; j++) {
        text = text.replace(matches.capture[j], await Markup.patterns[i][1](matches.capture[j], matches.matches[j], board, thread, post));
      }
      continue;
    }
    text = text.replace(Markup.patterns[i][0], Markup.patterns[i][1]);
  }

  return text;
};

/**
 * Replaces all dangerous symbols in text
 * @param text
 * @returns {string}
 */
function escape(text) {
  let map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => {
    return map[m];
  });
}

function getMatches(string, regex) {
  let capture = [];
  let matches = [];
  let match;
  while (match = regex.exec(string)) {
    capture.push(match.shift());
    matches.push(match);
  }
  return {
    capture: capture,
    matches: matches
  };
}

function processURL(href, matches) {
  if (matches.length === 1) { // [url]href[/url]
    matches = getMatches(href, /((https?|s?ftp):\/\/[a-zA-Z0-9\-.]+)/ig).matches[0];
  }
  let title = matches[0];
  let protocol = matches[1];
  href = decodeURIComponent(href);
  let cl = (protocol.indexOf('s') > -1)
      ? `class="secure"`
      : '';
  return `<a ${cl} href="${href}" title="${href}" target="_blank" rel=”noopener noreferrer nofollow”>${title}</a>`;
}
