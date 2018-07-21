var http = require('http');
var fs   = require('fs');
var path = require('path');
var mime = {
  ".html": "text/html",
  ".css":  "text/css"
  // 読み取りたいMIMEタイプはここに追記
};
var server = new http.createServer(function(req, res) {

  if (req.url == '/') {
    filePath = '/client//WorkTable.html';
  } else {
    filePath = req.url;
  }
  var fullPath = __dirname + filePath;

  res.writeHead(200, {"Content-Type": mime[path.extname(fullPath)] || "text/plain"});
  fs.readFile(fullPath, function(err, data) {
    if (err) {
      // エラー時の応答
    } else {
      res.end(data, 'UTF-8');
    }
  });
})
server.listen(3000, function() {
  console.log('Server running at http://localhost:3000/');
});

var io = require('socket.io').listen(server);

io.sockets.on("connection", function (socket) {

  socket.on("connected", function (name) {
    console.log("hello");
  });

  socket.on("disconnect", function () {

  });
});
