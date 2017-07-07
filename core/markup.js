const config = require('../helpers/config');

let m = module.exports = {},
  parsePatterns = [
      [/\s?\n/img, '<br />'],
      [/&gt;&gt;&gt;\/?(\w{1,24}\/)/img, '<a href="/$1">&gt;&gt;&gt;/$1</a>'],
      [/&gt;&gt;([0-9]{1,24})/img, '<a href="/$1">&gt;&gt;$1</a>'], // TODO: mention function
      [/&gt;&gt;\/?(\w{1,24})\/([0-9]{1,24})/img, '<a href="/$1/res/$2">&gt;&gt;/$1/$2</a>'],
      [/(https?:\/\/([a-zA-Z0-9\-.]+)\/?[a-zA-Z0-9?&=.:;#\/\-_~%+]*)/img, '<a href="$1" title="$1" target="_blank">$2</a>'], // url
      [/^&gt;(.*)$/img, '<span class="quotation">&gt;$1</span>'], // quotation
      [/---/g, '—'],
      [/--/g, '–'],
    ];

Array.prototype.push.apply(parsePatterns, (function () {
  return config('markup.tags').map(function (tag) {
    let out;
    if (tag.length === 1) {
      out = [new RegExp(`\\[${tag}\\](.+?)\\[/${tag}\\]`, 'img'), `<${tag}>$1</${tag}>`];
    } else {
      if (Array.isArray(tag[0])) {
        out = [new RegExp(`${tag[0][0]}(.+?)${tag[0][1]}`, 'img'), `${tag[1][0]}$1${tag[1][1]}`];
      } else {
        out = [new RegExp(`${tag[0]}(.+?)${tag[0]}`, 'img'), `${tag[1][0]}$1${tag[1][1]}`];
      }
    }
    return out;
  })
})());

Array.prototype.push.apply(parsePatterns, config('markup.patterns'));

/**
 * Creates HTML markup from tags
 * @param html
 * @returns {string|XML|void|*}
 */
m.toHTML = function(html) {
  html = escape(html);

  for (let i = 0; i < parsePatterns.length; i++) {
    html = html.replace(parsePatterns[i][0], parsePatterns[i][1]);
  }

  while (html.search(new RegExp('\\[spoiler\\](.+)\\[\\/spoiler\\]', 'im')) > -1) {
    html = html.replace('[spoiler]', '<span class="spoiler">');
    html = html.replace('[/spoiler]', '</span>');
  }

  html = html.replace(/[\u0300-\u036f\u0483-\u0489\u1dc0-\u1dff\u20d0-\u20ff\ufe20-\ufe2f]/gm, '');
  return html;
};

/**
 * Replaces all dangerous symbols in text
 * @param text
 * @returns {string|XML|void|*}
 */
function escape(text) {
  let map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, function (m) {
    return map[m];
  });
}

/* // TODO: tests
let times = 100000, o, wtt = '%%**bold** *italic* ***wtf*** [b]bold[/b] [i]ita[/i] [u]wtf[/u]%%';
console.log(`Testing ${times} times...`);
console.log('Input: ' + wtt);
let start = +new Date();
for (let i = 0; i < times; i++) {
  o = m.toHTML(wtt);
}
console.log(+new Date() - start, o);*/
