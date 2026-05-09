// ==UserScript==
// @name         끄투코리아 화학 단어 자동 입력기 (최종 확장판)
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  화학 단어 대결 전용, 150개 이상의 긴 단어 포함 및 탐지 회피 강화
// @author       Manus
// @match        https://kkutu.co.kr/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // 확장된 화학 단어 데이터베이스
    const chemWords = [
        "니코틴아마이드아데닌다이뉴클레오타이드", "니코틴아미드아데닌디뉴클레오티드", "클로로트리플루오로에틸렌중합체", "마그네슘옥시클로라이드시멘트", "아크릴로나이트릴스타이렌수지",
        "트라이메틸렌트라이나이트라민", "사이클로헥실설파민산나트륨", "아데노신트라이포스파테이스", "아스파르트산탈암모니아효소", "제조용기체크로마토그래피법",
        "나이트릴로트라이아세트산", "다이아세트산에틸렌글리콜", "분취기체크로마토그라프법", "분취기체크로마토그래피법", "비대칭다이메틸하이드라진",
        "사이클로올레핀계탄화수소", "시클로헥실술파민산나트륨", "아말감농축폴라로그라프법", "아데노신트리포스파타아제", "아스파트산탈암모니아효소",
        "아크릴로니트릴스티렌수지", "얇은층젤크로마토그래피법", "얇은층겔크로마토그라프법", "에리오크로뮴사이아닌아르", "에틸렌다이아민사아세트산",
        "이온교환크로마토그라프법", "폴리테트라플루오로에틸렌", "글리세린다이아세테이트", "기체크로마토질량분석법", "다이메틸아미노안티피린",
        "다이사이안다이아마이드", "다이클로로플루오레세인", "디개미산글리콜에스테르", "리액터그레이드지르코늄", "린산트리크레질에스테르",
        "박막농축폴라로그라프법", "불포화폴리에스테르수지", "스타이렌계이온교환수지", "스타이렌뷰타다이엔고무", "시클로올레핀계탄화수소",
        "시클로파라핀계탄화수소", "아세틸콜린에스터레이스", "아세틸콜린에스테라아제", "아이오딘화칼륨녹말용액", "아이오딘화칼륨녹말종이",
        "아이오딘화칼륨전분용액", "약염기성음이온교환수지", "에틸렌디아민사아세트산", "카르복시메틸셀룰로오스", "타르타르산안티모닐칼륨",
        "트리메틸렌트리니트라민", "파라하이드록시아조벤젠", "포도술산칼리움나트리움", "폴리에스테르계합성섬유", "하이드록시하이드로퀴논",
        "헥사사이아노철삼산칼륨", "헥사사이아노철이산칼륨", "고주파폴라로그라프법", "글리세린디아세테이트", "나이트릴로트라이초산",
        "네모파폴라로그래피법", "뇨소포름알데히드수지", "다이나이트로나프탈렌", "다이나이트로레조시놀", "다이메틸나이트로사민",
        "다이뷰틸프탈레이트", "다이아이소사이아네이트", "다이클로로벤젠", "다이클로로에탄", "다이클로로메탄",
        "다이페닐아민", "다이페닐카바존", "디나이트로나프탈린", "디메틸니트로사민", "디메틸포름아미드",
        "디부틸프탈레이트", "디아이소시아네이트", "디클로로벤젠", "디클로로에탄", "디클로로메탄",
        "디페닐카르바존", "레이온계합성섬유", "메틸아이소뷰틸케톤", "메틸에틸케톤", "무수프탈산",
        "방향족탄화수소", "벤젠설폰산나트륨", "비결정성탄소", "비닐리덴클로라이드수지", "비대칭디메틸히드라진",
        "사이클로알케인", "사이클로알카인", "사이클로알칸", "사이클로파라핀계탄화수소", "산성음이온교환수지",
        "소듐아세테이트", "수산화알루미늄", "수산화칼슘", "수산화칼륨", "스테아르산나트륨",
        "시클로알칸", "시클로알켄", "시클로알킨", "아디프산", "아세토니트릴",
        "아세트산나트륨", "아세트산에틸", "아세트알데히드", "아세톤", "아스파탐",
        "아스피린", "아크릴산", "아크릴로니트릴", "알루미늄", "알코올",
        "암모니아", "에탄올", "에탄", "에틸렌", "에틸렌글리콜",
        "염화나트륨", "염화칼슘", "염화칼륨", "염화수소", "옥살산",
        "요소", "이산화탄소", "이산화황", "일산화탄소", "일산화질소",
        "질산", "질산나트륨", "질산칼륨", "질산암모늄", "질소",
        "탄산", "탄산나트륨", "탄산수소나트륨", "탄산칼슘", "탄소",
        "테트라클로로에틸렌", "톨루엔", "페놀", "포름알데히드", "포도당",
        "프로판", "프로필렌", "프루시안블루", "플루오린", "피리딘",
        "하이드라진", "헬륨", "황", "황산", "황산나트륨",
        "황산칼륨", "황산암모늄", "황산구리", "황화수소", "희토류"
    ];

    console.log("끄투 화학 매크로 (확장판) 로드 완료");

    function safeInput(element, text) {
        if (!element) return;
        element.value = text;
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));

        // 서버 측 키 입력 카운트(_tcnt) 우회
        for (let i = 0; i < text.length + 2; i++) {
            element.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, keyCode: 65 }));
        }

        // 엔터 입력
        const enterDown = new KeyboardEvent('keydown', { bubbles: true, keyCode: 13, which: 13 });
        const enterUp = new KeyboardEvent('keyup', { bubbles: true, keyCode: 13, which: 13 });
        element.dispatchEvent(enterDown);
        element.dispatchEvent(enterUp);
    }

    setInterval(() => {
        try {
            const inputField = document.querySelector('input[id^="UserMassage"]');
            if (!inputField) return;

            const isMyTurn = inputField.placeholder.includes("당신의 차례") || 
                             document.body.innerText.includes("당신의 차례");

            if (isMyTurn) {
                const currentWordElem = document.querySelector('.current-word') || 
                                       document.querySelector('.target-word');
                
                let startChar = "";
                if (currentWordElem) {
                    const fullText = currentWordElem.innerText.trim();
                    startChar = fullText.charAt(fullText.length - 1);
                }

                // 시작 글자에 맞는 단어 중 가장 긴 단어 선택
                let matches = startChar ? chemWords.filter(w => w.startsWith(startChar)) : chemWords;
                matches.sort((a, b) => b.length - a.length);

                let targetWord = matches.length > 0 ? matches[0] : chemWords[Math.floor(Math.random() * chemWords.length)];

                if (targetWord) {
                    setTimeout(() => {
                        safeInput(inputField, targetWord);
                    }, 600 + Math.random() * 400);
                }
            }
        } catch (e) {}
    }, 2000);

    // 복사 붙여넣기 방지 해제
    window.addEventListener('paste', (e) => e.stopImmediatePropagation(), true);
    window.addEventListener('drop', (e) => e.stopImmediatePropagation(), true);

})()
