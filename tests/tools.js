var assert = require('assert');
var Tools = require('../helpers/tools');

describe('Модуль инструментов', function () {

  it('подключает все .js-файлы в папке (sync)', function () {
    var files = Tools.requireAllSync('controllers', /\.js$/);
    assert(typeof files === 'object' && files.length > 1);
  });

  it('подключает все .js-файлы в папке (async)', async function () {
    var files = await Tools.requireAll('controllers', /\.js$/);
    assert(typeof files === 'object' && files.length > 1);
  });

  var funcs = ['isObject', 'isMap', 'isNumber'];

  for(var i = 0; i < funcs.length; i++) {
    describe(funcs[i] + '()', function () {

      var tests = [
        [{},        true, false, false],
        [new Map(), false, true, false],
        [42,        false, false, true],
        [3.141592,  false, false, true],
        [['array'], false, false, false],
        [undefined, false, false, false]
      ];

      for(var j = 0; j < tests.length; j++) {
        var testVariable = tests[j][0];
        var expected = tests[j][1 + i];
        var testFunction = Tools[funcs[i]];
        it('при вводе переменной ' + testVariable + ' выводится ' + tests[j][1], function () {
          assert.equal(testFunction(testVariable), expected);
        })
      }

    });
  }

  it('склеивает два объекта', function () {
    var out = Tools.merge({tut: 28}, {turu: 7});
    var expected = {tut: 28, turu: 7};
    assert(Tools.isObject(out) && out.turu === expected.turu);
  });

  it('склеивает два объекта Map', function () {
    var out = Tools.merge(new Map([[1,2],[3,4]]), new Map([[5,6],[7,8]]));
    var expected = new Map([[1,2],[3,4],[5,6],[7,8]]);
    assert(Tools.isMap(out) && out.get(5) === expected.get(5));
  });

  it('склеивает три объекта Map', function () {
    var out = Tools.merge(new Map([[1,2],[3,4]]), new Map([[5,6],[7,8]]), new Map([[9,10]]));
    var expected = new Map([[1,2],[3,4],[5,6],[7,8],[9,10]]);
    assert(Tools.isMap(out) && out.get(7) === expected.get(7) && out.get(9) === expected.get(9));
  });

});
