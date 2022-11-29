const config = require('../../Infrastructure/Config.js');
const FileDTO = require('../../Domain/DTO/FileDTO.js');
const Tools = require('../../Infrastructure/Tools.js')

const fs = require('fs').promises;
const sharp = require('sharp');
const thumbler = require('video-thumb');
const XXHash = require('xxhash');

class FileBO {

  /**
   *
   * @param {FileService} FileService
   */
  constructor({FileService}) {
    this.FileService = FileService;
  }

  async create({ path, name, mime, size }, modifiers) {
    const [hash, width, height] = await fs.readFile(path)
      // TODO: validation
      .then((file) => {
        // Generate hash
        const hash = XXHash.hash64(file, 0xCAFEBABE).readBigUInt64BE().toString(16);

        // Move file to the destination directory
        const dst = config.get('directories.upload') + hash + '.' + Tools.mimeToFormat(mime);
        fs.writeFile(dst, file);

        switch (mime.split('/')[0]) {
          case 'image': {
            const thumbCfg = config.get('files.thumbnail');
            const thumbDst = config.get('directories.thumb') + hash + '.' + thumbCfg.format;
            const image = sharp(file);

            // Detect image width and height
            return image.metadata()
              .then((metadata) => {
                const [width, height] = [metadata.width, metadata.height];

                // Generate image thumbnail
                image
                  .resize(thumbCfg.width, thumbCfg.height)
                  .toFile(thumbDst, (err) => {
                    if (null !== err) {
                      console.error(err)
                    }
                  });

                return [hash, width, height]
              })
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
            return [hash, null, null];
        }
      })

    const fileDTO = new FileDTO({ hash, mime, name, size, width, height, modifiers });
    await this.FileService.create(fileDTO);

    return fileDTO;
  }

}

module.exports = FileBO;
