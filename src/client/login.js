var loginApp = angular.module('loginApp', []);

// web socket connect
var socketio = io.connect('http://localhost:3000');

loginApp.controller('loginCtrl', ['$scope', function ($scope) {

	$scope.loginAddr = "";
	$scope.loginPw = "";
	$scope.loginId;
	$scope.loginName;

	$scope.loginSubmit = function() {
		socketio.emit("login", {"addr" : $scope.loginAddr, "pw" : $scope.loginPw});
	};
	// ログイン成功時のID受信処理
    socketio.on("login", function(info) {
		$scope.loginId = info['id'];
		$scope.loginName = info['name'];
	});
}]);