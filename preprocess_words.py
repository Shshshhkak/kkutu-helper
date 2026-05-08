import json
from collections import defaultdict

def preprocess():
    try:
        with open('words_full.json', 'r', encoding='utf-8') as f:
            words = json.load(f)
        
        word_dict = defaultdict(list)
        for word in words:
            if word:
                first_char = word[0]
                word_dict[first_char].append(word)
        
        # 단어 길이순으로 정렬 (긴 단어 우선 공격 전략 등 가능)
        for char in word_dict:
            word_dict[char].sort(key=len, reverse=True)
            
        with open('processed_words.json', 'w', encoding='utf-8') as f:
            json.dump(word_dict, f, ensure_ascii=False, indent=2)
        
        print(f"전처리 완료: {len(word_dict)}개의 시작 음절 인덱스 생성됨.")
    except Exception as e:
        print(f"전처리 오류: {e}")

if __name__ == "__main__":
    preprocess()
