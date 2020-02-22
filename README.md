## Foxtan
##### *Fastest one, beat by none!*

#### Install
Dependencies:

- Node with npm or npx
- MongoDB (for storing posts, other DBs soon)
- Redis (for storing captchas)
- ffmpeg (for processing videos)
- [NPM] sharp (for processing images)
- [NPM] canvas (for captcha images)

Optional dependencies:

- [NPM] node-static (if nginx is not used)

Commands:
```
git clone https://bitbucket.org/bakaso/foxtan
cd foxtan
git checkout develop

npm install   # using npm
yarn install  # using yarn

node app      # or `npm start` or `yarn start`

npx -p node@lts -- node app    # if you have node 12-
```
