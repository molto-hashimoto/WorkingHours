const fs   = require('fs');
const path = require('path');
const assert = require('assert');
const express = require('express');
// 自作
const getMongoObj = require('./mongo_mng.js');

const router = express.Router();

// MIMEタイプ
const mime = {".html": "text/html", ".css":  "text/css"};

router.get('/', function(req, res) {
	// rootでログイン済
	if(req.session.root == true) {
		res.redirect('/print');
	}
	// ログイン済
	else if (req.session.user_email) {
		res.redirect('/user');
	}
	// 未ログイン
	else {
		res.redirect('/login');
	}
});
router.get('/login', function(req, res) {
	// ログイン画面返却
	const fullPath = __dirname + '/client/login.html';
	res.writeHead(200, {"Content-Type": mime[path.extname(fullPath)] || "text/plain"});
	fs.readFile(fullPath, function(err, data) {
		if (err) {
			res.send('page read error');
		} else {
			res.end(data, 'UTF-8');
		}
	});
});
router.post('/login', function(req, res) {
	// 認証
	getMongoObj().collection('userInfo').findOne({
		'addr': req.body['addr'], 'pw': req.body['pw']
	}, function(err, document){
		assert.equal(err, null);
		console.log("login : " + req.body['addr']);
		// ログイン成功
		if (document != null) {
			// rootでログインの場合、印刷用ページにリダイレクト
			if (document.name == "root") {
				req.session.root = true;
				req.session.user_email = req.body['addr'];
				res.redirect('/print');
			}
			// ユーザページにリダイレクト
			else {
				req.session.user_email = req.body['addr'];
				res.redirect('/user');
			}
		}
		else {
			res.send('login error');
		}
	})
});
router.get('/user', function(req, res) {
	// ログイン済
	if (req.session.user_email) {
		// 勤怠ページ返却
		const fullPath = __dirname + '/client/WorkTable.html';
		res.writeHead(200, {"Content-Type": mime[path.extname(fullPath)] || "text/plain"});
		fs.readFile(fullPath, function(err, data) {
			if (err) {
				res.send('page read error');
			} else {
				res.end(data, 'UTF-8');
			}
		});
	}
	// 未ログイン
	else {
		res.redirect('/');
	}
});
router.post('/user', function(req, res) {
	// 認証
	getMongoObj().collection('userInfo').findOne({
		'addr': req.session.user_email
	}, function(err, document){
		assert.equal(err, null);
		if (document != null) {
			res.send({'name': document.name, 'post': document.post});
		}
		else {
			res.send('login error');
		}
	})
});
router.get('/print', function(req, res) {
	// ログイン済
	if (req.session.root == true) {
		// 勤怠ページ返却
		const fullPath = __dirname + '/client/WorkTable_forPrint.html';
		res.writeHead(200, {"Content-Type": mime[path.extname(fullPath)] || "text/plain"});
		fs.readFile(fullPath, function(err, data) {
			if (err) {
				res.send('page read error');
			} else {
				res.end(data, 'UTF-8');
			}
		});
	}
	// 未ログイン
	else {
		res.redirect('/');
	}
});

module.exports = router;