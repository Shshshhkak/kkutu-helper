(function() {
    let wordList = [];
    // GitHub 업로드 후 이 URL을 실제 URL로 변경해야 합니다.
    let GITHUB_JSON_URL = 'https://raw.githubusercontent.com/Shshshhkak/kkutu-helper/refs/heads/main/words_full.json';

    const UI_ID = 'kkutu-helper-ui';
    const LOCAL_STORAGE_KEY = 'kkutu_words_custom';

    // 1. 데이터 로드
    async function init() {
        console.log('%c[끄투 도우미] 초기화 중...', 'color: #00ff00; font-weight: bold;');
        
        try {
            const response = await fetch(GITHUB_JSON_URL);
            if (!response.ok) throw new Error('Network response was not ok');
            wordList = await response.json();
            console.log(`[끄투 도우미] ${wordList.length}개의 단어를 불러왔습니다.`);
        } catch (e) {
            console.warn('[끄투 도우미] 서버에서 데이터를 가져오지 못했습니다. 로컬 데이터를 사용합니다.');
            const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (localData) wordList = JSON.parse(localData);
        }

        createUI();
        startObserving();
    }

    // 2. UI 생성
    function createUI() {
        if (document.getElementById(UI_ID)) return;
        const div = document.createElement('div');
        div.id = UI_ID;
        div.style = `
            position: fixed; top: 50px; right: 20px; z-index: 10000;
            width: 250px; background: rgba(30, 30, 30, 0.9);
            color: #fff; padding: 15px; border-radius: 10px;
            font-family: "Malgun Gothic", sans-serif; box-shadow: 0 4px 15px rgba(0,0,0,0.5);
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
