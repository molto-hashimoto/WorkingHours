// ファイル関連
const fs   = require('fs');
const path = require('path');
// web サーバ、socket
const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const bodyParser = require('body-parser');
// assert
const assert = require('assert');
// mongodb
const MongoClient = require('mongodb').MongoClient;

// clientフォルダ内のjs、cssを提供する
app.use(express.static('client'));
// bodyParser初期化
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

// mongodbクライアント管理用
var obj_mongodb;
// 接続クライアント管理用
var client_ids = [];
// MIMEタイプ
var mime = {".html": "text/html", ".css":  "text/css"};
// 周期タイマID
var timer_id;

var getUnixTime = function(){
  var time = new Date();
  time = time.getTime();
  time = Math.floor( time / 1000 );
  return time;
};

// mongoDB接続
MongoClient.connect('mongodb://127.0.0.1:27017/myDB', function(err, client) {
  obj_mongodb = client.db("testdb");
});

// web server  listen
http.listen(3000, function(){
  console.log('Server running at http://localhost:3000/');
});

// パス指定なし→ログイン画面返却
app.get('/', function(req, res) {
  // クライアントから指定されたファイルをresponse (localhost:3000/client/WorkTable.htmlを指定すること)
  var fullPath = __dirname + '/client/login.html';
  res.writeHead(200, {"Content-Type": mime[path.extname(fullPath)] || "text/plain"});
  fs.readFile(fullPath, function(err, data) {
    if (err) {
      // エラー時の応答
    } else {
      res.end(data, 'UTF-8');
    }
  });
});

app.get('/login_request', function(req, res) {

  // ID検索
  result = client_ids.find(function(elm){
    return elm['ID'] == Number(req.query.id);
  });

  if (result != undefined){
    var fullPath = __dirname + '/client/WorkTable.html';
    res.writeHead(200, {"Content-Type": mime[path.extname(fullPath)] || "text/plain"});
    fs.readFile(fullPath, function(err, data) {
      if (err) {
        // エラー時の応答
      } else {
        res.end(data, 'UTF-8');
      }
    });
  }
  else {
    res.end("login error")
  }
});

app.use(function(req, res, next){
	res.status(404);
	res.end('my notfound! : ' + req.path);
});

// web socket connected
io.sockets.on("connection", function (socket) {

  socket.on('disconnect', function(data) {
    
  });

  socket.on("login", function(info){
    // 認証
    obj_mongodb.collection('userInfo').findOne({
      'addr': info['addr'], 'pw': info['pw']
    }, function(err, document){
      assert.equal(err, null);
      console.log("login : " + info['addr']);
      // ログイン成功
      if (document != null) {
        // login IDを生成
        var loginId = Math.floor( Math.random() * 101 );
        loginId *= Math.floor( Math.random() * 101 );
        // UNIX時刻
        var time = getUnixTime();
        client_ids.push({'name': document['name'], 'ID': loginId, 'time': time});
        // ログインIDをクライアントに送信
        socket.emit("login", {'name': document['name'], 'id': loginId});

        // クライアントが１件目接続した場合にタイマ開始
        if (client_ids.length == 1) {
            timer_id = setInterval(function(){
            var timeoutId = [];
            // クライアントIDのタイムアウトチェック
            for(id of client_ids) {
              if ((getUnixTime() - id['time']) > 5){
                timeoutId.push(id);
              }
            }
            //　タイムアウトしたIDを削除
            for(id of timeoutId) {
              var index = client_ids.indexOf(id);
              client_ids.splice(index, 1);
            }
            // 全クライアントID削除した場合にタイマ停止
            if (client_ids.length == 0) {
              clearInterval(timer_id);
            }
          }, 1000);
        }
      }
    })
  });

  // クライアント起動時にユーザ名、年、月を受信
  socket.on("date_info", function(dateInfo){
    console.log(dateInfo);

    // 受信した情報に一致するデータをmongoDBから取得 -> 送信
    obj_mongodb.collection('workTable').find({
      'name': dateInfo['name'], 'year': dateInfo['year'], 'month': dateInfo['month']
    }).toArray(function(error, documents) {
      assert.equal(error, null);
      console.log(documents);
      if (documents.length != 0) {
        socket.emit("work_table_data", documents[0]);
      }
    });
  });

  // 労働時間テーブル受信処理
  socket.on("work_table_data", function (workTableData) {
    console.log(workTableData);

    // mongoDB に受信データを登録
    if (obj_mongodb != undefined) {
      // ユーザ名、年月が一致するレコードを更新、なければ新規作成
      obj_mongodb.collection('workTable').updateOne({
        'name': workTableData['name'], 'year': workTableData['year'], 'month': workTableData['month']
      }, {$set : workTableData}, { upsert: true }, function(err, result) {
        assert.equal(err, null);
        assert.equal(1, result.result.n);
        console.log('update document');
      });
    }
  });
});
