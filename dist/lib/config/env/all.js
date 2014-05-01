'use strict';

var path = require('path');

var rootPath = path.normalize(__dirname + '/../../..');

module.exports = {
  root: rootPath,
  port: process.env.PORT || 9000,
  mongo: {
    options: {
      db: {
        safe: true
      },
      autoReconnect: true
    }
  },
  socket: {
    port: process.env.SOCKET_PORT || 9001
  },
  odesk: {
    key: 'adf9044a95ee960e7a0b1721f390530d', secret: '636373e694c7d15e'
  },
  "db": {
    "url": "mongodb://127.0.0.1:27017/yodesk"
  },
  "mail": {
    "service": "Gmail",
    "auth": {
      "user": "signumdocpad@gmail.com",
      "pass": "signumdocpad1"
    }
  },
  "facebook": {
    "auth": {
      "id": "578138195616687",
      "secret": "56b901ddfcec2d4cff106d652759b40f",
      "callback": "http://yodesk2.com:9000/auth/facebook/callback"
    }
  }
};