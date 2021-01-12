# YT-Wrapper
YT-wrapper is a basic Nodejs application, that fetches latest youtube videos corresponding to a tag and updates them locally in a MYSQL DB. 
Uses, Nodejs + Express.js + MYSQL + Sequelize

## Prerequisites
Make sure you have installed all of the following prerequisites on your development machine:
* Git - [Download & Install Git](https://git-scm.com/downloads). OSX and Linux machines typically have this already installed.
* Node.js - [Download & Install Node.js](https://nodejs.org/en/download/) and the npm package manager. If you encounter any problems, you can also use this [GitHub Gist](https://gist.github.com/isaacs/579814) to install Node.js.
* MYSQL - [Download & Install MYSQL](https://dev.mysql.com/doc/refman/5.7/en/installing.html), and make sure it's running on the default port.

## Quick Install
Once you have installed the pre-requisites,

The app comes pre-bundled with a `package.json` file that contain the list of modules you need to start your application.

To install the dependencies, run this in the application folder from the command-line:

```bash
$ npm install
```
## Running Your Application

Run your application using npm:

Before running the application make sure you have added the MYSQL configs in the file

```bash
$ ~/YT-Wrapper/app/config/db.config
```
Also don't forget adding your API-Keys in the app config at 

```bash
$ ~/YT-Wrapper/app/config/app.config
```

Once done, you can start the server in test mode using 
```bash
$ ACTIVE_ENV=TESTING node server.js
```
or in the without testing env using

```bash
$ ACTIVE_ENV=TESTING node server.js
```

Your application should run on port 8080 with the production environment configuration, so in your browser just go to [http://localhost:8080](http://localhost:8080)

That's it! Your application should be running.

## Implementation Details

### Database

The schema for the videos table looks like:
```
Table: videos

Columns:
id varchar(255) PK
title varchar(255)
description text
publishedOn datetime
thumbnailUrl varchar(255)
channelId varchar(255)
channelTitle varchar(255)
createdAt datetime
updatedAt datetime
```

With a secondary index on the publishedOn field:
```
Index: publishedOn_index

Definition:
Type BTREE
Unique No
Visible Yes
Columns publishedOn
```
### Cache

The local cache is used at two instances:
- To keep the track of most recent active access-key.
- To keep the token of the next page to be fetched. In case of multiple nodes running, a distributed cache will ensure a single page is not requested twice which would help in saving api-quota limits + preventing failed primary key contraints due to multiple inserts. 

## Testing

- API to get list of videos (Paginated)

```bash
curl --location --request GET 'http://localhost:8080/api/videos?offset=20&limit=20'
```
Preview:
![Postman Screenshot](https://github.com/shan61916/yt-wrapper/blob/main/image1.jpg?raw=true)

- API to get search title (Paginated)

```bash
curl --location --request GET 'http://localhost:8080/api/videos/search/virat'
```
Preview:
![Postman Screenshot](https://github.com/shan61916/yt-wrapper/blob/main/image2.jpg?raw=true)
