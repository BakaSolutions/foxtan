## Foxtan
##### *Fastest one, beat by none!*

#### Installation

##### Prerequisites

- Node.js with npm or npx
- PostgreSQL (for storing posts, other DBs soon)
- Redis (for storing captchas)
- ffmpeg (for processing videos metadata)
- [NPM] sharp (for processing images and previews)
- [NPM] canvas (for creating captcha images)
- [optional] [NPM] node-static (if nginx is not used)

##### Installation steps
```
git clone https://bitbucket.org/bakaso/foxtan
cd foxtan

# Install using npm
npm install
npm i pg

# Install using yarn
yarn install
yarn add pg
```

#### Usage
```
# Launch on LTS or "current" version
node app    # or `npm start` or `yarn start`

# Launch on non-LTS
npx -p node@lts -- node app
```
