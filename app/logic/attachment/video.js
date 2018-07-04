const config = require('../../helpers/config');
const Process = require('../../helpers/process');

const { Attachment } = require('./index');

class VideoAttachment extends Attachment {

  constructor(file) {
    super(file);
  }

  async checkFile() {
    let ffprobe = Process.create(
      'ffprobe',
      '-hide_banner ' +
        '-loglevel fatal ' +
        '-show_error ' +
        '-show_format ' +
        '-show_streams ' +
        '-print_format json ' +
        this.file.path
    );
    let metadata = await Process.listen(ffprobe);
    try {
      metadata = JSON.parse(metadata);
      if (metadata.error) {
        throw new Error(metadata.error.string);
      }
    } catch ({ message }) {
      throw {
        status: 500,
        message
      }
    }

    let { duration } = metadata.format;

    this.metadata = {
      dimensions: this._getDimensions(metadata.streams),
      duration: Math.floor(+duration)
    };
    console.log(this.metadata);
    return true;
  }

  async createThumb() {
    let extension = '.' + config('files.thumbnail.extension');
    let out = this.hash + extension;

    let ffmpeg = Process.create(
      'ffmpeg',
      '-hide_banner ' +
        '-loglevel fatal ' +
        '-y ' +
        `-i ${this.file.path} ` +
        '-an ' +
        '-vframes 1 ' +
        `-vf scale=${config('files.thumbnail.width')}:-1 ` +
        config('directories.thumb') + out
    );
    return Process.listen(ffmpeg).then(
      () => out,
      err => {
        throw {
          status: 500,
          message: err
        }
      }
    );
  }

  clearEntry() {
    this.metadata.duration = this._durationToString(this.metadata.duration);
    return this;
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

  _durationToString(duration) {
    duration = Math.floor(+duration);
    let hours = (Math.floor(duration / 3600) + '').padStart(2, '0');
    duration %= 3600;
    let minutes = (Math.floor(duration / 60) + '').padStart(2, '0');
    let seconds = (duration % 60 + '').padStart(2, '0');

    return +hours
      ? `${hours}:${minutes}:${seconds}`
      : `${minutes}:${seconds}`;
  }
  
}

module.exports = VideoAttachment;