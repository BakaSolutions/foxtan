const config = require('../../Infrastructure/Config.js');
const FileDTO = require('../../Domain/DTO/FileDTO.js');
const Tools = require('../../Infrastructure/Tools.js')

const fs = require('fs').promises;
const sharp = require('sharp');
const XXHash = require('xxhash');

class FileBO {

  /**
   *
   * @param {FileService} FileService
   */
  constructor(FileService) {
    if (!FileService) {
      throw new Error('No FileService');
    }
    this.FileService = FileService;
  }

  async create({ path, name, mime, size }) {
    const hash = await fs.readFile(path)
      // TODO: validation
      // TODO: detect image height and width
      .then((file) => {
        // Generate hash
        const hash = XXHash.hash64(file, 0xCAFEBABE).readBigUInt64BE().toString(16);

        // Move file to the destination directory
        const dst = config.get('directories.upload') + hash + '.' + Tools.mimeToFormat(mime);
        fs.writeFile(dst, file);

        // Generate thumbnail
        if ('image' === mime.split('/')[0]) {
          const thumbCfg = config.get('files.thumbnail');
          const thumbDst = config.get('directories.thumb') + hash + '.' + thumbCfg.format;

          sharp(file)
            .resize(thumbCfg.width, thumbCfg.height)
            .toFile(thumbDst, (err) => {
              if (null !== err) {
                console.error(err)
              }
            });
        }

        return hash;
      })

    const fileDTO = new FileDTO({ hash, mime, name, size });
    await this.FileService.create(fileDTO)
      .catch((err) => {
        // Ignore duplicate errors
        if ('23505' !== err.code) {
          throw err;
        }
      });

    return fileDTO;
  }

}

module.exports = FileBO;
