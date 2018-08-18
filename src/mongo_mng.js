// mongodb object管理
const MongoClient = require('mongodb').MongoClient;
let obj_mongodb;

// mongoDB接続
MongoClient.connect('mongodb://127.0.0.1:27017/myDB', function(err, client) {
  obj_mongodb = client.db("testdb");
});
// mongoDB object取得
const getMongoObj = function() {
	return obj_mongodb;
}
// export
module.exports = getMongoObj;