const config = require('../helpers/config');
const FS = require('../helpers/fs');
const Tools = require('../helpers/tools');

let boards = [];

/** Class representing a board. */
class Board {
  static board(name) {
    return boards[name];
  }

  static addBoard(board) {
    boards[board.name] = board;
  }

  static boardInfos(includeHidden) {
    return board.get(includeHidden).map((board) => {
      return {
        name: board.name,
        title: board.title
      };
    });
  }

  static boardNames(includeHidden) {
    return board.get(includeHidden).map(board => board.name);
  }

  static initialize() {
    boards = {};
    if (config('board.useDefaultBoards')) {
      getDefaultBoards().forEach((board) => {
        Board.addBoard(board);
      });
    }
    Tools.requireAllSync([__dirname, __dirname + '/custom'], /\.js$/).map((plugin) => {
      return (typeof plugin === 'function') ? new plugin() : plugin;
    }).forEach((board) => {
      Board.addBoard(board);
    });
    Board.reloadBanners();
    //Board.reloadPostFormRules();
  }

  constructor(name, title, { defaultPriority, defaultUserName, defaultGroupName } = {}) {
    defaultPriority = Tools.option(defaultPriority, 'number', 0);
    defaultUserName = defaultUserName
      ? Tools.translate(defaultUserName)
      : Tools.translate('Anonymous', 'defaultUserName');
    defaultGroupName = defaultGroupName || '';
    this.defineProperty('name', name);
    this.defineSetting('title', () => { return Tools.translate(title); });
    this.defineSetting('property', defaultPriority);
    this.defineSetting('defaultUserName', defaultUserName);
    this.defineSetting('groupName', defaultGroupName);
    this.defineProperty('captchaEnabled', () => {
      return config('board.captchaEnabled', true) && config(`board.${name}.captchaEnabled`, true);
    });
    //this.defineProperty('bannerFileNames', () => { return banners[name]; });
    //this.defineProperty('postFormRules', () => { return postFormRules[name]; });
    this.defineSetting('opModeration', false);
    this.defineSetting('captchaQuota', 0);
    this.defineSetting('enabled', true);
    this.defineSetting('hidden', false);
    this.defineSetting('maxNameLength', 50);
    this.defineSetting('maxSubjectLength', 150);
    this.defineSetting('maxTextLength', 15000);
    this.defineSetting('maxPasswordLength', 50);
    this.defineSetting('maxFileCount', 1);
    this.defineSetting('maxFileSize', 10 * 1024 * 1024);
    this.defineSetting('maxLastPosts', 3);
    //this.defineSetting('markupElements', DEFAULT_MARKUP_ELEMENTS);
    this.defineSetting('postingEnabled', true);
    this.defineSetting('showWhois', false);
    //const Captcha = Tools.requireWrapper(require('../captchas/captcha'));
    //this.defineSetting('supportedCaptchaEngines', () => { return Captcha.captchaIDs(); });
    /*this.defineProperty('permissions', () => {
      return _(Permissions.PERMISSIONS).mapObject((defaultLevel, key) => {
        return config(`board.${name}.permissions.${key}`, config(`permissions.${key}`, defaultLevel));
      });
    });*/
    //this.defineSetting('supportedFileTypes', DEFAULT_SUPPORTED_FILE_TYPES);
    this.defineSetting('bumpLimit', 500);
    this.defineSetting('postLimit', 1000);
    this.defineSetting('threadLimit', 200);
    this.defineSetting('archiveLimit', 0);
    this.defineSetting('threadsPerPage', 20);
    this.defineProperty('launchDate', () => {
      return new Date(config(`board.${name}.launchDate`, config('board.launchDate', new Date())));
    });
  }

  defineSetting(name, def) {
    Object.defineProperty(this, name, {
      get: () => {
        return config(`board.${this.name}.${name}`,
          config(`board.${name}`, (typeof def === 'function') ? def() : def));
      },
      configurable: true
    });
  }

  defineProperty(name, value) {
    if (typeof value === 'function') {
      Object.defineProperty(this, name, {
        get: value,
        configurable: true
      });
    } else {
      Object.defineProperty(this, name, {
        value: value,
        configurable: true
      });
    }
  }

  info() {
    let model = {
      name: this.name,
      title: this.title,
      defaultUserName: this.defaultUserName,
      groupName: this.groupName,
      showWhois: this.showWhois,
      hidden: this.hidden,
      postingEnabled: this.postingEnabled,
      captchaEnabled: this.captchaEnabled,
      maxEmailLength: this.maxEmailLength,
      maxNameLength: this.maxNameLength,
      maxSubjectLength: this.maxSubjectLength,
      maxTextLength: this.maxTextLength,
      maxPasswordLength: this.maxPasswordLength,
      maxFileCount: this.maxFileCount,
      maxFileSize: this.maxFileSize,
      maxLastPosts: this.maxLastPosts,
      markupElements: this.markupElements,
      supportedFileTypes: this.supportedFileTypes,
      supportedCaptchaEngines: this.supportedCaptchaEngines,
      bumpLimit: this.bumpLimit,
      postLimit: this.postLimit,
      bannerFileNames: this.bannerFileNames,
      postFormRules: this.postFormRules,
      launchDate: this.launchDate.toISOString(),
      permissions: this.permissions,
      opModeration: this.opModeration
    };
    this.customInfoFields().forEach((field) => {
      model[field] = this[field];
    });
    return model;
  }

  generateTripcode(source) {
    return '!' + Tools.crypto('md5', source + config('site.tripcodeSalt'), 'base64').substr(0, 10);
  }
}
