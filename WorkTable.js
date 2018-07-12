
var WorkTblApp = angular.module('WorkTblApp', []);

WorkTblApp.controller('WorkTblCtrl', ['$scope', function ($scope) {

    var today = new Date();
    var thisYear = today.getFullYear();
    var thisMonth = today.getMonth();
    $scope.day_works = [];
    
    $scope.load = function(){
        var weekjp = new Array("日","月","火","水","木","金","土");
        $scope.tuki = thisYear + "年" +(thisMonth+1) + "月";
        //月末を取得
        var lastday = new Date(thisYear, thisMonth+1, 0);
        lastday = lastday.getDate();
        var wak = "";
        for (var dayCnt=1 ; dayCnt <= lastday ; dayCnt++){
            var xday = new Date(thisYear, thisMonth, dayCnt);
            // 曜日取得(0~6)
            var xdays = xday.getDay();
            $scope.day_works.push({
                day         : dayCnt,           // 日付
                dayofweek   : weekjp[xdays],    // 曜日
                timSt       : "",               // 始業時間
                timEn       : "",               // 終業時間
                timBk       : "",               // 休憩時間
                note        : ""                // 備考
                });
        }
    };
    // 今月の表示
    $scope.load();

    // 月移動
    $scope.shiftMonth = function(shift){
        today = new Date(thisYear, thisMonth + shift, 1);
        thisYear = today.getFullYear();
        thisMonth = today.getMonth();
        $scope.day_works = [];
        $scope.load();
    };

}]);