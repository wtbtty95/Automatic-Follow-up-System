// ==UserScript==
// @name         LinkedIn 自動つながり申請システムpart2(at keyword search page)
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  This script allows you to increase your LinkedIn connections efficiently at keyword search page (People).
// @author       Tatsuya Watabe
// @match        https://www.linkedin.com/mynetwork/
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    var setIntervalId;
    const COUNT_KEY = 'count2';
    var COUNT_LIMIT = 10;
    if (localStorage.getItem('count1') < 4) {
        localStorage.removeItem('count1');
        COUNT_LIMIT = 20;
    } else if (localStorage.getItem('count1') == null) {
        COUNT_LIMIT = 20;
    }
    console.log(COUNT_LIMIT);
    //申請したいプロフィール情報内のワードリスト
    //ワードを追加したい場合は、配列に追加してください
    const TUNAGARI_LIST = [
        "人事",
        "CEO",
        "ceo",
        "取締役",
        "PM",
        "pm",
        "プロジェクトマネージャー",
        "会長",
    ];

    var isCuurentPageSearchResultPage = () => {
        // 検索結果のURLが一致していたらtrue判定をする
        return window.location.href.toLocaleLowerCase().indexOf('mynetwork/') != 1
    }

    //以下、ある文字列をプロフィールに含むアカウントに対して、「つながり申請」を実施する処理を記述
    var initAutoConnector = () => {
        if (localStorage.getItem(COUNT_KEY) == null) {
            localStorage.setItem(COUNT_KEY, 0);
        }

        //表示されたページ上のhtml要素（document）から引数に入っているクラスを見つけてそれを配列形式で該当した全てを変数に代入
        //プロフィールカード一枚の全ての要素を取得（配列で入ってます）
        var list = document.querySelectorAll('li[class="discover-fluid-entity-list--item"]');
        //変数宣言（配列で）
        var connectButtons = [];
        console.log(list);
        //list(プロフィールカードの要素)に入っている配列の数をlengthで取得し、その数より大きくなるまでループ（取得してきたカードを全て見るため）
        //ただし、配列に対して「innerText」は実施できないため、さらに配列から特定の要素を取り出し、変数（button）に格納
        for (var i = 0; i < list.length; i++) {
            //プロフィールの中の「つながり申請」ボタンを格納するための処理
            var button = list[i].getElementsByClassName('artdeco-button artdeco-button--2 artdeco-button--secondary ember-view full-width')[0];
            console.log(button);
            //innerTextでHTML要素の<開始タグ>と<終了タグ>に内包されたテキストを取得->さっきquerySelectorAllで取得したやつのテキストにConnectがあるか
            //上記で取得したbuttonの中に「つながり申請」があれば、プロフィールに特定文字列（TUNAGARI_LIST）がないか見に行く処理を記述
            if (button.innerText == 'つながりを申請') {
                //プロフィールの中の「ある特定の文字列(TUNAGARI_LIST）が入った要素」を格納するための処理
                var profile = list[i].getElementsByClassName('discover-person-card__occupation t-14 t-black--light t-normal')[0];
                //上記で取得してきた要素に対して、TUNAGARI_LISTの文字列が含まれているか確認するための処理
                //TUNAGARI_LISTの中に一つでも該当するものがあれば処理を一回のみ実行（foreachではなくsome使うよ）
                var total = 0;
                TUNAGARI_LIST.some(value => {
                    var result = profile.innerText.indexOf(value);
                    total += Number(result);
                    console.log(result);
                    if (result !== -1) {
                        //含まれていれば、自動押下するためのボタンに取得したプロフィールカードのつながり申請ボタンの要素を格納
                        connectButtons.push(button);
                        console.log(connectButtons);
                        return true;
                    }
                    if (total == TUNAGARI_LIST.length * -1) {
                        var cancelButton = list[i].getElementsByClassName('artdeco-button artdeco-button--circle artdeco-button--muted artdeco-button--1 artdeco-button--tertiary ember-view artdeco-card__dismiss')[0];
                        cancelButton.click();
                    }
                })

            }
        }


        //0から300までのランダムな整数を取得する。
        //間隔を変えることで、自動化を検出されないように。
        var getRandomInteger = () => {
            var min = 900;
            var max = 9000;
            //Math.floor(x)・・・引数で渡した数値の小数点を切り捨てる。
            //Math.random()・・・0以上1未満の乱数を生成する。
            return Math.floor(Math.random() * (max + 1 - min)) + min;
        }

        var connectButtonCount = 0

        var connectButtonOperation = () => {

            if (document.getElementById('ip-fuse-limit-alert__header') == null) {
                try {

                    if (Number(localStorage.getItem(COUNT_KEY)) < COUNT_LIMIT) {

                        if (connectButtonCount < connectButtons.length) {

                            connectButtons[connectButtonCount].click();
                            connectButtonCount++;
                            //上限値に比べて現状何回「つながり申請」のボタンを押下したか見るためのもの
                            localStorage.setItem(COUNT_KEY, Number(localStorage.getItem(COUNT_KEY)) + 1);

                        } else {
                            console.log('already clicked all connect buttons');
                            clearInterval(setIntervalId);
                            //コネクトボタンがない場合、次の結果ページに移動する。
                            var currentUrl = window.location.href;
                            setTimeout(() => { window.location.href = currentUrl }, 5000)

                        }
                    } else {
                        clearInterval(setIntervalId);
                        localStorage.removeItem(COUNT_KEY);
                        throw new Error('１０人に申請が完了したためシステムを終了しました');
                    }
                } catch (e) {
                    alert(e.message);
                    window.location.href = 'https://www.linkedin.com/feed/';
                }
            } else {
                clearInterval(setIntervalId);
                localStorage.removeItem(COUNT_KEY);
                alert('つながりリクエストの1週間の上限に達したため、システムを終了しました');
                window.location.href = 'https://www.linkedin.com/feed/';
            }
        }
        //setInterval…一定時間ごとに特定の処理を繰り返す
        //setInterval(関数,処理間隔)
        //第一引数に与えられた関数を、第二引数に与えられた間隔で実行する。処理間隔の単位はミリ秒
        setIntervalId = setInterval(connectButtonOperation, 6000 + getRandomInteger()); //ここでconnectButtonOperationの関数が走る
    }

    if (isCuurentPageSearchResultPage()) {
        console.log('Found "つながり申請" buttons. Startsing automatically conectiong...');

        function scrollDown(y) {
            setTimeout(function () {
                window.scrollTo({ top: y + 100 })
            }, 1000);
        }

        function setTimeoutForInitAutoConnector() {
            setTimeout(function () {
                //window.alert("initAutoConnector");
                const element = document.getElementsByClassName('mn-discovery__header artdeco-card__header');
                //glob_key++;
                const y = element[0].getBoundingClientRect().top + window.pageYOffset + 100;
                //element[0].scrollIntoView();
                window.scrollTo({ top: y, behavior: 'smooth' });
                scrollDown(y);
                setTimeout(function () {
                    initAutoConnector();
                }, 7000);
            }, 8000);
        }
        window.onload = setTimeoutForInitAutoConnector();
    } else {
        console.log('Could not find "Connect" buttons. This page may not be search result page.');
    }
    //DOMにオートコネクターバー要素を追加する。
    var initACBar = () => {
        var autoconnectStopButton = document.createElement('div');
        autoconnectStopButton.innerHTML = `<span id='ACstatus'>自動でつながり申請中です...</span><p id='ACstopButton'>停止したい場合こちらをクリック</p>`
        var css = (prop, value) => {
            autoconnectStopButton.style[prop] = value;
        }

        css('width', '23%')
        css('height', '95px')
        css('backgroundColor', 'white')
        css('color', '#0178B5')
        css('border', '2px solid #0178B5')
        css('borderRadius', '10px')
        css('textAlign', 'center')
        css('textHeight', '10px')
        css('position', 'fixed')
        css('bottom', '5%')
        css('left', '1%')
        css('zIndex', '10000')

        document.body.appendChild(autoconnectStopButton);
        document.getElementById('ACstopButton').style.margin = '10px';


        autoconnectStopButton.onclick = () => {
            clearInterval(setIntervalId);
            css('backgroundColor', '#c8c8c8')
            document.getElementById('ACstatus').innerText = '自動申請を無効化しました';
            document.getElementById('ACstopButton').innerText = '再度自動化を実行するには、ページを更新してください';
        }

    }

    initACBar();

})();