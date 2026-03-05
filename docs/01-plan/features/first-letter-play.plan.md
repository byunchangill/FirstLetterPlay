# Plan: FirstLetterPlay - 아이를 위한 첫 글자 놀이 학습

> Plan Plus (Brainstorming-Enhanced PDCA Planning)
> Created: 2026-03-05
> Status: Draft

---

## 1. User Intent Discovery

### Core Problem
3~7세 아이들이 한글(자음/모음), 숫자, 영어 알파벳을 처음 배울 때 지루하지 않고 즐겁게 학습할 수 있는 놀이형 학습 플랫폼이 필요하다.

### Target Users
- **Primary**: 3~7세 아이들 (미취학 영유아 ~ 초등 입학 전후)
- **Secondary**: 부모 (아이에게 학습 도구를 제공하는 역할)

### Success Criteria
- 아이가 자발적으로 "또 하고 싶다"고 느끼는 UX
- 캐릭터와 함께하는 경험으로 학습에 긍정적 감정 연결
- 3단계 난이도 (듣기/보기 -> 읽기/말하기 -> 쓰기)로 단계적 학습 가능
- 모바일/태블릿에서 쾌적한 터치 인터랙션

### Constraints
- 백엔드 없음 (프로토타입)
- 로컬 DB (IndexedDB) 사용
- 음성 파일은 사용자가 직접 준비
- 캐릭터 이미지는 별도 준비 필요 (저작권 고려)

---

## 2. Feature Overview

### Project Name
**FirstLetterPlay** - 첫 글자 놀이

### Description
귀여운 캐릭터(공룡/또봇/엘사/하츄핑)와 함께 한글 자음/모음, 숫자, 영어 알파벳을 스테이지 클리어 방식으로 학습하는 놀이형 교육 사이트.

### Learning Areas (4 Worlds)

| World | Content | Stages | Description |
|-------|---------|--------|-------------|
| 자음 나라 | ㄱ~ㅎ (14개) | 14 | 한글 자음 학습 |
| 모음 나라 | ㅏ~ㅣ (10개) | 10 | 한글 모음 학습 |
| 숫자 나라 | 1~10 | 10 | 숫자 한글/영어 학습 |
| 알파벳 나라 | A~Z, a~z (26개) | 26 | 영어 알파벳 학습 |

### Characters
1. 귀여운 공룡
2. 변신로봇 또봇
3. 엘사
4. 하츄핑

---

## 3. Alternatives Explored

### Approach A: Next.js + localStorage
- SSG 정적 배포 가능, 풀스택 확장 용이
- 빌드 단계 필요, 프로토타입에는 과한 면 있음

### Approach B: Vanilla HTML/CSS/JS
- 빌드 도구 불필요, 즉시 실행
- 컴포넌트 재사용 어려움, 스테이지 많아지면 관리 복잡

### Approach C: React (Vite) + IndexedDB -- SELECTED
- 컴포넌트 기반으로 스테이지/캐릭터 재사용 용이
- 빠른 HMR, Tailwind CSS로 반응형 UI
- 프로토타입에 집중하면서도 코드 구조 깔끔

**선택 이유**: 컴포넌트 재사용성과 가벼운 빌드가 프로토타입에 최적

---

## 4. YAGNI Review

### Included (v1)
- [x] 캐릭터 선택 화면 (4종)
- [x] 한글 자음 학습 (ㄱ~ㅎ, 14개)
- [x] 한글 모음 학습 (ㅏ~ㅣ, 10개)
- [x] 숫자 학습 (1~10, 한글/영어)
- [x] 영어 알파벳 학습 (A~Z, a~z, 26개)
- [x] 3단계 난이도 스테이지 시스템
- [x] 별/트로피 + 캐릭터 성장 보상 체계
- [x] 듣기 (음성 파일 재생)
- [x] 말하기 (Web Speech API)
- [x] 읽기 (이미지 매칭 퀴즈)
- [x] 쓰기 (캔버스 따라쓰기)

### Out of Scope (v2+)
- [ ] 백엔드/서버 연동
- [ ] 사용자 계정/로그인
- [ ] 단어 조합 학습 (자음+모음)
- [ ] 문장 읽기/쓰기
- [ ] 멀티플레이어/친구 기능
- [ ] 학습 리포트 (부모용 대시보드)

