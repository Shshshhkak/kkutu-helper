import time
import json
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

# ================= 설정 구간 =================
ID = '레벨 끄투 봇'  # 자신의 끄투 닉네임으로 변경하세요
# 간단한 단어장 (실제 사용 시에는 더 방대한 사전을 로드하는 것이 좋습니다)
WORD_DICT = {} # JSON 파일에서 로드할 예정

# JSON 파일 로드
try:
    with open("processed_words.json", "r", encoding="utf-8") as f:
        WORD_DICT = json.load(f)
    print(f"단어 사전 로드 완료. {len(WORD_DICT)}개의 시작 음절 인덱스.")
except FileNotFoundError:
    print("오류: processed_words.json 파일을 찾을 수 없습니다. preprocess_words.py를 먼저 실행하세요.")
    exit()
except Exception as e:
    print(f"단어 사전 로드 중 오류 발생: {e}")
    exit()

# =============================================

def get_now_syllable(driver):
    """현재 화면에 표시된 시작 단어(음절)를 가져옵니다."""
    try:
        # 끄투 화면에서 단어가 표시되는 요소의 클래스명 (보통 'kw' 또는 특정 div)
        # 사이트 업데이트에 따라 'div.kw' 등으로 변경될 수 있습니다.
        element = driver.find_element(By.CLASS_NAME, 'kw')
        text = element.text.strip()
        
        # '이(리)'와 같은 형태 처리
        if '(' in text:
            text = text.split('(')[0]
        return text
    except:
        return None

def attack(driver, start_syllable):
    """단어장에서 단어를 찾아 입력창에 전송합니다."""
    # 단어장에서 시작 음절에 맞는 단어 찾기
    words = WORD_DICT.get(start_syllable, [])
    if not words:
        print(f"'{start_syllable}'로 시작하는 단어를 찾을 수 없습니다.")
        return

    target_word = words[0] # 첫 번째 단어 선택 (랜덤이나 긴 단어 선택 로직 추가 가능)
    
    try:
        # 입력창 찾기 (보통 id가 'talk'인 input 요소)
        input_box = driver.find_element(By.ID, 'talk')
        input_box.send_keys(target_word)
        input_box.send_keys(Keys.ENTER)
        print(f"공격 단어: {target_word}")
    except Exception as e:
        print(f"입력 오류: {e}")

def auto(driver):
    print(f"봇 시작: {ID} 턴을 대기합니다...")
    while True:
        try:
            # 현재 차례인 플레이어 요소 찾기
            now_players = driver.find_elements(By.CLASS_NAME, 'game-user-current')
            if not now_players:
                time.sleep(0.1)
                continue
            
            # 현재 차례 플레이어의 닉네임 확인
            player_name_elements = now_players[0].find_elements(By.CLASS_NAME, 'game-user-name')
            if not player_name_elements:
                continue
                
            player_name = player_name_elements[0].text.strip()
            
            if player_name == ID:
                # 내 차례라면 시작 음절 획득
                start = get_now_syllable(driver)
                
                if start and len(start) == 1:
                    print(f"내 차례! 시작 음절: {start}")
                    attack(driver, start)
                    # 연속 입력 방지를 위한 짧은 대기
                    time.sleep(2) 
            
            time.sleep(0.5) # CPU 점유율 조절
            
        except Exception as e:
            print(f"루프 오류: {e}")
            time.sleep(1)

if __name__ == "__main__":
    # 드라이버 설정 (크롬 예시)
    # 실제 환경에 맞게 크롬드라이버 경로 등을 설정해야 합니다.
    options = webdriver.ChromeOptions()
    # options.add_argument('--headless') # 화면 없이 실행하려면 주석 해제
    
    driver = webdriver.Chrome(options=options)
    driver.get("https://kkutu.co.kr/")
    
    print("사이트 접속 완료. 게임방에 입장한 후 스크립트가 작동하도록 대기하세요.")
    # 수동 로그인 및 방 입장을 위한 대기 시간 또는 사용자 입력
    input("게임방 입장 후 엔터를 누르면 봇이 시작됩니다...")
    
    auto(driver)
