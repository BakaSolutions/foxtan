## sobaka
#### The server-oriented BAKA

##### What is "BAKA"?
BAKA means "boardsphere's application that keep the API".

##### Why is it "server-oriented"?
Our team thinks that next-gen imageboard must provide just unified API,  so many clients (like imageboard aggregators, called "overchans") can combine all boards together.

#### Install
Dependencies:

- Node with npm
- MySQL (or MariaDB/PostgreSQL, soon)
- sharp (for processing images, soon)
- ffmpeg (for processing videos, soon)

Optional dependencies:

- SQLite libraries (for geolocation and/or keeping main data)

Commands:
```
git clone https://rngnrs@bitbucket.org/rngnrs/sobaka.git
cd sobaka
npm run install
npm start
```
