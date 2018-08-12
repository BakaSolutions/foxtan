const config = require('../../helpers/config');
const Process = require('../../helpers/process');
const sharp = require('sharp');

const { Attachment } = require('./index');

class VideoAttachment extends Attachment {

  constructor(file) {
    super(file);
  }

  async checkFile() {
    let metadata = await this._check();

    let { duration } = metadata.format;
    let { width, height } = this._getDimensions(metadata.streams);

    this.metadata = {
      width,
      height,
      duration: Math.floor(+duration)
    };

    this.file = Object.assign(this.file, this.metadata);
    return true;
  }

  async createThumb() {
    let out = this.file._id + '.' + config('files.thumbnail.extension');

    let {width: w, height: h} = config('files.thumbnail');

    let thumbFullPath = config('directories.thumb') + out;

    let args = [
      '-hide_banner',
      '-loglevel', 'fatal',
      '-y',
      '-i', this.file.path,
      '-an',
      '-vframes', '1',
      '-vf', `scale=min(${w}\\,a*${h}):min(${h}\\,${w}/a)`,
      thumbFullPath
    ];

    let ffmpeg = Process.create('ffmpeg', args);
    await Process.listen(ffmpeg).catch(err => {
      err.details = {
        args,
        in: this.file.path,
        out: thumbFullPath
      };
      throw err;
    });

    let { width, height } = await sharp(thumbFullPath).metadata();

    return this.file.thumb = {
      path: out,
      width,
      height
    };
  }

  _getDimensions(streams) {
    if (!streams) {
      return;
    }
    let index = streams.findIndex(i => !isNaN(+i.width) && !isNaN(+i.height));
    if (index === -1) {
      return;
    }

    let { width, height } = streams[index];
    return { width, height };
  }

  async _check(path = this.file.path) {
    let ffprobe = Process.create(
        'ffprobe',
        '-hide_banner ' +
        '-loglevel fatal ' +
        '-show_error ' +
        '-show_format ' +
        '-show_streams ' +
        '-print_format json ' +
        path
    );
    let metadata = JSON.parse(await Process.listen(ffprobe));

    if (metadata.error) {
      throw new Error(metadata.error.string || metadata.error);
    }

    return metadata;
  }

}

module.exports = VideoAttachment;