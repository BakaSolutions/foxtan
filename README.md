## Foxtan
##### *Fastest one, beat by none!*

#### Installation

##### Prerequisites

- Node.js with npm or npx
- PostgreSQL (for storing posts, other DBs soon)
- Redis (for storing captchas)
- ffmpeg (for processing videos metadata)
- [NPM] sharp (for processing images and previews)
- [NPM] canvas (for creating captcha images) (there is an [issue](https://github.com/Automattic/node-canvas/issues/930) on Windows, please, use [Docker version](https://github.com/BakaSolutions/foxtan-docker))
- [optional] [NPM] node-static (if web server like nginx is not used)

##### Installation steps
```
git clone https://github.com/BakaSolutions/foxtan
cd foxtan

# Install using pnpm (https://pnpm.io)
pnpm install
```

#### Configuration
After you have installed the dependencies, `config.js` file will get automatically created for you. Edit it to set up the engine.

#### Database setup

Once engine set up is done, run `knex migrate:latest` to create tables in your database.

Run `knex seed:run` to add default admin account and some post samples.

Default admin credentials:
- login: `admin`
- password: `changeme`

#### Usage
```
# Launch on LTS or "current" version
node app    # or `pnpm start`

# Launch on non-LTS
npx -p node@lts -- node app
```

#### API

To learn more about the API, check out [fkclient.js](https://github.com/BakaSolutions/fkclient.js)
as well as [its example](https://github.com/BakaSolutions/fkclient.js#running-the-example-app) - 
the simplest application based on Foxtan API.

#### Clients

- [Kumori](https://github.com/octoman90/Kumori) - Official up-to-date client-side rendering client based on Vue 3
- [Kuri](https://github.com/BakaSolutions/kuri) - [STALLED] Server-side rendering client
