// ==UserScript==
// @name         끄투코리아 자동 플레이 (끝말잇기 + 단어 대결)
// @namespace    https://kkutu.co.kr
// @version      1.3
// @description  끝말잇기 & 단어대결 자동 입력 (game_input 우회)
// @author       Grok
// @match        https://kkutu.co.kr/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function () {
    'use strict';

    let autoPlayEnabled = true;
    let wordList = new Set();
    let usedWords = new Set();
    let lastInputTime = 0;

    // ==================== 단어장 로드 ====================
    async function loadWordDB() {
        // 좋은 공개 단어장 raw URL (필요시 더 추가)
        const urls = [
            'https://raw.githubusercontent.com/acidsound/korean_wordlist/master/wordslist.txt', // 기본 한글 단어장
            // 다른 단어장 raw URL 추가 가능
        ];

        for (let url of urls) {
            try {
                const res = await fetch(url);
                const text = await res.text();
                text.split('\n').forEach(line => {
                    const w = line.trim();
                    if (w.length >= 2 && /^[가-힣]+$/.test(w)) { // 한글만
                        wordList.add(w);
                    }
                });
            } catch (e) {
                console.warn("단어장 로드 실패:", url);
            }
        }
        console.log(`[AutoKkutu] 단어장 로드 완료 → ${wordList.size}개`);
    }

    // ==================== game_input 우회 입력 ====================
    function bypassInput(text) {
        if (Date.now() - lastInputTime < 600) return false; // 연속 입력 방지

        const input = document.querySelector('#hereText') || 
                     document.querySelector('input[type="text"]') || 
                     document.querySelector('.game-input');

        if (!input) return false;

        input.value = text;

        // 한 글자씩 keyup dispatch
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            const keyEvent = new KeyboardEvent('keyup', {
                key: char,
                code: `Key${char.toUpperCase()}`,
                keyCode: char.charCodeAt(0),
                which: char.charCodeAt(0),
                bubbles: true
            });
            input.dispatchEvent(keyEvent);
        }

        // Enter
        const enterEvent = new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true });
        input.dispatchEvent(enterEvent);

        console.log(`[AutoKkutu] 입력: ${text}`);
        usedWords.add(text);
        lastInputTime = Date.now();
        return true;
    }

    // ==================== 끝말잇기 단어 찾기 ====================
    function findWordForEndGame(lastChar) {
        let candidates = [];

        for (let word of wordList) {
            if (usedWords.has(word)) continue;
            if (word[0] === lastChar && word.length >= 2) {
                candidates.push(word);
            }
        }

        if (candidates.length === 0) return null;

        // 우선순위: 적당한 길이 (너무 짧거나 너무 길지 않게)
        candidates.sort((a, b) => {
            const scoreA = Math.abs(a.length - 4); // 4~5글자 선호
            const scoreB = Math.abs(b.length - 4);
            return scoreA - scoreB;
        });

        return candidates[0];
    }

    // ==================== 단어 대결 (Daneo) ====================
    function findWordForDaneo(hint) {
        let candidates = [];
        for (let word of wordList) {
            if (usedWords.has(word)) continue;
            if (word.includes(hint) || hint.includes(word[0])) { // 유연하게
                candidates.push(word);
            }
        }
        return candidates.length ? candidates[0] : null;
    }

    // ==================== 메인 루프 ====================
    function mainLoop() {
        if (!autoPlayEnabled) return;

        const here = document.querySelector('#hereText') || document.querySelector('input[placeholder]');
        if (!here) return;

        // 내 턴 판단 (클래스나 스타일로)
        const isMyTurn = document.querySelector('.my-turn') || 
                        here.style.display !== 'none' ||
                        document.querySelector('[class*="turn"]');

        if (!isMyTurn) return;

        let hint = here.placeholder || here.value || '';
        let lastChar = '';

        // 끝말잇기: 마지막 글자 추출
        if (hint.length > 0) {
            lastChar = hint[hint.length - 1]; // 끝말잇기 힌트
        }

        let bestWord = null;

        // 모드 판단
        if (lastChar && /^[가-힣]$/.test(lastChar)) {
            bestWord = findWordForEndGame(lastChar); // 끝말잇기
        } else {
            bestWord = findWordForDaneo(hint); // 단어 대결
        }

        if (bestWord) {
            bypassInput(bestWord);
        }
    }

    // ==================== 단축키 & 초기화 ====================
    document.addEventListener('keydown', e => {
        if (e.altKey && e.key.toLowerCase() === 'a') {
            autoPlayEnabled = !autoPlayEnabled;
            console.log(`[AutoKkutu] 자동 플레이 ${autoPlayEnabled ? 'ON' : 'OFF'}`);
        }
    });

    function init() {
        loadWordDB();
        setInterval(mainLoop, 650); // 체크 간격

        console.log('%c[끄투 자동] 끝말잇기+단어대결 버전 로드 완료 | Alt+A 토글', 'color:#00ff88; font-weight:bold');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
