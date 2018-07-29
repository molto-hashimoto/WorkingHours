var http = require('http');
var fs   = require('fs');
var path = require('path');
const assert = require('assert');
const MongoClient = require('mongodb').MongoClient;

var obj_mongodb;

var mime = {
  ".html": "text/html",
  ".css":  "text/css"
  // 読み取りたいMIMEタイプはここに追記
};
var server = new http.createServer(function(req, res) {

  // クライアントから指定されたファイルをresponse (localhost:3000/client/WorkTable.htmlを指定すること)
  var fullPath = __dirname + req.url;
  res.writeHead(200, {"Content-Type": mime[path.extname(fullPath)] || "text/plain"});
  fs.readFile(fullPath, function(err, data) {
    if (err) {
      // エラー時の応答
    } else {
      res.end(data, 'UTF-8');
    }
  });
})
// web server  listen
server.listen(3000, function() {
  console.log('Server running at http://localhost:3000/');
});

// web socket　listen
var io = require('socket.io').listen(server);
// web socket connected
io.sockets.on("connection", function (socket) {

  // msg "connected" recv func
  socket.on("connected", function (name) {
    console.log(name);
  });
  // msg "disconnect" recv func
  socket.on("disconnect", function () {

  });

  // クライアント起動時にユーザ名、年、月を受信
  socket.on("date_info", function(dateInfo){
    console.log(dateInfo);

    // 受信した情報に一致するデータをmongoDBから取得 -> 送信
    obj_mongodb.collection('workTable').find({
      'name': dateInfo['name'], 'year': dateInfo['year'], 'month': dateInfo['month']
    }).toArray(function(error, documents) {
      console.log(documents);
      if (documents.length != 0) {
        socket.emit("work_table_data", documents[0]);
      }
    });
  });

  // 勤怠データ受信処理
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

// mongoDB接続
MongoClient.connect('mongodb://127.0.0.1:27017/myDB', function(err, client) {
  obj_mongodb = client.db("testdb");

//    db.close();
});
