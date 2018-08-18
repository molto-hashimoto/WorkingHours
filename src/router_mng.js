const fs   = require('fs');
const path = require('path');
const assert = require('assert');
const express = require('express');
// 自作
const getMongoObj = require('./mongo_mng.js');

const router = express.Router();

// MIMEタイプ
const mime = {".html": "text/html", ".css":  "text/css"};

// パス指定なし→ログイン画面返却
router.get('/', function(req, res) {
	// クライアントから指定されたファイルをresponse (localhost:3000/client/WorkTable.htmlを指定すること)
	const fullPath = __dirname + '/client/login.html';
	res.writeHead(200, {"Content-Type": mime[path.extname(fullPath)] || "text/plain"});
	fs.readFile(fullPath, function(err, data) {
		if (err) {
		// エラー時の応答
		} else {
		res.end(data, 'UTF-8');
		}
	});
});
// メールアドレス、PW指定によるログイン
router.post('/login', function(req, res) {
	// 認証
	getMongoObj().collection('userInfo').findOne({
		'addr': req.body['addr'], 'pw': req.body['pw']
	}, function(err, document){
		assert.equal(err, null);
		console.log("login : " + req.body['addr']);
		// ログイン成功
		if (document != null) {
			req.session.user = req.body['addr'];

			// 勤怠ページ返却
			const fullPath = __dirname + '/client/WorkTable.html';
			res.writeHead(200, {"Content-Type": mime[path.extname(fullPath)] || "text/plain"});
			fs.readFile(fullPath, function(err, data) {
				if (err) {
				// エラー時の応答
				} else {
				res.end(data, 'UTF-8');
				}
			});
		}
	})
});

module.exports = router;