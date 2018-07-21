
var WorkTblApp = angular.module('WorkTblApp', []);

var socketio = io.connect('http://localhost:3000');
socketio.on("connected", function(name) {});
socketio.emit("connected", "hello");

WorkTblApp.controller('WorkTblCtrl', ['$scope', function ($scope) {

    // ユーザ名、所属
    $scope.staff_name = "name";
    $scope.staff_post = "post";

    // パラメータ用定義値
    $scope.OBJ_MEMBER_TIM_ST = 2;
    $scope.OBJ_MEMBER_TIM_EN = 3;
    $scope.OBJ_MEMBER_TIM_BK = 4;

    var today = new Date();
    $scope.thisYear = today.getFullYear();
    $scope.thisMonth = today.getMonth();  // 0-11
    if (today.getDate() > 15) {
        $scope.thisMonth+=1;
    }
    // 各時間初期値
    $scope.def_timSt = new Date($scope.thisYear, $scope.thisMonth);
    $scope.def_timEn = new Date($scope.thisYear, $scope.thisMonth);
    $scope.def_timBk = new Date($scope.thisYear, $scope.thisMonth);

    // 労働時間リスト
    $scope.work_table = [];
    $scope.sumWkTim = 0;
    $scope.numWkDays = 0;

    // 労働合計時間計算
    $scope.calcSumWkTim = function(){
        $scope.sumWkTim = 0;
        $scope.numWkDays = 0;
        for(obj of $scope.work_table) {
            $scope.sumWkTim += obj.timWk;
            if (obj.timWk > 0){
                $scope.numWkDays += 1;
            }
        }
    };

    // 労働時間計算
    $scope.calcWkTim = function(index){
        var obj = $scope.work_table[index];
        // (終業時間-始業時間) (分)
        var workingTime = (obj.timEn.getTime() - obj.timSt.getTime()) / (1000*60);
        // 休憩時間 (分)
        var breakTime = (obj.timBk.getHours() * 60) + obj.timBk.getMinutes();
        workingTime -= breakTime;
        workingTime /= 60;
        obj.timWk = workingTime;

        // 合計時間計算
        $scope.calcSumWkTim();
    };

    $scope.setWorkTable = function(year, month, startDay, endDay){
        var weekjp = new Array("日","月","火","水","木","金","土");
        for (var dayCnt=startDay ; dayCnt <= endDay ; dayCnt++){
            var xday = new Date(year, month, dayCnt);
            // 曜日取得(0~6)
            var xdays = xday.getDay();
            $scope.work_table.push({
                year        : xday.getFullYear(),   // 年
                month       : xday.getMonth(),      // 月
                day         : xday.getDate(),       // 日付
                dayofweek   : weekjp[xdays],        // 曜日
                timSt       : new Date(year, month, dayCnt),         // 始業時間
                timEn       : new Date(year, month, dayCnt),         // 終業時間
                timBk       : new Date(year, month, dayCnt),         // 休憩時間
                note        : ""                    // 備考
                });
            $scope.calcWkTim($scope.work_table.length-1);
        }
    };

    // 労働時間リスト生成
    $scope.createWorkTable = function(){
        //月末を取得 (次月の0日)
        var lastday = new Date($scope.thisYear, $scope.thisMonth, 0);
        lastday = lastday.getDate();

        // 16~月末
        $scope.setWorkTable($scope.thisYear, $scope.thisMonth-1, 16, lastday);
        // 1~15
        $scope.setWorkTable($scope.thisYear, $scope.thisMonth, 1, 15);
    };
    // 今月の表示
    $scope.createWorkTable();

    // 月移動
    $scope.shiftMonth = function(shift){
        today = new Date($scope.thisYear, $scope.thisMonth + shift, 1);
        $scope.thisYear = today.getFullYear();
        $scope.thisMonth = today.getMonth();
        $scope.work_table = [];
        $scope.createWorkTable();
    };

    // 各時間の初期値設定（土日以外）
    $scope.setDefTim = function(type ,val){

        for(index in $scope.work_table) {
            var obj = $scope.work_table[index];
            // 日付変更
            if ((obj.dayofweek != "土") && (obj.dayofweek != "日")){
                switch(type) {
                case $scope.OBJ_MEMBER_TIM_ST:
                    obj.timSt = new Date(obj.timSt.getFullYear(), obj.timSt.getMonth(), obj.timSt.getDate(), val.getHours(), val.getMinutes());
                    break;
                case $scope.OBJ_MEMBER_TIM_EN:
                    obj.timEn = new Date(obj.timEn.getFullYear(), obj.timEn.getMonth(), obj.timEn.getDate(), val.getHours(), val.getMinutes());;
                    break;
                case $scope.OBJ_MEMBER_TIM_BK:
                    obj.timBk = new Date(obj.timBk.getFullYear(), obj.timBk.getMonth(), obj.timBk.getDate(), val.getHours(), val.getMinutes());; 
                    break;
                default:
                    break;
                }
            }
            $scope.calcWkTim(index);
        }
    };
    // 各曜日の背景色を返す
    $scope.getholidayStyle = function(dayofweek){
        var ret = {};
        switch(dayofweek) {
            case '土':
                ret = {background: '#b0c4de'};
                break;
            case '日':
                ret = {background: '#F5BCA9'};
                break;
            default:
                ret = {background: '#f5f5dc'};
                break;
        }
        return ret;
    };
    // 各時間の背景色を返す
    $scope.getInputTimBackground = function(sumWkTim) {
        var ret = {};
        if (sumWkTim <= 0) {
            ret = {background :'#dcdcdc'};
        }
        else {
            ret = {background:'#ffffff'};
        }
        return ret;
    };
}]);