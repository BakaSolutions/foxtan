const config = require('../../Infrastructure/Config.js');
const FileDTO = require('../../Domain/DTO/FileDTO.js');
const Tools = require('../../Infrastructure/Tools.js')
const fs = require('fs').promises;
const sharp = require('sharp');
const thumbler = require('video-thumb');
const XXHash = require('xxhash');

class FileService {

  /**
   *
   * @param {FileModelInterface} FileModel
   */
  constructor(FileModel) {
    if (!FileModel) {
      throw new Error('No FileModel');
    }

    this._fileModel = FileModel;
  }

  async create(fileObject, modifiers) {
    let { path, name, mime, size } = fileObject;
    const file = await fs.readFile(path);
    // TODO: Validation
    // TODO: Optimization: get file via fs.createReadStream

    let hash = this.createHash(file);
    let [width, height] = await this.createThumbnail(file, {...fileObject, hash});

    // Move file to the destination directory
    const dst = config.get('directories.upload') + hash + '.' + Tools.mimeToFormat(mime);
    await fs.writeFile(dst, file);

    const fileDTO = new FileDTO({ hash, mime, name, size, width, height, modifiers });
    return await this._fileModel.create(fileDTO);
  }

  async createHash(file) {
    return XXHash.hash64(file, 0xCAFEBABE).readBigUInt64BE().toString(16);
  }

  async createThumbnail(file, fileObject) {
    let { path, mime, hash } = fileObject;

    switch (mime.split('/')[0]) {
      case 'image': {
        const thumbCfg = config.get('files.thumbnail');
        const thumbDst = config.get('directories.thumb') + hash + '.' + thumbCfg.format;
        const image = sharp(path);

        // Detect image width and height
        const { width, height } = await image.metadata();

        // Generate image thumbnail
        await image
          .resize(thumbCfg.width, thumbCfg.height)
          .toFile(thumbDst);

        return [width, height]
      }

      case 'video': {
        const thumbCfg = config.get('files.thumbnail');
        const thumbDst = config.get('directories.thumb') + hash + '.' + thumbCfg.format;
        thumbler.extract(path, thumbDst, '00:00:00', [thumbCfg.width, thumbCfg.height].join('x'), (err) => {
          if (null !== err) {
            console.error(err);
          }
        });
      }

      default:
        return [null, null];
    }
  }

  async read(hashArray) {
    return await this._fileModel.read(hashArray);
  }

  async delete(hash) {
    let hashArray = [ hash ];
    let files = await this._fileModel.read(hashArray);
    let file = files[0];
    try {
      await fs.rm(config.get('directories.upload') + hash + '.' + Tools.mimeToFormat(file.mime));
      await fs.rm(config.get('directories.thumb') + hash + '.' + config.get('files.thumbnail.format'));
    } catch (e) {
      console.log(e); // TODO: Remove after debug
    }
    return await this._fileModel.delete(hashArray);
  }

}

module.exports = FileService;
