
const assert = require('assert');
const getMongoObj = require('./mongo_mng.js');
const app = require('./app.js');
// web サーバ、socket
const http = require('http').Server(app);
const io = require('socket.io')(http);

// web server  listen
http.listen(80, function(){
  console.log('Server running at ---');
});

// web socket connected
io.sockets.on("connection", function (socket) {
  console.log("socket connected");

  socket.on('disconnect', function(data) {
    console.log("socket disconnected");
  });

  // クライアント起動時にユーザ名、年、月を受信
  socket.on("getReq_date_info", function(dateInfo){
    // 受信した情報に一致するデータをmongoDBから取得 -> 送信
    query = {
      'name': dateInfo['name'], 
      'year': dateInfo['year'], 
      'month': dateInfo['month']
    }
    getMongoObj().collection('workTable_2').find(query).toArray(function(error, documents) {
      assert.equal(error, null);
      console.log(documents);
      if (documents.length != 0) {
        socket.emit("getRes_date_info", documents[0]);
      }
    });
  });

  // 全ユーザの指定年月勤怠要求
  socket.on("getReq_date_info_all", function(dateInfo){
    // 受信した情報に一致するデータをmongoDBから取得 -> 送信
    query = {
      'year': dateInfo['year'], 
      'month': dateInfo['month']
    }
    getMongoObj().collection('workTable_2').find(query).toArray(function(error, documents) {
      assert.equal(error, null);
      console.log(documents);
      // 該当勤怠データなしの場合も送信する
//      if (documents.length != 0) {
        socket.emit("getRes_date_info_all", documents);
//      }
    });
  });

  // 労働時間テーブル受信処理
  socket.on("setReq_work_table_data", function (workTableData) {
    console.log(workTableData);

    // mongoDB に受信データを登録
    if (getMongoObj() != undefined) {
      // ユーザ名、年月が一致するレコードを更新、なければ新規作成
      query = {
        'name': workTableData['name'], 
        'year': workTableData['year'], 
        'month': workTableData['month']
      }
      getMongoObj().collection('workTable_2').updateOne(query, {$set : workTableData}, { upsert: true }, function(err, result) {
        assert.equal(err, null);
        assert.equal(1, result.result.n);
        console.log('update document');
      });
    }
  });

  // ユーザリスト取得
  socket.on("getReq_user_list", function(){
    getMongoObj().collection('userInfo').find().toArray(function(error, documents) {
      assert.equal(error, null);
      console.log(documents);
      if (documents.length != 0) {
        socket.emit("getRes_user_list", documents);
      }
    });
  });
  
  // 有給合計数取得
  socket.on("setReq_sumPaidVacation", function(dateInfo){
    // 受信した情報に一致する年度範囲の有給合計数をmongoDBから取得 -> 送信
    let selectYear1;
    let selectYear2;
    let selectMonth = dateInfo['month'];
    //１月から９月の場合、前年の１０月から今年の９月まで取得する。
    //１０月から１２月の場合、今年の１０月から来年の９月まで取得する
    if (selectMonth >= 1 && selectMonth <= 9)
    {
      selectYear1 = dateInfo['year'] - 1;
      selectYear2 = dateInfo['year'];
    }
    else {
      selectYear1 = dateInfo['year'];
      selectYear2 = dateInfo['year'] + 1;
    }
    query = {
      'name': dateInfo['name'], 
      $or:[{'year': selectYear1, 'month': {$gte: 10}},{'year': selectYear2, 'month': {$lte: 10}}]
    }

    getMongoObj().collection('workTable_2').find(query).toArray(function(error, documents) {
      assert.equal(error, null);
      let sumPaidVacation = 0;
      let target;

      for(obj of documents) {
        for (dayObj of obj.table) {
          target = true;
          if ((dayObj.year == selectYear1) && (dayObj.month == 9)) {
            target = false;
          }
          if ((dayObj.year == selectYear2) && (dayObj.month == 10)) {
            target = false;
          }
          if ((target == true) && (dayObj.holidayType == "有給休暇")) {
            sumPaidVacation++;
          }
        }
      }

      socket.emit("getRes_sumPaidVacation", sumPaidVacation);
    });
  });
});