---

## 5. Technical Architecture

### Tech Stack
- **Framework**: React 18+ (Vite)
- **Styling**: Tailwind CSS
- **Animation**: Framer Motion (or CSS animations)
- **Local DB**: Dexie.js (IndexedDB wrapper)
- **Speech**: Web Speech API (음성 인식)
- **Audio**: HTML5 Audio API (음성 파일 재생)
- **Canvas**: HTML5 Canvas or react-canvas-draw (따라쓰기)
- **Routing**: React Router v6

### Project Structure
```
FirstLetterPlay/
├── public/
│   ├── audio/
│   │   ├── consonants/      # ㄱ.mp3 ~ ㅎ.mp3
│   │   ├── vowels/          # ㅏ.mp3 ~ ㅣ.mp3
│   │   ├── numbers/         # 1.mp3 ~ 10.mp3 (한글/영어)
│   │   └── alphabet/        # a.mp3 ~ z.mp3
│   └── images/
│       ├── characters/      # 공룡, 또봇, 엘사, 하츄핑 (각 레벨별)
│       └── matching/        # 글자 매칭 이미지 (ㄱ=기린 등)
├── src/
│   ├── components/
│   │   ├── CharacterSelect/ # 캐릭터 선택
│   │   ├── WorldMap/        # 월드맵 (4개 영역)
│   │   ├── Stage/           # 스테이지 (학습+퀴즈)
│   │   ├── Learning/        # 학습 (듣기/보기)
│   │   ├── Quiz/            # 퀴즈 (선택/말하기/쓰기)
│   │   ├── Reward/          # 보상 (별/캐릭터 성장)
│   │   └── common/          # 공통 UI
│   ├── data/
│   │   ├── consonants.js    # 자음 데이터
│   │   ├── vowels.js        # 모음 데이터
│   │   ├── numbers.js       # 숫자 데이터
│   │   └── alphabet.js      # 알파벳 데이터
│   ├── db/
│   │   └── dexie.js         # IndexedDB 설정
│   ├── hooks/
│   │   ├── useAudio.js      # 음성 재생 훅
│   │   ├── useSpeech.js     # 음성 인식 훅
│   │   └── useProgress.js   # 진행 상황 훅
│   ├── pages/
│   │   ├── Home.jsx         # 시작 화면
│   │   ├── Select.jsx       # 캐릭터 선택
│   │   ├── WorldMap.jsx     # 월드맵
│   │   └── Stage.jsx        # 스테이지 플레이
│   ├── App.jsx
│   └── main.jsx
├── index.html
├── package.json
├── vite.config.js
└── tailwind.config.js
```

### Data Schema (IndexedDB via Dexie.js)

```javascript
// Profile
{ id: auto, characterId: string, createdAt: Date }

// Progress
{ id: auto, area: string, stageIndex: number, difficulty: string,
  stars: number, completed: boolean, completedAt: Date }

// Character Growth
{ id: auto, characterId: string, level: number, exp: number, items: string[] }
```

### Data Format (Learning Content)

```javascript
// consonants.js
export const consonants = [
  { letter: 'ㄱ', name: '기역', word: '기린', image: 'giraffe.png', audio: 'ㄱ.mp3' },
  { letter: 'ㄴ', name: '니은', word: '나비', image: 'butterfly.png', audio: 'ㄴ.mp3' },
  // ...
];

// alphabet.js
export const alphabet = [
  { upper: 'A', lower: 'a', word: 'Apple', image: 'apple.png', audio: 'a.mp3' },
  { upper: 'B', lower: 'b', word: 'Bear', image: 'bear.png', audio: 'b.mp3' },
  // ...
];
```

---

## 6. User Flow

