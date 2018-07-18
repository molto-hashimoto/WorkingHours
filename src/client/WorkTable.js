
var WorkTblApp = angular.module('WorkTblApp', []);

WorkTblApp.controller('WorkTblCtrl', ['$scope', function ($scope) {

    // ユーザ名、所属
    $scope.staff_name = "name";
    $scope.staff_post = "post";

    // パラメータ用定義値
    $scope.OBJ_MEMBER_TIM_ST = 2;
    $scope.OBJ_MEMBER_TIM_EN = 3;
    $scope.OBJ_MEMBER_TIM_BK = 4;

    var today = new Date();
    var thisYear = today.getFullYear();
    var thisMonth = today.getMonth();

    // 各時間初期値
    $scope.def_timSt = new Date(thisYear, thisMonth);
    $scope.def_timEn = new Date(thisYear, thisMonth);
    $scope.def_timBk = new Date(thisYear, thisMonth);

    // 労働時間リスト
    $scope.day_works = [];
    $scope.sumWiTim = 0;

    // 労働合計時間計算
    $scope.calcSumWkTim = function(){
        $scope.sumWiTim = 0;
        for(obj of $scope.day_works) {
            $scope.sumWiTim += obj.timWk;
        }
    };

    // 労働時間計算
    $scope.calcWkTim = function(index){
        var obj = $scope.day_works[index];
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

    // 労働時間リスト生成
    $scope.load = function(){
        var weekjp = new Array("日","月","火","水","木","金","土");
        $scope.tuki = thisYear + "年" +(thisMonth+1) + "月";
        
        //月末を取得 (次月の0日)
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
                timSt       : new Date(thisYear, thisMonth, dayCnt),         // 始業時間
                timEn       : new Date(thisYear, thisMonth, dayCnt),         // 終業時間
                timBk       : new Date(thisYear, thisMonth, dayCnt),         // 休憩時間
                note        : ""                // 備考
                });
            $scope.calcWkTim(dayCnt-1);
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

    // 各時間の初期値設定（土日以外）
    $scope.setDefTim = function(type ,val){

        for(index in $scope.day_works) {
            var obj = $scope.day_works[index];
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
    $scope.getInputTimBackground = function(sumWiTim) {
        var ret = {};
        if (sumWiTim == 0) {
            ret = {background :'#dcdcdc'};
        }
        else {
            ret = {background:'#ffffff'};
        }
        return ret;
    };
}]);