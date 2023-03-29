// ==UserScript==
// @name         LinkedIn 自動つながり申請システムpart1(at keyword search page)
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  This script allows you to increase your LinkedIn connections efficiently at keyword search page (People).
// @author       Tatsuya Watabe
// @match        https://www.linkedin.com/search/results/people/*
// @grant        none
// ==/UserScript==
(function () {
    'use strict';

    var pageIndex;
    var setIntervalId;
    const COUNT_KEY = 'count1';
    const COUNT_LIMIT = 10;
    var isCuurentPageSearchResultPage = () => {
        // 検索結果のURLが一致していたらtrue判定をする
        return window.location.href.toLocaleLowerCase().indexOf('search/results/people/') != 1;
    }

    if (isCuurentPageSearchResultPage()) { // trueの場合
        //elmにはsplit(&)したやつが配列で入っているのでそれを順番にif文で確認していく
        window.location.href.split('&').forEach(elm => {
            //eleに入っているやつに、page=　という文字列があればif分の中身を実行
            if (elm.indexOf('page=') != -1) {
                //page= の文字列の長さをlengthで取得。ようはこれで５という数字を取得。
                var start = 'page='.length;
                //elmをさっき取得した5でslice ->elmの中身を５番目のやつから取得。
                pageIndex = parseInt(elm.slice(start));
                console.log('pageIndex', pageIndex);
            }
        })
        //上のif文が実行されなかった場合こっちが実行される。現在のURLの後ろに&page=1がついたURLに遷移させる。
        if (!pageIndex) {
            window.location.href += '&page=1';
        }

    }

    var initAutoConnector = () => {
        if (localStorage.getItem(COUNT_KEY) == null) {
            localStorage.setItem(COUNT_KEY, 0);
        }

        //表示されたページ上のhtml要素（document）から引数に入っているクラスを見つけてそれを配列形式で該当した全てを変数に代入
        var connectButtonCandidates = document.querySelectorAll('button[class="artdeco-button artdeco-button--2 artdeco-button--secondary ember-view"]');
        //変数宣言（配列で）
        var connectButtons = [];
        console.log(connectButtonCandidates);
        //コネクトボタンのみを取得
        //connectButtonCandidatesに入っている配列の数をlengthで取得し、その数より大きくなるまでループ
        for (var i = 0; i < connectButtonCandidates.length; i++) {
            //console.log('Button condition', connectButtonCandidates[i].innerText)
            //innerTextでHTML要素の<開始タグ>と<終了タグ>に内包されたテキストを取得->さっきquerySelectorAllで取得したやつのテキストに'つながりを申請'というワードがあるか
            if (connectButtonCandidates[i].innerText == 'つながりを申請') {
                //変数connectButtonsにi番目のconnectButtonCandidatesを追加
                connectButtons.push(connectButtonCandidates[i]); // Node Listが入ってくる？？
            };
        }


        //900から9000の範囲のランダムな整数を取得
        //間隔を変えることで、自動化を検出されないように。
        var getRandomInteger = () => {
            var min = 900;
            var max = 9000;
            //Math.floor(x)・・・引数で渡した数値の小数点を切り捨てる。
            //Math.random()・・・0以上1未満の乱数を生成する。
            return Math.floor(Math.random() * (max + 1 - min)) + min;
        }

        var connectButtonCount = 0;

        var connectButtonOperation = () => {

            if (document.getElementById('ip-fuse-limit-alert__header') == null) {
                try {
                    if (Number(localStorage.getItem(COUNT_KEY)) < COUNT_LIMIT) {

                        if (connectButtonCount < connectButtons.length) {
                            connectButtons[connectButtonCount].click();

                            setTimeout(() => {
                                var cancel = document.querySelector('button[class="artdeco-button artdeco-button--2 artdeco-button--primary ember-view ml1"]');
                                if (cancel) {
                                    console.log('sendInvitationElement exists', cancel);
                                    //✖️ボタンを自動でクリックする
                                    cancel.click();
                                }
                                connectButtonCount++;
                                localStorage.setItem(COUNT_KEY, Number(localStorage.getItem(COUNT_KEY)) + 1);
                            }, getRandomInteger())

                        } else {
                            console.log('already clicked all connect buttons');
                            clearInterval(setIntervalId);
                            //コネクトボタンがない場合、次の結果ページに移動する
                            var currentUrl = window.location.href;

                            //.replace( 対象の文字, 置換する文字 )
                            //現在のURLのpage=をプラス１したやつにする
                            if (document.getElementsByClassName('ivm-view-attr__img--centered ivm-view-attr__img  lazy-image ember-view') == null) {
                                var nextPageUrl = currentUrl.replace(`page=${pageIndex}`, `page=${pageIndex + 1}`);
                                //５秒後に次のページに遷移
                                setTimeout(() => { window.location.href = nextPageUrl }, 5000);
                            } else {
                                clearInterval(setIntervalId);
                                window.location.href = 'https://www.linkedin.com/mynetwork/';
                            }
                        }
                    } else {
                        //１０人申請したらエラーを投げかけて処理を強制終了させる
                        clearInterval(setIntervalId);
                        localStorage.removeItem(COUNT_KEY);
                        throw new Error('１０人に申請が完了したため自動申請を終了しました');
                    }
                } catch (e) {
                    window.location.href = 'https://www.linkedin.com/mynetwork/';
                    alert(e.message);
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
        setIntervalId = setInterval(connectButtonOperation, 6000 + getRandomInteger());//ここでconnectButtonOperationの関数が走る

    }

    // 検索結果のURLの場合に、initAutoConnectorという関数を走らせる
    if (isCuurentPageSearchResultPage()) {
        console.log('Found "つながり申請" buttons. Startsing automatically conectiong...');
        //window（ページ全体）の読み込みが完了した時にinitAutoConnectorを実行する。
        window.onload = () => { initAutoConnector() }
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