```
[Home] 시작 화면
  → "FirstLetterPlay" 로고 + 시작 버튼
  → 기존 사용자: 바로 월드맵으로

[CharacterSelect] 캐릭터 선택
  → 4캐릭터 카드 표시
  → 선택 시 인사 애니메이션 + 음성

[WorldMap] 월드맵
  → 4개 영역(자음/모음/숫자/알파벳) 지도 형태
  → 선택한 캐릭터가 맵 위에 표시
  → 클리어한 스테이지는 별 표시, 잠긴 스테이지는 자물쇠

[Stage] 스테이지 플레이 (3단계)
  [Easy] 듣기+보기
    → 큰 글자 + 매칭 이미지 + 음성 자동 재생
    → 캐릭터 말풍선: "ㄱ은 기린의 ㄱ이야!"
    → 4지선다 중 올바른 글자 터치

  [Normal] 읽기+말하기
    → 글자 보여주고 마이크 버튼
    → Web Speech API로 발음 인식
    → 매칭 퀴즈 (글자-이미지 쌍 맞추기)

  [Hard] 쓰기
    → 캔버스에 가이드라인 표시
    → 터치/드래그로 따라 그리기
    → 빈칸 채우기 퀴즈

[Reward] 클리어 보상
  → 정답률에 따라 별 1~3개
  → 캐릭터 축하 애니메이션
  → 경험치 증가 → 레벨업 시 캐릭터 변화
  → 다음 스테이지 해금
```

---

## 7. Stage Difficulty System

| Difficulty | Activity | Skill | Interaction |
|------------|----------|-------|-------------|
| Easy | 듣기 + 보기 | 인지/구별 | 4지선다 터치 |
| Normal | 읽기 + 말하기 | 발음/연결 | 음성인식 + 매칭 |
| Hard | 쓰기 | 표현/기억 | 캔버스 드로잉 + 빈칸 |

- Easy 클리어 → Normal 해금
- Normal 클리어 → Hard 해금
- Hard 클리어 → 다음 글자 스테이지 해금

---

## 8. Reward System

### Stars (per stage)
- 3 stars: 모든 문제 정답 (100%)
- 2 stars: 80% 이상 정답
- 1 star: 스테이지 클리어 (60% 이상)
- Retry: 60% 미만 시 재도전

### Character Growth
- 스테이지 클리어 시 경험치 획득 (별 수에 비례)
- 레벨업 시 캐릭터 외형 변화 (예: 공룡이 점점 커지거나 장식 추가)
- 트로피: 영역 전체 클리어 시 황금 트로피

---

## 9. Responsive Design

- **Mobile First**: 터치 인터랙션 최적화
- **Breakpoints**:
  - Mobile: ~480px (세로 모드 기본)
  - Tablet: 481px~1024px
  - Desktop: 1025px~ (보너스, 주요 타겟 아님)
- **Touch Targets**: 최소 48x48px (아이 손가락 고려 시 64x64px 권장)
- **Font Size**: 기본 24px+ (아이용 큰 글자)

---

## 10. Brainstorming Log

| Phase | Decision | Reasoning |
|-------|----------|-----------|
| Intent | 3~7세 전체, 난이도로 분리 | 넓은 연령대 커버하면서 개인화 |
| Intent | 전체 영역 동시 구현 | 프로토타입이지만 완성도 있는 데모 |
| Alternatives | React (Vite) + IndexedDB | 컴포넌트 재사용 + 가벼운 빌드 |
| YAGNI | 전 기능 포함 | 핵심 기능만으로 구성됨, 불필요한 것 없음 |
| Reward | 별 + 캐릭터 성장 복합 | 아이에게 다층적 동기 부여 |

---

## 11. Risk & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Web Speech API 브라우저 호환성 | 말하기 기능 불가 | 폴백: 말하기 스킵 옵션 제공 |
| 캐릭터 저작권 | 법적 이슈 | 프로토타입 단계에서 플레이스홀더 사용, 추후 라이센스 확인 |
| 따라쓰기 인식 정확도 | 아이 좌절감 | 관대한 판정 기준, 가이드라인 강화 |
| 음성파일 용량 | 로딩 시간 | mp3 압축, lazy loading |
| IndexedDB 데이터 유실 | 진행 상황 초기화 | 내보내기/가져오기 기능 (v2) |

---

## Next Steps
- [ ] /pdca design first-letter-play
- [ ] UI/UX 목업 작성
- [ ] 학습 데이터 파일 준비 (자음/모음/숫자/알파벳)
- [ ] 음성 파일 준비
- [ ] 캐릭터 이미지 준비
