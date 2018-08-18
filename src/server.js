
const assert = require('assert');
const getMongoObj = require('./mongo_mng.js');
const app = require('./app.js');
// web サーバ、socket
const http = require('http').Server(app);
const io = require('socket.io')(http);

// web server  listen
http.listen(3000, function(){
  console.log('Server running at http://localhost:3000/');
});

// web socket connected
io.sockets.on("connection", function (socket) {

  socket.on('disconnect', function(data) {
    
  });

  // クライアント起動時にユーザ名、年、月を受信
  socket.on("date_info", function(dateInfo){
    console.log(dateInfo);

    // 受信した情報に一致するデータをmongoDBから取得 -> 送信
    getMongoObj().collection('workTable').find({
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
    if (getMongoObj() != undefined) {
      // ユーザ名、年月が一致するレコードを更新、なければ新規作成
      getMongoObj().collection('workTable').updateOne({
        'name': workTableData['name'], 'year': workTableData['year'], 'month': workTableData['month']
      }, {$set : workTableData}, { upsert: true }, function(err, result) {
        assert.equal(err, null);
        assert.equal(1, result.result.n);
        console.log('update document');
      });
    }
  });
});
