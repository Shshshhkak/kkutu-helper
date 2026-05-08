// ==UserScript==
// @name         끄투 자동화 봇 V2 (대용량 사전 지원)
// @namespace    http://tampermonkey.net/
// @version      2.0.0
// @description  외부 JSON 사전을 사용하여 끄투 게임을 자동으로 플레이합니다. 개인 서버 전용!
// @author       Manus AI
// @match        http://localhost:*/*
// @match        http://127.0.0.1:*/*
// @match        http://YOUR_SERVER_ADDRESS/*
// @grant        GM_xmlhttpRequest
// @connect      raw.githubusercontent.com
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    // ============================================
    // 설정 섹션
    // ============================================
    
    const ALLOWED_HOSTS = [
        'localhost,
        '127.0.0.1',
        'kkutu.co.kr' // 본인 사이트 주소로 변경
    ];
    
    const WORD_DATA_URL = 'https://raw.githubusercontent.com/Shshshhkak/kkutu-helper/refs/heads/main/words_full.json';

    // 현재 호스트 확인
    const currentHost = window.location.hostname;
    if (!ALLOWED_HOSTS.includes(currentHost)) {
        console.warn('[끄투봇] 공용 서버에서는 작동하지 않습니다. 개인 서버에서만 사용하세요.');
        return;
    }

    // ============================================
    // 전역 변수 및 상태
    // ============================================
    
    let wordList = [];
    let isDataLoaded = false;
    let isOnMacro = true;
    let usedWords = [];
    let canResetWords = true;
    let lastWord = '';
    let delay = 100;

    // ============================================
    // 데이터 로딩
    // ============================================

    function loadWordData() {
        console.log('[끄투봇] 단어 데이터를 불러오는 중...');
        
        GM_xmlhttpRequest({
            method: 'GET',
            url: WORD_DATA_URL,
            onload: function(response) {
                try {
                    wordList = JSON.parse(response.responseText);
                    isDataLoaded = true;
                    console.log(`[끄투봇] 단어 데이터 로드 완료! (총 ${wordList.length}개)`);
                } catch (e) {
                    console.error('[끄투봇] 데이터 파싱 오류:', e);
                }
            },
            onerror: function(err) {
                console.error('[끄투봇] 데이터 로드 실패:', err);
            }
        });
    }

    // ============================================
    // 핵심 로직
    // ============================================

    function getCurrentWord() {
        try {
            const elements = document.getElementsByClassName('jjo-display ellipse');
            if (elements && elements.length > 0) {
                return elements[0].innerHTML.trim();
            }
        } catch (e) {}
        return '';
    }

    function findBestWord(startChar) {
        if (!isDataLoaded || !startChar) return null;

        // 괄호 처리 (예: 륙(육) -> 륙)
        let targetChar = startChar;
        let altChar = null;
        
        if (startChar.includes('(')) {
            targetChar = startChar.substring(0, 1);
            altChar = startChar.substring(2, 3);
        }

        // 필터링: 시작 글자 일치 + 미사용 단어 + '다'로 끝나지 않음 + 특수문자 제외
        let candidates = wordList.filter(word => {
            const startsWith = word.startsWith(targetChar) || (altChar && word.startsWith(altChar));
            return startsWith && 
                   !usedWords.includes(word) && 
                   !word.endsWith('다') &&
                   !/[^가-힣]/.test(word); // 한글만 허용
        });

        if (candidates.length === 0) return null;

        // 전략: 가장 긴 단어 우선
        candidates.sort((a, b) => b.length - a.length);

        // 상위 3개 중 랜덤 선택 (탐지 회피)
        const range = Math.min(candidates.length, 3);
        return candidates[Math.floor(Math.random() * range)];
    }

    function sendWord(word) {
        try {
            usedWords.push(word);
            lastWord = word;

            const inputBoxes = document.querySelectorAll('[maxlength="200"]');
            if (inputBoxes && inputBoxes.length > 1) {
                const input = inputBoxes[1];
                
                // 한 글자씩 입력 시뮬레이션 (Anti-cheat 대응)
                input.value = '';
                let i = 0;
                const typeInterval = setInterval(() => {
                    if (i < word.length) {
                        input.value += word[i];
                        i++;
                    } else {
                        clearInterval(typeInterval);
                        // 전송 버튼 클릭
                        const sendBtn = document.querySelector('#ChatBtn');
                        if (sendBtn) sendBtn.click();
                        console.log('[끄투봇] 전송 완료:', word);
                    }
                }, Math.random() * 50 + 50);
            }
        } catch (e) {
            console.error('[끄투봇] 전송 오류:', e);
        }
    }

    // ============================================
    // 루프 및 제어
    // ============================================

    function mainLoop() {
        if (!isDataLoaded || !isOnMacro) return;

        try {
            const gameInput = document.getElementsByClassName('game-input');
            if (gameInput && gameInput[0] && gameInput[0].style.display === 'block') {
                const currentWord = getCurrentWord();
                
                if (currentWord && currentWord !== lastWord && currentWord.length === 1) {
                    console.log('[끄투봇] 내 차례! 제시어:', currentWord);
                    
                    // 생각하는 척 딜레이
                    setTimeout(() => {
                        const bestWord = findBestWord(currentWord);
                        if (bestWord) {
                            sendWord(bestWord);
                        } else {
                            console.log('[끄투봇] 단어를 찾지 못했습니다.');
                            lastWord = currentWord; // 중복 시도 방지
                        }
                    }, Math.random() * 1000 + 500);
                }
            }
        } catch (e) {}
    }

    // 라운드 종료 감지 (체인 수 확인)
    function checkRoundEnd() {
        try {
            const chainEl = document.getElementsByClassName('chain')[0];
            if (chainEl) {
                const chain = parseInt(chainEl.textContent);
                if (chain === 0 && canResetWords) {
                    usedWords = [];
                    lastWord = '';
                    canResetWords = false;
                    console.log('[끄투봇] 라운드 종료 - 기록 초기화');
                } else if (chain > 0) {
                    canResetWords = true;
                }
            }
        } catch (e) {}
    }

    // 명령어 처리
    function checkCommands() {
        const input = document.querySelectorAll('[maxlength="200"]')[1];
        if (!input) return;
        
        const val = input.value.trim();
        if (val === '/a') { isOnMacro = true; input.value = ''; console.log('[끄투봇] 매크로 ON'); }
        else if (val === '/s') { isOnMacro = false; input.value = ''; console.log('[끄투봇] 매크로 OFF'); }
    }

    // 초기화
    loadWordData();
    setInterval(mainLoop, 200);
    setInterval(checkRoundEnd, 500);
    setInterval(checkCommands, 500);

})();
