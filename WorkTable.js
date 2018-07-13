
var WorkTblApp = angular.module('WorkTblApp', []);

WorkTblApp.controller('WorkTblCtrl', ['$scope', function ($scope) {

    $scope.OBJ_MEMBER_TIM_ST = 2;
    $scope.OBJ_MEMBER_TIM_EN = 3;
    $scope.OBJ_MEMBER_TIM_BK = 4;

    var today = new Date();
    var thisYear = today.getFullYear();
    var thisMonth = today.getMonth();
    $scope.day_works = [];
    $scope.def_timSt = "00:00";  // 始業時間初期値
    $scope.def_timEn = "00:00";  // 終業時間初期値
    $scope.def_timBk = "00:00";  // 休憩時間初期値

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
                timSt       : "00:00",               // 始業時間
                timEn       : "00:00",               // 終業時間
                timBk       : "00:00",               // 休憩時間
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

    $scope.setDefTim = function(type ,val){
        for(obj of $scope.day_works) {
            if ((obj.dayofweek != "土") && (obj.dayofweek != "日")){
                switch(type) {
                case $scope.OBJ_MEMBER_TIM_ST:
                obj.timSt = val.toLocaleTimeString();
                break;
                case $scope.OBJ_MEMBER_TIM_EN:
                obj.timEn = val.toLocaleTimeString();
                break;
                case $scope.OBJ_MEMBER_TIM_BK:
                obj.timBk = val.toLocaleTimeString();    
                break;
                default:
                    break;
                }
            }
        }
    };

}]);