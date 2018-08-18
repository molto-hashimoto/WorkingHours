const path = require('path');
const assert = require('assert');
const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const session = require('express-session');
// 自作
const router = require('./router_mng.js');

const app = express();

// ミドルウェアの追加
// clientフォルダ内のjs、cssを提供する
app.use(express.static('client'));
// bodyParser初期化
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 30 * 60 * 1000
  }
}));

app.use('/', router);

// 上記以外のURL指定された場合
app.use(function(req, res, next){
	res.status(404);
	res.end('my notfound! : ' + req.path);
});

// export
module.exports = app;