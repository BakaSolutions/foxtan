## Foxtan
##### The most technologic and comfortable imageboard engine

#### Install
Dependencies:

- Node with npm
- MongoDB (for storing posts, other DBs soon)
- Redis (for storing captchas)
- ffmpeg (for processing videos)
- [NPM] sharp (for processing images)
- [NPM] canvas (for captcha images)

Optional dependencies:

- [NPM] node-static (if nginx is not used)

Commands:
```
git clone https://bitbucket.org/rngnrs/foxtan
cd foxtan
git checkout develop

npm install # using npm
yarn install # using yarn

node app
```
