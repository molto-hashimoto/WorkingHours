
var WorkTblApp = angular.module('WorkTblApp', []);

// web socket connect
var socketio = io.connect('http://localhost:3000');

WorkTblApp.controller('WorkTblCtrl', ['$scope', function ($scope) {

    // 時刻種別
    $scope.OBJ_MEMBER_TIM_ST = 2;
    $scope.OBJ_MEMBER_TIM_EN = 3;
    $scope.OBJ_MEMBER_TIM_BK = 4;

    // ユーザ名、所属、パスワード
    $scope.staff_name = prompt('ユーザ名');
    $scope.password = prompt('パスワード')
    $scope.staff_post = "post";

    // ユーザ名、パスワード送信
    socketio.emit("userInfo", {"name" : $scope.staff_name, "pw" : $scope.password});

    // 年月設定
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

    // 指定年月 開始日～終了日の箱を生成
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

    // 労働時間テーブル生成
    $scope.createWorkTable = function(){
        //月末を取得 (次月の0日)
        var lastday = new Date($scope.thisYear, $scope.thisMonth, 0);
        lastday = lastday.getDate();

        // 16~月末
        $scope.setWorkTable($scope.thisYear, $scope.thisMonth-1, 16, lastday);
        // 1~15
        $scope.setWorkTable($scope.thisYear, $scope.thisMonth, 1, 15);

        // サーバに年月を通知
        socketio.emit("date_info", {"name" : $scope.staff_name,
                                    "post" : $scope.staff_post,
                                    "year" : $scope.thisYear, 
                                    "month" : $scope.thisMonth});
    };
    // 今月の表示
    $scope.createWorkTable();

    // 月移動
    $scope.shiftMonth = function(shift){
        // 指定された値ずれたDateを取得
        today = new Date($scope.thisYear, $scope.thisMonth + shift, 1);
        $scope.thisYear = today.getFullYear();
        $scope.thisMonth = today.getMonth();
        $scope.work_table = [];
        // テーブル作成
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

    // サーバに労働時間テーブルを送信する
    $scope.submit_workTable = function() {
        // tableにハッシュキーが入っているため、JSON形式に変換
        // DB登録用にkeyを付加する
        var jsonWorkTable = {"name"     : $scope.staff_name, 
                             "post"     : $scope.staff_post,
                             "year"     : $scope.thisYear, 
                             "month"    : $scope.thisMonth,
                             "table"    : JSON.parse(angular.toJson($scope.work_table))};
        socketio.emit("work_table_data", jsonWorkTable);
        alert('送信しました');
    };
    // 労働時間テーブル受信時処理
    socketio.on("work_table_data", function(tableData) {

        if (tableData != undefined) {
            $scope.work_table = tableData["table"];
            for (obj of $scope.work_table) {
                // 文字列→Date型
                obj.timSt = new Date(obj.timSt);
                obj.timEn = new Date(obj.timEn);
                obj.timBk = new Date(obj.timBk);
            }
            // 合計時間計算
            $scope.calcSumWkTim();
            // 外部イベントで$scopeを変更しても反映されないため、強制的に更新。
            $scope.$apply();
        }
    });
}]);