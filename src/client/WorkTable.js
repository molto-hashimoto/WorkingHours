
const WorkTblApp = angular.module('WorkTblApp', []);

// web socket connect
const socketio = io.connect('http://127.0.0.1:80');

let judgeHoliday;

function onLoad() {};

WorkTblApp.controller('WorkTblCtrl', ['$scope', function ($scope) {

    // 時刻種別
    $scope.OBJ_MEMBER_TIM_ST = 2;
    $scope.OBJ_MEMBER_TIM_EN = 3;
    $scope.OBJ_MEMBER_TIM_BK = 4;

    $scope.userInfoList = [];
    $scope.userList = [];
    $scope.selectedUser;

    // 編集有無フラグ
    $scope.changeFlag = false;

    // ロック状態
    $scope.lock = false;

    // 表示画面が今月かどうか
    $scope.showingOtherMongth = false;

    // ユーザ名、所属
    $scope.staff_name;
    $scope.staff_post;

    // 年月設定
    let today = new Date();
    $scope.thisYear = today.getFullYear();
    $scope.thisMonth = today.getMonth();  // 0-11 処理上はそのまま使うが、サーバに送信する際は+1する
    // 前月、次月ボタンで月が変わるため、ページ表示時の日付を覚えておく
    $scope.orgThisYear = $scope.thisYear;
    $scope.orgThisMonth = $scope.thisMonth;
    $scope.orgThisDay = today.getDate();

    // 16日以降は次月を表示
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

    // その他情報
    // 有給休暇合計
    $scope.paidVacation = 0;

    // サーバに有給休暇数の取得要求を送信する
    $scope.submit_paidVacation = function() {
        // tableにハッシュキーが入っているため、JSON形式に変換
        // DB登録用にkeyを付加する
        let jsonpaidVacation = {"name"         : $scope.staff_name, 
                                "post"         : $scope.staff_post,
                                "year"         : $scope.thisYear, 
                                "month"        : $scope.thisMonth+1};
        socketio.emit("setReq_sumPaidVacation", jsonpaidVacation);
    };
    // 有給時間合計日数取得
    socketio.on("getRes_sumPaidVacation", function(sumPaidVacation) {

        if (sumPaidVacation != undefined) {
            $scope.paidVacation = sumPaidVacation;
            $scope.$apply();
        }
    });
    
    // 労働合計時間計算
    $scope.calcSumWkTim = function(){
        $scope.sumWkTim = 0;
        $scope.numWkDays = 0;
        for(obj of $scope.work_table) {
            $scope.sumWkTim += obj.timWk;
            if ((obj.timWk > 0) && (obj.holidayType != "有給休暇") && (obj.holidayType != "忌引")){
                $scope.numWkDays += 1;
            }
        }
    };

    // 労働時間計算
    $scope.calcWkTim = function(index){
        let obj = $scope.work_table[index];
        // (終業時間-始業時間) (分)
        let workingTime = (obj.timEn.getTime() - obj.timSt.getTime()) / (1000*60);
        // 休憩時間 (分)
        let breakTime = (obj.timBk.getHours() * 60) + obj.timBk.getMinutes();
        workingTime -= breakTime;
        workingTime /= 60;
        if(workingTime >= 0){
            obj.timWk = workingTime;
        }
        else {
            obj.timWk = 0;
        }
        // 合計時間計算
        $scope.calcSumWkTim();
    };

    // 編集判定用ラッパ関数
    $scope.wrap_calcWkTim = function(index) {
        $scope.calcWkTim(index);
        // 編集あり
        $scope.changeFlag = true;
    }

    // 指定年月 開始日～終了日の箱を生成
    $scope.setWorkTable = function(year, month, startDay, endDay){
        const weekjp = new Array("日","月","火","水","木","金","土");
        for (let dayCnt=startDay ; dayCnt <= endDay ; dayCnt++){
            let xday = new Date(year, month, dayCnt);
            // 曜日取得(0~6)
            let xdays = xday.getDay();
            $scope.work_table.push({
                year        : xday.getFullYear(),   // 年
                month       : xday.getMonth()+1,    // 月(0~11のため＋1する)
                day         : xday.getDate(),       // 日付
                dayofweek   : weekjp[xdays],        // 曜日
                timSt       : new Date(year, month, dayCnt),         // 始業時間
                timEn       : new Date(year, month, dayCnt),         // 終業時間
                timBk       : new Date(year, month, dayCnt),         // 休憩時間
                holidayType : "",                   // 休暇種別
                note        : ""                    // 備考
                });
            $scope.calcWkTim($scope.work_table.length-1);
        }
    };

    // 労働時間テーブル生成
    $scope.createWorkTable = function(){
        //月末を取得 (次月の0日)
        let lastday = new Date($scope.thisYear, $scope.thisMonth, 0);
        lastday = lastday.getDate();

        // 16~月末
        $scope.setWorkTable($scope.thisYear, $scope.thisMonth-1, 16, lastday);
        // 1~15
        $scope.setWorkTable($scope.thisYear, $scope.thisMonth, 1, 15);

        // サーバに年月を通知
        socketio.emit("getReq_date_info", {"name" : $scope.staff_name,
                                    "year" : $scope.thisYear, 
                                    "month" : $scope.thisMonth+1});
    };

    // 月移動
    $scope.shiftMonth = function(shift){

        // 編集が破棄されることを通知
        if ($scope.changeFlag == true) {
            if (window.confirm('編集内容が破棄されます。よろしいですか？') == false) {
                return;
            }
        }
        // 月移動したら編集解除
        $scope.changeFlag = false;
        // ロック状態解除 -> テーブルデータ受信時に再度判定
        $scope.lock = false;

        // 指定された値ずれたDateを取得
        today = new Date($scope.thisYear, $scope.thisMonth + shift, 1);
        $scope.thisYear = today.getFullYear();
        $scope.thisMonth = today.getMonth();
        $scope.work_table = [];

        // 表示月が今月か判定
        if (($scope.thisYear == $scope.orgThisYear) && ($scope.thisMonth == $scope.orgThisMonth)) {
            $scope.showingOtherMongth = false;
        }
        else {
            $scope.showingOtherMongth = true;
        }

        // テーブル作成
        $scope.createWorkTable();
    };

    // 各時間の初期値設定（土日以外）
    $scope.setDefTim = function(type ,val){

        for(let index in $scope.work_table) {
            let obj = $scope.work_table[index];
            // 日付変更
            if ((obj.dayofweek != "土") && (obj.dayofweek != "日") && (true != judgeHoliday.isHoliday(obj.timSt))){
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
            $scope.wrap_calcWkTim(index);
        }
    };
    // 各曜日の背景色を返す
    $scope.getholidayStyle = function(dateObj){
        let ret = {};
        switch(dateObj.dayofweek) {
            case '土':
                ret = {background: '#b0c4de'};
                break;
            case '日':
                ret = {background: '#F5BCA9'};
                break;
            default:
                // 祝日判定
                if (true == judgeHoliday.isHoliday(dateObj.timSt)){
                    ret = {background: '#ffd700'};
                }
                else {
                    ret = {background: '#fffafa'};
                }
                break;
        }
        return ret;
    };
    // 各時間の背景色を返す
    $scope.getInputTimBackground = function(sumWkTim) {
        let ret = {};
        if (sumWkTim <= 0) {
            ret = {background :'#dcdcdc'};
        }
        else {
            ret = {background:'#ffffff'};
        }
        return ret;
    };

    // ユーザ選択時処理
    $scope.selectUser = function() {
        $scope.staff_name = $scope.selectedUser;
        for(let obj of $scope.userInfoList) {
            if (obj.name == $scope.staff_name) {
                $scope.staff_post = obj.post;
            }
        }
        // テーブル初期化
        $scope.work_table = [];
        // 今月の表示
        $scope.createWorkTable();
    }

    // ロック状態変化
    $scope.changeEditLock = function() {
        $scope.submit_workTable($scope.lock, false);
    }

    $scope.post_user = function() {
        // ユーザ名取得
        const request = new XMLHttpRequest();
        request.open("POST", `/user`);
        request.addEventListener("load", (event) => {
            userinfo = JSON.parse(event.target.responseText);
            // rootの場合、ユーザリストを取得する。
            if (userinfo.name == "root") {
                socketio.emit("getReq_user_list");
            }
            // 通常ユーザの場合、勤務表を表示する。
            else {
                $scope.staff_name = userinfo.name;
                $scope.staff_post = userinfo.post;
                // 今月の表示
                $scope.createWorkTable();
                $scope.$apply();
            }
        });
        request.send();
    }

    // 有給休暇数カウント
    $scope.countPaidVacation = function(){
        let count = 0;
        for(obj of $scope.work_table) {
            if (obj.holidayType == "有給休暇") {
                count += 1;
            }
        }
        return count;
    }
    // 休暇種別選択時処理
    $scope.selectHolidayType = function(index){
        
        let obj = $scope.work_table[index];

        if((obj.holidayType == "有給休暇") || (obj.holidayType == "忌引")){
            obj.timSt.setHours(9, 0, 0);
            obj.timEn.setHours(18, 0, 0);
            obj.timBk.setHours(1, 0, 0);

            obj.timSt = new Date(obj.timSt);
            obj.timEn = new Date(obj.timEn);
            obj.timBk = new Date(obj.timBk);
        }
        // 作業時間の計算
        $scope.wrap_calcWkTim(index);
    }

    // 出社ボタン処理
    $scope.click_btn_comming = function(){
    
        let today = new Date();
        today.setSeconds(0);
        today.setMilliseconds(0);

        // 30分刻みに丸める
        let minu = today.getMinutes();
        if ((minu > 0) && (minu <= 30)){
            today.setMinutes(30);
        }
        else {
            today.setMinutes(0);
            today.setHours(today.getHours()+1);
        }

        for (let index in $scope.work_table){
            if ($scope.work_table[index].day == $scope.orgThisDay) {
                $scope.work_table[index].timSt = today;
                // 作業時間の計算
                $scope.wrap_calcWkTim(index);
                break;
            }   
        }
    }

    // 退社ボタン処理
    $scope.click_btn_leaving = function(){
        let today = new Date();
        today.setSeconds(0);
        today.setMilliseconds(0);

        // 30分刻みに丸める
        let minu = today.getMinutes();
        if ((minu >= 0) && (minu < 30)){
            today.setMinutes(0);
        }
        else {
            today.setMinutes(30);
        }

        for (let index in $scope.work_table){
            if ($scope.work_table[index].day == $scope.orgThisDay) {
                $scope.work_table[index].timEn = today;
                // 作業時間の計算
                $scope.wrap_calcWkTim(index);
                break;
            }   
        }
    }

    // ダウンロード
    $scope.download_workTable = function(){
        let blob = new Blob(
            [
                $scope.staff_name, "\r\n",
                JSON.stringify($scope.work_table), "\r\n",
                "有給休暇日数: ", $scope.countPaidVacation(), "\r\n",
                "合計有給取得数: ", $scope.paidVacation, "\r\n",
                "作業合計時間: ", $scope.sumWkTim
            ], 
            { type: 'application\/json' });
        document.getElementById("download").href = window.URL.createObjectURL(blob);
    }

    // サーバに労働時間テーブルを送信する
    $scope.submit_workTable = function(lock, popup) {
        // tableにハッシュキーが入っているため、JSON形式に変換
        // DB登録用にkeyを付加する
        let jsonWorkTable = {"lock"         : lock,
                             "name"         : $scope.staff_name, 
                             "post"         : $scope.staff_post,
                             "year"         : $scope.thisYear, 
                             "month"        : $scope.thisMonth+1,
                             "sumWkTim"     : $scope.sumWkTim,
                             "paidVacation" : $scope.countPaidVacation(),
                             "table"        : JSON.parse(angular.toJson($scope.work_table))};
        socketio.emit("setReq_work_table_data", jsonWorkTable);
        if (popup) {
            alert('送信しました');
        }
        //送信後にも有給数更新する
        $scope.submit_paidVacation();
        // 編集なし
        $scope.changeFlag = false;
    };
    // 労働時間テーブル受信時処理
    socketio.on("getRes_date_info", function(tableData) {

        if (tableData != undefined) {
            // ロックされている場合、送信ボタン無効
            if (tableData.lock) {
                $scope.lock = tableData.lock;
            }
            // テーブル情報上書き
            $scope.work_table = tableData["table"];
            for (let obj of $scope.work_table) {
                // 文字列→Date型
                obj.timSt = new Date(obj.timSt);
                obj.timEn = new Date(obj.timEn);
                obj.timBk = new Date(obj.timBk);
            }
            // 合計時間計算
            $scope.calcSumWkTim();
            // 外部イベントで$scopeを変更しても反映されないため、強制的に更新。
            $scope.$apply();

            // 有給数更新
            $scope.submit_paidVacation();                    

        }
    });

    // ユーザリスト取得応答
    socketio.on("getRes_user_list", function(userInfoList) {
        $scope.userInfoList = userInfoList;
        for(let obj of userInfoList) {
            if (obj.name != "root") {
                $scope.userList.push(obj.name);
            }
        }
        $scope.$apply();
    });

    $scope.req_judgeHoliday = function() {
        return new Promise(function(resolve, reject){
            // 祝日判定用APIのrequire
            require(['judgeHoliday'], function(JudgeHoliday) {
                resolve(JudgeHoliday);
            });
        });
    }

    $scope.req_judgeHoliday().then(function(value){
        judgeHoliday = value;
        $scope.post_user();
    }).catch(function(err){
        console.log(err);
    });
}]);