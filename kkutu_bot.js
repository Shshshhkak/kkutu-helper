



// ================= 설정 구간 =================
const ID = '레벨 끄투 봇';  // 자신의 끄투 닉네임으로 변경하세요

// 공격 단어 리스트
const attack_words = `3
4
ⓚ
갏
갗
걋
걔
겊
겠
겿
곻
굠
궃
궝
귐
긑
긶
긿
깆
깥
깸
껸
껼
꼇
꼍
꾜
꿑
뀜
뀨
끠
났
낵
냏
냑
냔
냘
넁
넠
녆
녘
놔
뇸
눔
늄
닺
덟
뎬
돓
됵
뒿
듈
듐
듥
듧
듫
땽
떴
뗌
똔
똠
뜅
뜩
뜹
랖
럴
럽
럿
렁
렛
렝
롼
룀
뤂
뤠
륀
륄
륨
릏
릐
맣
먕
뮨
뮬
뮴
믁
믏
믐
밇
및
벹
볃
볌
볜
봊
봏
봠
붏
붖
붚
뷸
븀
븐
븜
빋
빕
빱
뺏
뼌
뿐
뿟
쁘
쁜
쁨
삣
샄
샥
섴
솣
숡
숰
숳
슉
슌
슛
슨
싕
싥
싴
싶
쌓
쎈
쎔
쑴
씃
않
앚
앝
얒
얗
얫
얶
었
엋
엌
엣
였
옄
옙
옺
왐
왔
욤
욷
웆
웝
윅
윰
읃
읅
읆
읋
읒
읓
읔
읕
읖
읗
잫
졌
졎
죌
즑
짇
짗
쨔
쨤
쨩
쩐
쩰
쫓
쬬
쬰
쭘
쯘
쯤
찮
쳅
쳡
쳤
촨
춧
츌
츨
츳
칮
캣
컽
켁
켓
켸
콫
쾃
쿄
큔
큭
탉
탓
탸
텋
텝
텨
텹
톹
퇘
튠
튬
틋
틤
팁
펫
퓸
픈
픔
픠
픳
핌
핥
훕
휵
흿`.split('\n').filter(w => w.trim());

// 단어 사전 생성
const WORD_DICT = {};
attack_words.forEach(word => {
    const first = word[0];
    if (!WORD_DICT[first]) WORD_DICT[first] = [];
    WORD_DICT[first].push(word);
});

// =============================================

function get_now_syllable() {
    try {
        // 끄투 화면에서 단어가 표시되는 요소의 클래스명 (보통 'kw' 또는 특정 div)
        // 사이트 업데이트에 따라 'div.kw' 등으로 변경될 수 있습니다.
        const element = document.querySelector('.kw');
        let text = element.textContent.trim();
        
        // '이(리)'와 같은 형태 처리
        if (text.includes('(')) {
            text = text.split('(')[0];
        }
        return text;
    } catch {
        return null;
    }
}

function attack(start_syllable) {
    // 단어장에서 시작 음절에 맞는 단어 찾기
    const words = WORD_DICT[start_syllable];
    if (!words) {
        console.log(`'${start_syllable}'로 시작하는 단어를 찾을 수 없습니다.`);
        return;
    }

    const target_word = words[0]; // 첫 번째 단어 선택 (랜덤이나 긴 단어 선택 로직 추가 가능)
    
    try {
        // 입력창 찾기 (보통 id가 'talk'인 input 요소)
        const input_box = document.getElementById('talk');
        input_box.value = target_word;
        
        // Enter 키 이벤트 디스패치
        const event = new KeyboardEvent('keydown', {key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true});
        input_box.dispatchEvent(event);
        
        console.log(`공격 단어: ${target_word}`);
    } catch (e) {
        console.log(`입력 오류: ${e}`);
    }
}

function auto() {
    console.log(`봇 시작: ${ID} 턴을 대기합니다...`);
    setInterval(() => {
        try {
            // 현재 차례인 플레이어 요소 찾기
            const now_players = document.querySelectorAll('.game-user-current');
            if (now_players.length === 0) return;
            
            // 현재 차례 플레이어의 닉네임 확인
            const player_name_elements = now_players[0].querySelectorAll('.game-user-name');
            if (player_name_elements.length === 0) return;
                
            const player_name = player_name_elements[0].textContent.trim();
            
            if (player_name === ID) {
                // 내 차례라면 시작 음절 획득
                const start = get_now_syllable();
                
                if (start && start.length === 1) {
                    console.log(`내 차례! 시작 음절: ${start}`);
                    attack(start);
                    // 연속 입력 방지를 위한 짧은 대기 (setTimeout으로 구현 가능하지만 간단히 생략)
                }
            }
        } catch (e) {
            console.log(`루프 오류: ${e}`);
        }
    }, 500); // CPU 점유율 조절
}

// 봇 시작
auto();