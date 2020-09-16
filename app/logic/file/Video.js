const FileFromPath = require('./index.js');

const Process = require('../../helpers/process.js');
const config = require('../../helpers/config.js');

module.exports = class Video extends FileFromPath {
  constructor(args) {
    super(args);
  }
  async check() {
    await super.check();
    let {format: {duration}, streams} = await this.ffprobe();
    let {width, height} = await this.getDimensions(streams);
    this.file.width = width;
    this.file.height = height;
    this.file.duration = duration;
    return true;
  }
  async createThumb() {
    let {width: w, height: h} = config('files.thumbnail');
    let outPath = config('directories.thumb') + this.file.hash + '.' + this.decideThumbExtension();

    let args = [
      '-hide_banner',
      '-loglevel', 'fatal',
      '-y',
      '-i', this.path,
      '-an',
      '-vframes', '1',
      '-vf', `scale=min(${w}\\,a*${h}):min(${h}\\,${w}/a)`,
      outPath
    ];

    let ffmpeg = Process.create('ffmpeg', args);
    try {
      await Process.listen(ffmpeg);
    } catch (e) {
      e.details = {
        args,
        in: this.path,
        out: outPath
      };
      throw e;
    }
    return true;
  }

  async ffprobe() {
    let args = [
      '-hide_banner ' +
      '-loglevel fatal ' +
      '-show_error ' +
      '-show_format ' +
      '-show_streams ' +
      '-print_format json ' +
      this.path
    ];
    let ffprobe = Process.create('ffprobe', args);
    let metadata = {};
    try {
      let output = await Process.listen(ffprobe);
      metadata = JSON.parse(output);
      if (metadata.error) {
        throw metadata.error;
      }
    } catch (e) {
      throw new Error(e.string || e);
    }
    return metadata;
  }
  async getDimensions(streams) {
    if (!streams) {
      throw new Error('No streams');
    }
    let index = streams.findIndex(({width, height}) => Tools.isNumber(+width) && Tools.isNumber(+height));
    if (index === -1) {
      throw new Error('No video stream');
    }
    return {
      width: streams[index].width,
      height: streams[index].height
    }
  }
};
