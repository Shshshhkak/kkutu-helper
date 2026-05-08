(function() {
    let wordList = [];
    let attackWords = new Set();
    
    // GitHub URL - 실제 본인 계정 주소로 변경 필요
    const GITHUB_JSON_URL = 'https://raw.githubusercontent.com/Shshshhkak/kkutu-helper/refs/heads/main/words_full.json';
    const GITHUB_ATTACK_URL = 'https://raw.githubusercontent.com/Shshshhkak/kkutu-helper/main/attack_words.txt';

    const UI_ID = 'kkutu-helper-v2-ui';
    const LOCAL_STORAGE_KEY = 'kkutu_custom_words';

    // 1. 초기화 및 데이터 로드
    async function init() {
        console.log('%c[끄투 도우미 v2] 초기화 중...', 'color: #00ff00; font-weight: bold;');
        
        try {
            // 메인 단어 목록 로드
            const wordRes = await fetch(GITHUB_JSON_URL);
            wordList = await wordRes.json();
            
            // 공격/한방 단어 목록 로드 (예시 파일에서 추출한 데이터 기반)
            try {
                const attackRes = await fetch(GITHUB_ATTACK_URL);
                const attackText = await attackRes.text();
                attackWords = new Set(attackText.split('\n').map(s => s.trim()).filter(s => s));
            } catch(e) {
                console.warn('공격 단어 목록을 불러오지 못했습니다.');
            }

            console.log(`[끄투 도우미] ${wordList.length}개의 단어를 로드했습니다.`);
        } catch (e) {
            console.error('데이터 로드 실패. 로컬 데이터를 확인합니다.');
            const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (localData) wordList = JSON.parse(localData);
        }

        createUI();
        startObserver();
    }

    // 2. UI 생성
    function createUI() {
        if (document.getElementById(UI_ID)) return;
        const div = document.createElement('div');
        div.id = UI_ID;
        div.style = `
            position: fixed; top: 60px; right: 20px; z-index: 10000;
            width: 280px; background: rgba(20, 20, 20, 0.95);
            color: #fff; padding: 15px; border-radius: 12px;
            font-family: "Malgun Gothic", sans-serif; box-shadow: 0 8px 32px rgba(0,0,0,0.6);
            border: 1px solid #333; pointer-events: none;
        `;
        div.innerHTML = `
            <div style="font-weight: bold; font-size: 18px; margin-bottom: 12px; color: #00e676; border-bottom: 2px solid #00e676; padding-bottom: 8px; display: flex; justify-content: space-between;">
                <span>끄투 도우미 V2</span>
                <span style="font-size: 10px; color: #888;">Shshshhkak</span>
            </div>
            <div id="kkutu-suggestions-v2">
                <div style="color: #aaa; text-align: center; padding: 20px 0;">게임을 시작하면 추천이 표시됩니다.</div>
            </div>
        `;
        document.body.appendChild(div);
    }

    // 3. 추천 로직
    function suggest(currentLetter) {
        if (!currentLetter) return;
        
        // 두음법칙 적용 (필요 시)
        const filtered = wordList.filter(item => item.w.startsWith(currentLetter));
        
        // 1. 긴거 (길이순)
        const long = filtered.sort((a, b) => b.l - a.l).slice(0, 2);
        
        // 2. 공격 (공격 단어 목록에 포함되거나, 끝 글자가 어려운 것)
        const attack = filtered.filter(item => item.a || attackWords.has(item.w[item.w.length-1])).sort((a, b) => b.l - a.l).slice(0, 2);
        
        // 3. 한방 (다음 단어가 없는 것)
        const oneShot = filtered.filter(item => item.o).sort((a, b) => b.l - a.l).slice(0, 2);
        
        // 4. 일반 (랜덤)
        const normal = filtered.filter(item => !item.o && !item.a).sort(() => 0.5 - Math.random()).slice(0, 2);

        renderSuggestions(currentLetter, { long, attack, oneShot, normal });
    }

    function renderSuggestions(char, groups) {
        const container = document.getElementById('kkutu-suggestions-v2');
        if (!container) return;

        const html = `
            <div style="font-size: 15px; margin-bottom: 10px; background: #333; padding: 5px 10px; border-radius: 5px;">
                현재 글자: <span style="color: #ffeb3b; font-weight: bold;">${char}</span>
            </div>
            ${renderRow('긴거', groups.long, '#42a5f5')}
            ${renderRow('공격', groups.attack, '#ef5350')}
            ${renderRow('한방', groups.oneShot, '#ab47bc')}
            ${renderRow('일반', groups.normal, '#66bb6a')}
        `;
        container.innerHTML = html;
    }

    function renderRow(label, words, color) {
        return `
            <div style="margin-bottom: 8px;">
                <div style="color: ${color}; font-size: 12px; font-weight: bold; margin-bottom: 2px;">● ${label}</div>
                <div style="background: rgba(255,255,255,0.05); padding: 5px 8px; border-radius: 4px; font-size: 14px; min-height: 20px;">
                    ${words.length > 0 ? words.map(w => w.w).join(', ') : '<span style="color:#555">없음</span>'}
                </div>
            </div>
        `;
    }

    // 4. 감시 (MutationObserver)
    function startObserver() {
        let lastChar = "";
        let lastHistory = "";

        const observer = new MutationObserver(() => {
            // 1. 현재 글자 인식
            const currentElem = document.querySelector('.jjoriping-word-current');
            if (currentElem) {
                const char = currentElem.innerText.trim();
                if (char && char !== lastChar && char.length === 1) {
                    suggest(char);
                    lastChar = char;
                }
            } else {
                lastChar = "";
            }

            // 2. 단어 추가/삭제 (요청하신 기능 유지)
            const history = document.querySelectorAll('.jjoriping-word-history .word');
            if (history.length > 0) {
                const latest = history[history.length - 1].innerText.trim();
                if (latest && latest !== lastHistory) {
                    handleWordHistory(latest);
                    lastHistory = latest;
                }
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }

    function handleWordHistory(word) {
        // 단어가 목록에 없으면 추가
        if (!wordList.some(i => i.w === word)) {
            const lastChar = word[word.length - 1];
            const nextCount = wordList.filter(i => i.w.startsWith(lastChar)).length;
            const newItem = { w: word, l: word.length, o: nextCount === 0, a: nextCount < 5 };
            wordList.push(newItem);
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(wordList));
            console.log('[끄투 도우미] 새 단어 추가:', word);
        }
    }

    init();
})();            font-family: "Malgun Gothic", sans-serif; box-shadow: 0 4px 15px rgba(0,0,0,0.5);
            border: 1px solid #444; pointer-events: none;
        `;
        div.innerHTML = `
            <div style="font-weight: bold; font-size: 16px; margin-bottom: 10px; color: #ffcc00; border-bottom: 1px solid #555; padding-bottom: 5px;">
                끄투코리아 도우미
            </div>
            <div id="kkutu-suggestions">
                <div style="color: #aaa; font-style: italic;">게임을 시작하면 추천 단어가 표시됩니다.</div>
            </div>
            <div style="margin-top: 10px; font-size: 10px; color: #888; text-align: right;">
                자동 추가/삭제 활성화됨
            </div>
        `;
        document.body.appendChild(div);
    }

    // 3. 단어 추천
    function suggestWords(currentLetter) {
        if (!currentLetter) return;
        
        const filtered = wordList.filter(item => item.w.startsWith(currentLetter));
        
        const long = filtered.sort((a, b) => b.l - a.l).slice(0, 2);
        const attack = filtered.filter(item => item.a && !item.o).sort((a, b) => b.l - a.l).slice(0, 2);
        const oneShot = filtered.filter(item => item.o).sort((a, b) => b.l - a.l).slice(0, 2);
        const normal = filtered.filter(item => !item.a && !item.o).sort((a, b) => 0.5 - Math.random()).slice(0, 2);

        const container = document.getElementById('kkutu-suggestions');
        if (!container) return;

        const renderSet = (title, words, color) => `
            <div style="margin-top: 8px;">
                <span style="color: ${color}; font-weight: bold;">[${title}]</span>
                <div style="padding-left: 5px; font-size: 13px;">
                    ${words.length > 0 ? words.map(i => i.w).join(', ') : '<span style="color:#666">없음</span>'}
                </div>
            </div>
        `;

        container.innerHTML = `
            <div style="font-size: 14px; margin-bottom: 5px;">현재 글자: <span style="color: #00ff00; font-weight: bold;">${currentLetter}</span></div>
            ${renderSet('긴거', long, '#5dade2')}
            ${renderSet('공격', attack, '#ec7063')}
            ${renderSet('한방', oneShot, '#af7ac5')}
            ${renderSet('일반', normal, '#58d68d')}
        `;
    }

    // 4. 단어 추가/삭제 로직
    function addWord(word) {
        if (!word || word.length < 2) return;
        if (!wordList.some(item => item.w === word)) {
            const lastChar = word[word.length - 1];
            const nextWordsCount = wordList.filter(item => item.w.startsWith(lastChar)).length;
            
            const newWord = {
                w: word,
                l: word.length,
                o: nextWordsCount === 0,
                a: nextWordsCount < 5
            };
            wordList.push(newWord);
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(wordList));
            console.log(`[끄투 도우미] 새 단어 추가: ${word}`);
        }
    }

    function removeWord(word) {
        const index = wordList.findIndex(item => item.w === word);
        if (index !== -1) {
            wordList.splice(index, 1);
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(wordList));
            console.log(`[끄투 도우미] 잘못된 단어 삭제: ${word}`);
        }
    }

    // 5. DOM 감시
    function startObserving() {
        let lastProcessedWord = "";
        const observer = new MutationObserver(() => {
            // 현재 차례 글자 감지
            const currentElem = document.querySelector('.jjoriping-word-current');
            if (currentElem) {
                const char = currentElem.innerText.trim();
                if (char && char.length === 1) suggestWords(char);
            }

            // 입력된 단어 역사 감지 (추가용)
            const historyWords = document.querySelectorAll('.jjoriping-word-history .word');
            if (historyWords.length > 0) {
                const lastWord = historyWords[historyWords.length - 1].innerText.trim();
                if (lastWord && lastWord !== lastProcessedWord) {
                    addWord(lastWord);
                    lastProcessedWord = lastWord;
                }
            }

            // 단어 거부 감지 (삭제용)
            // 끄투코리아에서 단어가 거부될 때 나타나는 애니메이션이나 클래스를 타겟팅
            const errorWord = document.querySelector('.jjoriping-word-error'); // 가상의 선택자, 실제 확인 필요
            if (errorWord) {
                const word = errorWord.innerText.trim();
                if (word) removeWord(word);
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }

    init();
})();
