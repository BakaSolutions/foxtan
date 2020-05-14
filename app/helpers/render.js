const doT = require('dot');
const path = require('path');
const FS = require('../helpers/fs');
const Logger = console; // TODO: Import Logger from Kuri
const Tools = require('../helpers/tools');

let Render = module.exports = {};
let includes = {};
let templates = {};

const settings = {
  __proto__: doT.templateSettings,
  strip: false
};
const ILLEGAL_CHARACTERS_REGEXP = /[^a-zA-Z$_]/gi;

const TEMPL = 'src/views';
const DESTI = '.tmp/views'; // TODO: use system temp folder (config('directories.temporary'))
const TEMPL_FOLDER = path.join(__dirname, '../../', TEMPL, path.sep);
const DESTI_FOLDER = path.join(__dirname, '../../', DESTI, path.sep);


Render.loadTemplates = async () => {
  try {
    let templatePaths = await FS.readdir(DESTI_FOLDER);
    templatePaths.forEach(({name: templatePath}) => {
      if (!templatePath.match(/\.js$/i)) {
        return false;
      }
      let templateName = templatePath.replace(DESTI_FOLDER, '').replace('\\', '/').split('.').shift();
      templatePath = path.resolve(DESTI_FOLDER, templatePath);
      if (require.cache[templatePath]) {
        delete require.cache[templatePath];
      }
      templates[templateName] = require(templatePath);
    });
  } catch (err) {
    Logger.error(err.stack || err);
  }
};

/**
 * Compiles all doT.js templates into functions and files
 * Why do we have this function?
 * First and the main reason: it doesn't ignore subdirectories.
 * @returns {Object} -- object with template functions
 */
Render.compileTemplates = async () => {
  Logger.info('[Rndr] Compiling templates...');
  let sources = (await FS.readdir(TEMPL_FOLDER)).map(source => source.name.replace(TEMPL_FOLDER, ''));

  let k;
  let l = sources.length;
  let name;

  for (k = 0; k < l; k++) {
    name = sources[k];
    if (/\.def(\.dot|\.jst)?$/.test(name)) {
      includes[name.substring(0, name.indexOf('.'))] = await FS.readFile(path.join(TEMPL_FOLDER, name));
    }
  }

  for (k = 0; k < l; k++) {
    name = sources[k];
    let realPath = path.join(TEMPL_FOLDER, name);
    if (/\.jst(\.dot|\.def)?$/.test(name)) {
      let template = await FS.readFile(realPath);
      await Render.compileToFile(path.join(name.substring(0, name.indexOf('.')) + '.js'), template);
    }
  }
};

Render.compileToFile = async (filePath, template) => {
  let moduleName = filePath.split('.').shift().replace(ILLEGAL_CHARACTERS_REGEXP, '_');
  let precompiled = doT.template(template, settings, includes).toString().replace('anonymous', moduleName);
  let compiled = '(()=>{' + precompiled + 'module.exports=' + moduleName + ';})()';
  await FS.writeFile(path.join(DESTI_FOLDER, filePath), compiled);
};

Render.renderPage = (templateName, model) => {
  try {
    let template = templates[templateName];
    if (!template) {
      throw new Error('This template doesn\'t exist: ' + templateName);
    }
    let baseModel = {}; //TODO: Is this really needed?
    model = Object.assign({}, baseModel, model); //model = Tools.merge(model, baseModel) || baseModel;
    return template(model);
  } catch (e) {
    Logger.error(e);
    return `Ni-paa~! Please, recompile templates: ${e.message}`;
  }
};

Render.rerender = async what => {
  let routes = require('../routes');
  for (let router of routes.routers) {
    let paths = typeof router.paths === 'function'
        ? await router.paths()
        : router.paths;
    if (!Array.isArray(paths)) {
      paths = [ paths ];
    }
    if (typeof what !== 'undefined') {
      if (!Array.isArray(what)) {
        what = [ what ];
      }
      paths = what.filter(el => ~paths.indexOf(el));
    }
    for (let i = 0; i < paths.length; i++) {
      let path = paths[i];
      Logger.info(`[Rndr] Rendering ${path}...`);
      let result = await router.render(path);
      if (result) {
        await FS.writeFile(path.join('public', path), result);
      }
    }
  }
};
