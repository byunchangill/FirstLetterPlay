# FirstLetterPlay Design Document

> **Summary**: 3~7세 아이를 위한 캐릭터 동반 놀이형 한글/숫자/영어 학습 사이트
>
> **Project**: FirstLetterPlay
> **Version**: 0.1.0 (Prototype)
> **Date**: 2026-03-05
> **Status**: Draft
> **Planning Doc**: [first-letter-play.plan.md](../01-plan/features/first-letter-play.plan.md)

---

## 1. Overview

### 1.1 Design Goals

- 3~7세 아이가 혼자서도 조작할 수 있는 직관적 UI
- 모바일/태블릿 터치 최적화 (큰 버튼, 단순한 네비게이션)
- 캐릭터와 함께하는 몰입감 있는 학습 경험
- 스테이지 클리어 기반 성취감과 동기 부여
- 60개 스테이지 x 3난이도 = 재사용 가능한 컴포넌트 설계

### 1.2 Design Principles

- **Simple Navigation**: 최대 2탭이면 원하는 화면 도달 (홈→월드맵→스테이지)
- **Large Touch Targets**: 최소 64x64px (아이 손가락 고려)
- **Visual Feedback**: 모든 터치에 즉각적 애니메이션/사운드 반응
- **Forgiving UX**: 틀려도 격려, 쉽게 재시도 가능

---

## 2. Architecture

### 2.1 Component Diagram

```
┌─────────────────────────────────────────────────────┐
│                    App (Router)                       │
├─────────┬──────────┬──────────────┬─────────────────┤
│  Home   │ Character│  WorldMap    │     Stage        │
│  Page   │ Select   │  Page        │     Page         │
│         │ Page     │              │                  │
│         │          │  ┌────────┐  │  ┌────────────┐  │
│         │          │  │ World  │  │  │ Learning   │  │
│         │          │  │ Card   │  │  │ Component  │  │
│         │          │  └────────┘  │  ├────────────┤  │
│         │          │  ┌────────┐  │  │ Quiz       │  │
│         │          │  │ Stage  │  │  │ Component  │  │
│         │          │  │ Node   │  │  ├────────────┤  │
│         │          │  └────────┘  │  │ Writing    │  │
│         │          │              │  │ Canvas     │  │
│         │          │              │  ├────────────┤  │
│         │          │              │  │ Reward     │  │
│         │          │              │  │ Modal      │  │
│         │          │              │  └────────────┘  │
└─────────┴──────────┴──────────────┴─────────────────┘
        │                    │                │
   ┌────┴────────────────────┴────────────────┴────┐
   │              Shared Layer                      │
   │  ┌──────────┐ ┌──────────┐ ┌───────────────┐  │
   │  │ useAudio │ │useSpeech │ │ useProgress   │  │
   │  │ Hook     │ │ Hook     │ │ Hook          │  │
   │  └──────────┘ └──────────┘ └───────────────┘  │
   │  ┌──────────┐ ┌──────────┐ ┌───────────────┐  │
   │  │ Dexie DB │ │ Data     │ │ Character     │  │
   │  │ (IndexDB)│ │ (Static) │ │ Context       │  │
   │  └──────────┘ └──────────┘ └───────────────┘  │
   └───────────────────────────────────────────────┘
```

### 2.2 Routing (React Router v6)

| Path | Page | Description |
|------|------|-------------|
| `/` | Home | 시작 화면 (로고 + 시작 버튼) |
| `/select` | CharacterSelect | 캐릭터 선택 |
| `/world` | WorldMap | 월드맵 (4개 영역) |
| `/world/:area` | WorldMap | 영역 선택 시 스테이지 목록 |
| `/stage/:area/:index` | Stage | 스테이지 플레이 |

### 2.3 State Management

- **React Context**: 선택된 캐릭터 정보 (CharacterContext)
- **Dexie.js (IndexedDB)**: 진행 상황, 별/경험치 영속 저장
- **Local State**: 스테이지 내 일시적 상태 (현재 문제, 점수 등)

### 2.4 Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| react | ^18 | UI Framework |
| react-dom | ^18 | DOM Rendering |
| react-router-dom | ^6 | Client-side Routing |
| dexie | ^4 | IndexedDB Wrapper |
| dexie-react-hooks | ^1 | Dexie React Integration |
| tailwindcss | ^3 | Utility-first CSS |
| framer-motion | ^11 | Animations |

---

## 3. Data Model

### 3.1 IndexedDB Schema (Dexie.js)

```javascript
// db/dexie.js
import Dexie from 'dexie';

const db = new Dexie('FirstLetterPlayDB');

db.version(1).stores({
  profiles: '++id, characterId, createdAt',
  progress: '++id, area, stageIndex, difficulty, [area+stageIndex+difficulty]',
  characterGrowth: '++id, characterId'
});
```

### 3.2 Entity Definitions

```javascript
// Profile - 사용자 프로필 (캐릭터 선택)
{
  id: number,           // auto-increment
  characterId: string,  // 'dino' | 'tobot' | 'elsa' | 'hatchping'
  createdAt: Date
}

// Progress - 스테이지 진행 상황
{
  id: number,
  area: string,         // 'consonants' | 'vowels' | 'numbers' | 'alphabet'
  stageIndex: number,   // 0-based index
  difficulty: string,   // 'easy' | 'normal' | 'hard'
  stars: number,        // 0~3
  completed: boolean,
  completedAt: Date
}

// CharacterGrowth - 캐릭터 성장
{
  id: number,
  characterId: string,
  level: number,        // 1~10
  exp: number,          // 0~100 per level
  trophies: string[]    // ['consonants', 'vowels', ...] 영역 클리어 트로피
}
```

### 3.3 Entity Relationships

```
[Profile] 1 ──── 1 [CharacterGrowth]
    │
    └── 1 ──── N [Progress]
                    (area x stageIndex x difficulty 조합)
```

### 3.4 Static Data Format

```javascript
// data/consonants.js
export const consonants = [
  { letter: 'ㄱ', name: '기역', word: '기린',   image: 'giraffe.png',    audio: 'ㄱ.mp3' },
  { letter: 'ㄴ', name: '니은', word: '나비',   image: 'butterfly.png',  audio: 'ㄴ.mp3' },
  { letter: 'ㄷ', name: '디귿', word: '다람쥐', image: 'squirrel.png',   audio: 'ㄷ.mp3' },
  { letter: 'ㄹ', name: '리을', word: '로봇',   image: 'robot.png',      audio: 'ㄹ.mp3' },
  { letter: 'ㅁ', name: '미음', word: '무지개', image: 'rainbow.png',    audio: 'ㅁ.mp3' },
  { letter: 'ㅂ', name: '비읍', word: '바나나', image: 'banana.png',     audio: 'ㅂ.mp3' },
  { letter: 'ㅅ', name: '시옷', word: '사자',   image: 'lion.png',       audio: 'ㅅ.mp3' },
  { letter: 'ㅇ', name: '이응', word: '오리',   image: 'duck.png',       audio: 'ㅇ.mp3' },
  { letter: 'ㅈ', name: '지읒', word: '자동차', image: 'car.png',        audio: 'ㅈ.mp3' },
  { letter: 'ㅊ', name: '치읓', word: '치즈',   image: 'cheese.png',     audio: 'ㅊ.mp3' },
  { letter: 'ㅋ', name: '키읔', word: '코끼리', image: 'elephant.png',   audio: 'ㅋ.mp3' },
  { letter: 'ㅌ', name: '티읕', word: '토끼',   image: 'rabbit.png',     audio: 'ㅌ.mp3' },
  { letter: 'ㅍ', name: '피읖', word: '포도',   image: 'grape.png',      audio: 'ㅍ.mp3' },
  { letter: 'ㅎ', name: '히읗', word: '하마',   image: 'hippo.png',      audio: 'ㅎ.mp3' },
];

// data/vowels.js
export const vowels = [
  { letter: 'ㅏ', name: '아', word: '아이스크림', image: 'icecream.png', audio: 'ㅏ.mp3' },
  { letter: 'ㅑ', name: '야', word: '야구공',     image: 'baseball.png', audio: 'ㅑ.mp3' },
  { letter: 'ㅓ', name: '어', word: '어린이',     image: 'children.png', audio: 'ㅓ.mp3' },
  { letter: 'ㅕ', name: '여', word: '여우',       image: 'fox.png',      audio: 'ㅕ.mp3' },
  { letter: 'ㅗ', name: '오', word: '오렌지',     image: 'orange.png',   audio: 'ㅗ.mp3' },
  { letter: 'ㅛ', name: '요', word: '요술봉',     image: 'wand.png',     audio: 'ㅛ.mp3' },
  { letter: 'ㅜ', name: '우', word: '우산',       image: 'umbrella.png', audio: 'ㅜ.mp3' },
  { letter: 'ㅠ', name: '유', word: '유니콘',     image: 'unicorn.png',  audio: 'ㅠ.mp3' },
  { letter: 'ㅡ', name: '으', word: '으뜸',     image: 'eutteum.png',    audio: 'ㅡ.mp3' },
  { letter: 'ㅣ', name: '이', word: '이글루',     image: 'igloo.png',    audio: 'ㅣ.mp3' },
];

// data/numbers.js
export const numbers = [
  { number: 1,  korean: '일',  english: 'one',   image: '1.png', audioKr: '1-kr.mp3', audioEn: '1-en.mp3' },
  { number: 2,  korean: '이',  english: 'two',   image: '2.png', audioKr: '2-kr.mp3', audioEn: '2-en.mp3' },
  { number: 3,  korean: '삼',  english: 'three', image: '3.png', audioKr: '3-kr.mp3', audioEn: '3-en.mp3' },
  { number: 4,  korean: '사',  english: 'four',  image: '4.png', audioKr: '4-kr.mp3', audioEn: '4-en.mp3' },
  { number: 5,  korean: '오',  english: 'five',  image: '5.png', audioKr: '5-kr.mp3', audioEn: '5-en.mp3' },
  { number: 6,  korean: '육',  english: 'six',   image: '6.png', audioKr: '6-kr.mp3', audioEn: '6-en.mp3' },
  { number: 7,  korean: '칠',  english: 'seven', image: '7.png', audioKr: '7-kr.mp3', audioEn: '7-en.mp3' },
  { number: 8,  korean: '팔',  english: 'eight', image: '8.png', audioKr: '8-kr.mp3', audioEn: '8-en.mp3' },
  { number: 9,  korean: '구',  english: 'nine',  image: '9.png', audioKr: '9-kr.mp3', audioEn: '9-en.mp3' },
  { number: 10, korean: '십',  english: 'ten',   image: '10.png', audioKr: '10-kr.mp3', audioEn: '10-en.mp3' },
];

// data/alphabet.js
export const alphabet = [
  { upper: 'A', lower: 'a', word: 'Apple',    image: 'apple.png',    audio: 'a.mp3' },
  { upper: 'B', lower: 'b', word: 'Bear',     image: 'bear.png',     audio: 'b.mp3' },
  { upper: 'C', lower: 'c', word: 'Cat',      image: 'cat.png',      audio: 'c.mp3' },
  { upper: 'D', lower: 'd', word: 'Dog',      image: 'dog.png',      audio: 'd.mp3' },
  { upper: 'E', lower: 'e', word: 'Elephant', image: 'elephant.png', audio: 'e.mp3' },
  { upper: 'F', lower: 'f', word: 'Fish',     image: 'fish.png',     audio: 'f.mp3' },
  { upper: 'G', lower: 'g', word: 'Giraffe',  image: 'giraffe.png',  audio: 'g.mp3' },
  { upper: 'H', lower: 'h', word: 'Horse',    image: 'horse.png',    audio: 'h.mp3' },
  { upper: 'I', lower: 'i', word: 'Igloo',    image: 'igloo.png',    audio: 'i.mp3' },
  { upper: 'J', lower: 'j', word: 'Juice',    image: 'juice.png',    audio: 'j.mp3' },
  { upper: 'K', lower: 'k', word: 'Kite',     image: 'kite.png',     audio: 'k.mp3' },
  { upper: 'L', lower: 'l', word: 'Lion',     image: 'lion.png',     audio: 'l.mp3' },
  { upper: 'M', lower: 'm', word: 'Moon',     image: 'moon.png',     audio: 'm.mp3' },
  { upper: 'N', lower: 'n', word: 'Nest',     image: 'nest.png',     audio: 'n.mp3' },
  { upper: 'O', lower: 'o', word: 'Orange',   image: 'orange.png',   audio: 'o.mp3' },
  { upper: 'P', lower: 'p', word: 'Penguin',  image: 'penguin.png',  audio: 'p.mp3' },
  { upper: 'Q', lower: 'q', word: 'Queen',    image: 'queen.png',    audio: 'q.mp3' },
  { upper: 'R', lower: 'r', word: 'Rabbit',   image: 'rabbit.png',   audio: 'r.mp3' },
  { upper: 'S', lower: 's', word: 'Sun',      image: 'sun.png',      audio: 's.mp3' },
  { upper: 'T', lower: 't', word: 'Tiger',    image: 'tiger.png',    audio: 't.mp3' },
  { upper: 'U', lower: 'u', word: 'Umbrella', image: 'umbrella.png', audio: 'u.mp3' },
  { upper: 'V', lower: 'v', word: 'Violin',   image: 'violin.png',   audio: 'v.mp3' },
  { upper: 'W', lower: 'w', word: 'Whale',    image: 'whale.png',    audio: 'w.mp3' },
  { upper: 'X', lower: 'x', word: 'Xylophone',image: 'xylophone.png',audio: 'x.mp3' },
  { upper: 'Y', lower: 'y', word: 'Yacht',    image: 'yacht.png',    audio: 'y.mp3' },
  { upper: 'Z', lower: 'z', word: 'Zebra',    image: 'zebra.png',    audio: 'z.mp3' },
];

// data/characters.js
export const characters = [
  {
    id: 'dino',
    name: '디노',
    description: '귀여운 아기 공룡',
    color: '#4CAF50',
    levels: [
      { level: 1, image: 'dino-1.png', name: '알에서 태어난 디노' },
      { level: 3, image: 'dino-2.png', name: '조금 자란 디노' },
      { level: 5, image: 'dino-3.png', name: '날개가 생긴 디노' },
      { level: 8, image: 'dino-4.png', name: '멋진 용이 된 디노' },
    ]
  },
  {
    id: 'tobot',
    name: '또봇',
    description: '변신 로봇 또봇',
    color: '#2196F3',
    levels: [
      { level: 1, image: 'tobot-1.png', name: '미니 또봇' },
      { level: 3, image: 'tobot-2.png', name: '또봇 C' },
      { level: 5, image: 'tobot-3.png', name: '또봇 X' },
      { level: 8, image: 'tobot-4.png', name: '또봇 타이탄' },
    ]
  },
  {
    id: 'elsa',
    name: '엘사',
    description: '얼음 공주 엘사',
    color: '#90CAF9',
    levels: [
      { level: 1, image: 'elsa-1.png', name: '어린 엘사' },
      { level: 3, image: 'elsa-2.png', name: '마법을 배우는 엘사' },
      { level: 5, image: 'elsa-3.png', name: '얼음 성의 엘사' },
      { level: 8, image: 'elsa-4.png', name: '여왕 엘사' },
    ]
  },
  {
    id: 'hatchping',
    name: '하츄핑',
    description: '귀여운 하츄핑',
    color: '#E91E63',
    levels: [
      { level: 1, image: 'hatchping-1.png', name: '아기 하츄핑' },
      { level: 3, image: 'hatchping-2.png', name: '날 수 있는 하츄핑' },
      { level: 5, image: 'hatchping-3.png', name: '마법 하츄핑' },
      { level: 8, image: 'hatchping-4.png', name: '슈퍼 하츄핑' },
    ]
  },
];
```

---

## 4. UI/UX Design

### 4.1 Color Palette

| Usage | Color | Hex | Description |
|-------|-------|-----|-------------|
| Primary BG | 밝은 하늘색 | #E3F2FD | 메인 배경 |
| 자음 나라 | 초록색 계열 | #C8E6C9 | 산/숲 테마 |
| 모음 나라 | 파란색 계열 | #B3E5FC | 바다 테마 |
| 숫자 나라 | 노란색 계열 | #FFF9C4 | 별/우주 테마 |
| 알파벳 나라 | 주황색 계열 | #FFE0B2 | 모험 테마 |
| 성공/정답 | 초록 | #4CAF50 | 정답 피드백 |
| 오답 | 빨강 (부드러운) | #EF9A9A | 오답 피드백 (공포감 없게) |
| 별 | 금색 | #FFD700 | 보상 별 |

### 4.2 Typography

| Usage | Font | Size | Weight |
|-------|------|------|--------|
| 큰 글자 (학습 대상) | Noto Sans KR | 72~120px | Bold |
| 안내 텍스트 | Noto Sans KR | 24~32px | Medium |
| 캐릭터 말풍선 | Noto Sans KR | 20~28px | Regular |
| 버튼 텍스트 | Noto Sans KR | 20~24px | Bold |

### 4.3 Screen Layouts

#### Home (시작 화면)

```
Mobile (375px)                    Tablet (768px)
┌─────────────────────┐          ┌──────────────────────────────┐
│                     │          │                              │
│     [로고 이미지]    │          │        [로고 이미지]          │
│                     │          │                              │
│   FirstLetterPlay   │          │      FirstLetterPlay         │
│   첫 글자 놀이      │          │      첫 글자 놀이             │
│                     │          │                              │
│                     │          │                              │
│  ┌───────────────┐  │          │     ┌──────────────────┐     │
│  │  시작하기! ▶   │  │          │     │   시작하기! ▶     │     │
│  └───────────────┘  │          │     └──────────────────┘     │
│                     │          │                              │
│  ┌───────────────┐  │          │     ┌──────────────────┐     │
│  │  이어하기 ▶   │  │          │     │   이어하기 ▶      │     │
│  └───────────────┘  │          │     └──────────────────┘     │
│                     │          │                              │
└─────────────────────┘          └──────────────────────────────┘
```

- "시작하기": 새 게임 → 캐릭터 선택으로 이동
- "이어하기": 기존 프로필 있을 때 → 바로 월드맵
- 기존 프로필 없으면 "이어하기" 숨김

#### CharacterSelect (캐릭터 선택)

```
Mobile (375px)
┌─────────────────────┐
│  친구를 골라줘!      │
├─────────────────────┤
│ ┌─────┐ ┌─────┐    │
│ │ 🦕  │ │ 🤖  │    │
│ │디노 │ │또봇 │    │
│ └─────┘ └─────┘    │
│ ┌─────┐ ┌─────┐    │
│ │ ❄️  │ │ 💗  │    │
│ │엘사 │ │하츄핑│    │
│ └─────┘ └─────┘    │
├─────────────────────┤
│  [캐릭터 인사 영역]  │
│  "안녕! 나는 디노야! │
│   같이 공부하자!"    │
│                     │
│  ┌───────────────┐  │
│  │  이 친구와 시작│  │
│  └───────────────┘  │
└─────────────────────┘

Tablet (768px)
┌──────────────────────────────────────┐
│         친구를 골라줘!                │
├──────────────────────────────────────┤
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐│
│  │  🦕  │ │  🤖  │ │  ❄️  │ │  💗  ││
│  │ 디노 │ │ 또봇 │ │ 엘사 │ │하츄핑││
│  └──────┘ └──────┘ └──────┘ └──────┘│
│                                      │
│        [캐릭터 인사 애니메이션]        │
│        "안녕! 나는 디노야!            │
│         같이 공부하자!"               │
│                                      │
│        ┌──────────────────┐          │
│        │  이 친구와 시작!  │          │
│        └──────────────────┘          │
└──────────────────────────────────────┘
```

- 캐릭터 카드: 140x160px (모바일), 160x180px (태블릿)
- 선택 시 bounce 애니메이션 + 캐릭터 인사 음성
- 선택된 카드 테두리 강조 (캐릭터 고유 색상)

#### WorldMap (월드맵)

```
Mobile (375px)
┌─────────────────────┐
│ [🦕 Lv.3] ⭐12/42  │  ← 캐릭터 + 총 별 수
├─────────────────────┤
│                     │
│  ┌───────────────┐  │
│  │ 🏔️ 자음 나라  │  │  ← 초록 배경
│  │  ⭐ 5/42      │  │
│  │  [12/14]      │  │
│  └───────────────┘  │
│                     │
│  ┌───────────────┐  │
│  │ 🌊 모음 나라  │  │  ← 파란 배경
│  │  ⭐ 3/30      │  │
│  │  [3/10]       │  │
│  └───────────────┘  │
│                     │
│  ┌───────────────┐  │
│  │ 🌟 숫자 나라  │  │  ← 노란 배경
│  │  ⭐ 4/30      │  │
│  │  [4/10]       │  │
│  └───────────────┘  │
│                     │
│  ┌───────────────┐  │
│  │ 🚀 알파벳 나라│  │  ← 주황 배경
│  │  ⭐ 0/78      │  │
│  │  [0/26]       │  │
│  └───────────────┘  │
│                     │
│  [🏠 홈]           │
└─────────────────────┘
```

- 각 월드 카드: 클릭 시 해당 영역 스테이지 목록으로 이동
- 진행률 바 표시 (클리어 스테이지 수 / 전체)
- 스크롤 가능 (세로)

#### WorldMap > Stage List (영역 내 스테이지 목록)

```
Mobile (375px)  - 예: 자음 나라
┌─────────────────────┐
│ ← 🏔️ 자음 나라      │
├─────────────────────┤
│                     │
│  ⭐⭐⭐  ⭐⭐⭐  ⭐⭐☆ │
│  [ㄱ]    [ㄴ]    [ㄷ] │  ← 클리어된 스테이지 (별 표시)
│                     │
│  ⭐☆☆   🔒     🔒   │
│  [ㄹ]    [ㅁ]    [ㅂ] │  ← 잠긴 스테이지
│                     │
│  🔒     🔒     🔒   │
│  [ㅅ]    [ㅇ]    [ㅈ] │
│                     │
│  🔒     🔒     🔒   │
│  [ㅊ]    [ㅋ]    [ㅌ] │
│                     │
│  🔒     🔒          │
│  [ㅍ]    [ㅎ]         │
│                     │
└─────────────────────┘
```

- 3열 그리드 배치
- 스테이지 노드: 80x80px 원형 버튼
- 클리어 스테이지: 별 + 글자 표시
- 잠긴 스테이지: 자물쇠 + 흐린 글자
- 현재 도전 가능: 반짝이는 테두리 애니메이션

#### Stage - Easy (듣기 + 보기)

```
Mobile (375px)
┌─────────────────────┐
│ ← ㄱ 배우기  Easy   │
│    ⭐☆☆ (1/3 문제) │
├─────────────────────┤
│                     │
│   ┌─────────────┐   │
│   │             │   │
│   │   [기린 🦒]  │   │  ← 매칭 이미지 (큰 사이즈)
│   │             │   │
│   └─────────────┘   │
│                     │
│      ┌─────┐        │
│      │ ㄱ  │        │  ← 학습 대상 글자 (120px)
│      └─────┘        │
│                     │
│  💬 "ㄱ은 기린의     │  ← 캐릭터 말풍선
│      ㄱ이야!"        │
│  [🦕]               │  ← 캐릭터 (작은 아바타)
│                     │
│  🔊 다시 듣기       │  ← 음성 재생 버튼
│                     │
├─────────────────────┤
│ 맞는 글자를 눌러봐!  │
│                     │
│ ┌────┐ ┌────┐      │
│ │ ㄱ │ │ ㄴ │      │  ← 4지선다 (64x64px 이상)
│ └────┘ └────┘      │
│ ┌────┐ ┌────┐      │
│ │ ㅁ │ │ ㅅ │      │
│ └────┘ └────┘      │
│                     │
└─────────────────────┘
```

- 진입 시 자동으로 음성 재생 + 이미지 표시
- 캐릭터가 말풍선으로 안내
- 정답 터치 시: 초록색 반짝 + "딩동댕!" 효과음 + 캐릭터 칭찬
- 오답 터치 시: 살짝 흔들림 + "다시 해볼까?" + 부드러운 오답 효과음

#### Stage - Normal (읽기 + 말하기)

```
Mobile (375px)
┌─────────────────────┐
│ ← ㄱ 배우기 Normal  │
│    ⭐☆☆ (1/3 문제) │
├─────────────────────┤
│                     │
│      ┌─────┐        │
│      │ ㄱ  │        │  ← 글자만 표시 (이미지 없음)
│      └─────┘        │
│                     │
│  💬 "이 글자를       │
│      읽어볼까?"      │
│  [🦕]               │
│                     │
│  ┌─────────────┐    │
│  │  🎤 말하기   │    │  ← 마이크 버튼 (크게)
│  │             │    │
│  └─────────────┘    │
│                     │
│  인식 결과: "기역" ✅│  ← Web Speech API 결과
│                     │
├─────────────────────┤
│ 맞는 짝을 찾아봐!    │
│                     │
│ [ㄱ]──[🦒]  맞음!   │  ← 매칭 게임
│ [ㄴ]──[?]           │
│ [ㄷ]──[?]           │
│                     │
└─────────────────────┘
```

- 말하기 지원 안 되는 브라우저: "말하기 건너뛰기" 버튼 표시
- 매칭 게임: 글자와 이미지를 드래그 또는 순서대로 터치하여 연결

#### Stage - Hard (쓰기)

```
Mobile (375px)
┌─────────────────────┐
│ ← ㄱ 배우기  Hard   │
│    ⭐☆☆ (1/2 문제) │
├─────────────────────┤
│                     │
│  💬 "ㄱ을 써볼까?"   │
│  [🦕]               │
│                     │
│  ┌─────────────────┐│
│  │  ㄱ (가이드라인) ││  ← 캔버스 영역
│  │  · · ·          ││     회색 점선 가이드
│  │    · ·          ││     터치/드래그로 따라쓰기
│  │      ·          ││
│  │                 ││
│  └─────────────────┘│
│                     │
│  [↩️ 다시] [✅ 완료] │  ← 지우기/제출 버튼
│                     │
├─────────────────────┤
│ 빈칸을 채워봐!       │
│                     │
│  "[ ] 린" = 기린     │  ← 빈칸 채우기
│                     │
│  ┌──┐ ┌──┐ ┌──┐    │
│  │ㄱ│ │ㄴ│ │ㄷ│    │  ← 선택지
│  └──┘ └──┘ └──┘    │
│                     │
└─────────────────────┘
```

- 캔버스: 최소 250x250px, 터치 스트로크 두께 8px
- 가이드라인: 회색 점선으로 글자 윤곽 표시
- 판정: 관대한 기준 (영역 매칭 비율 50% 이상이면 통과)
- 지우기 버튼으로 언제든 재시도 가능

#### Reward (클리어 보상)

```
Mobile (375px)
┌─────────────────────┐
│                     │
│    🎉 잘했어! 🎉    │  ← 축하 애니메이션 (confetti)
│                     │
│      ⭐ ⭐ ⭐       │  ← 별 등장 애니메이션
│                     │
│  ┌─────────────┐    │
│  │  [🦕 Lv.3]  │    │  ← 캐릭터 축하 포즈
│  │  +15 EXP    │    │
│  │  ████████░░ │    │  ← 경험치 바
│  └─────────────┘    │
│                     │
│  💬 "대단해!         │
│      다음도 해볼까?" │
│                     │
│  ┌───────────────┐  │
│  │  다음 스테이지 ▶│  │
│  └───────────────┘  │
│  ┌───────────────┐  │
│  │  월드맵으로    │  │
│  └───────────────┘  │
│                     │
└─────────────────────┘
```

- 별 1~3개 순차적 등장 애니메이션
- 캐릭터 레벨업 시 특별 연출 (캐릭터 변신 애니메이션)
- 경험치 바 채워지는 애니메이션

---

## 5. Component Specification

### 5.1 Page Components

| Component | File | Props | Description |
|-----------|------|-------|-------------|
| `HomePage` | `pages/Home.jsx` | - | 시작 화면. 로고, 시작/이어하기 버튼 |
| `SelectPage` | `pages/Select.jsx` | - | 캐릭터 선택 화면 |
| `WorldMapPage` | `pages/WorldMap.jsx` | - | 월드맵 + 스테이지 목록 |
| `StagePage` | `pages/Stage.jsx` | - | 스테이지 플레이 (Easy/Normal/Hard) |

### 5.2 Feature Components

| Component | File | Props | Description |
|-----------|------|-------|-------------|
| `CharacterCard` | `components/CharacterSelect/CharacterCard.jsx` | `character, selected, onSelect` | 캐릭터 선택 카드 |
| `CharacterGreeting` | `components/CharacterSelect/CharacterGreeting.jsx` | `character` | 캐릭터 인사 영역 |
| `WorldCard` | `components/WorldMap/WorldCard.jsx` | `area, progress, color, icon` | 월드 영역 카드 |
| `StageNode` | `components/WorldMap/StageNode.jsx` | `letter, stars, locked, active` | 스테이지 노드 (원형 버튼) |
| `StageGrid` | `components/WorldMap/StageGrid.jsx` | `area, stages, progress` | 스테이지 3열 그리드 |
| `EasyMode` | `components/Stage/EasyMode.jsx` | `item, onAnswer` | 듣기+보기 학습 |
| `NormalMode` | `components/Stage/NormalMode.jsx` | `item, onAnswer` | 읽기+말하기 학습 |
| `HardMode` | `components/Stage/HardMode.jsx` | `item, onAnswer` | 쓰기 학습 |
| `QuizFourChoice` | `components/Quiz/QuizFourChoice.jsx` | `correct, choices, onSelect` | 4지선다 퀴즈 |
| `QuizMatching` | `components/Quiz/QuizMatching.jsx` | `pairs, onComplete` | 매칭 퀴즈 |
| `QuizFillBlank` | `components/Quiz/QuizFillBlank.jsx` | `word, blank, choices, onSelect` | 빈칸 채우기 |
| `WritingCanvas` | `components/Stage/WritingCanvas.jsx` | `guideLetter, onSubmit, onClear` | 따라쓰기 캔버스 |
| `RewardModal` | `components/Reward/RewardModal.jsx` | `stars, exp, levelUp, onNext` | 클리어 보상 모달 |
| `CharacterAvatar` | `components/Reward/CharacterAvatar.jsx` | `characterId, level, size` | 캐릭터 아바타 (레벨별) |
| `ExpBar` | `components/Reward/ExpBar.jsx` | `current, max, animated` | 경험치 바 |
| `StarDisplay` | `components/Reward/StarDisplay.jsx` | `count, animated` | 별 표시 (1~3) |

### 5.3 Common Components

| Component | File | Props | Description |
|-----------|------|-------|-------------|
| `BigButton` | `components/common/BigButton.jsx` | `children, onClick, color, size` | 큰 터치 버튼 (64px+) |
| `SpeechBubble` | `components/common/SpeechBubble.jsx` | `text, character` | 캐릭터 말풍선 |
| `AudioButton` | `components/common/AudioButton.jsx` | `src, autoPlay` | 음성 재생 버튼 |
| `ProgressBar` | `components/common/ProgressBar.jsx` | `current, total, color` | 진행률 바 |
| `BackButton` | `components/common/BackButton.jsx` | `to` | 뒤로가기 버튼 |

### 5.4 Custom Hooks

| Hook | File | Returns | Description |
|------|------|---------|-------------|
| `useAudio` | `hooks/useAudio.js` | `{ play, stop, isPlaying }` | 음성 파일 재생 |
| `useSpeech` | `hooks/useSpeech.js` | `{ listen, result, isListening, supported }` | Web Speech API 음성 인식 |
| `useProgress` | `hooks/useProgress.js` | `{ getProgress, saveProgress, isStageUnlocked }` | 스테이지 진행 상황 CRUD |
| `useCharacter` | `hooks/useCharacter.js` | `{ character, growth, addExp, levelUp }` | 캐릭터 Context + 성장 |

---

## 6. Stage Logic

### 6.1 Stage Flow State Machine

```
         ┌─────────┐
         │  INTRO  │  ← 캐릭터 인사 + 글자 소개
         └────┬────┘
              ▼
         ┌─────────┐
    ┌───▶│  EASY   │  ← 듣기+보기 (3 문제)
    │    └────┬────┘
    │         ▼
    │    ┌─────────┐
    │    │ NORMAL  │  ← 읽기+말하기 (3 문제)
    │    └────┬────┘
    │         ▼
    │    ┌─────────┐
    │    │  HARD   │  ← 쓰기 (2 문제)
    │    └────┬────┘
    │         ▼
    │    ┌─────────┐
    │    │ RESULT  │  ← 점수 계산 + 보상
    │    └────┬────┘
    │         ▼
    │    ┌─────────┐
    └────│ RETRY?  │  ← 60% 미만 시 재도전 제안
         └─────────┘
```

### 6.2 Scoring

```javascript
// 난이도별 문제 수와 배점
const STAGE_CONFIG = {
  easy:   { questions: 3, pointsPerQuestion: 10 },  // 30점 만점
  normal: { questions: 3, pointsPerQuestion: 15 },  // 45점 만점
  hard:   { questions: 2, pointsPerQuestion: 25 },  // 50점 만점
  // 총 125점 만점 (하지만 난이도는 순차 해금)
};

// 난이도별 별 계산 (각 난이도 독립)
function calculateStars(correctCount, totalQuestions) {
  const rate = correctCount / totalQuestions;
  if (rate >= 1.0) return 3;
  if (rate >= 0.8) return 2;
  if (rate >= 0.6) return 1;
  return 0; // 재도전 필요
}

// 경험치 계산
function calculateExp(stars) {
  return stars * 5; // 3별 = 15exp, 2별 = 10exp, 1별 = 5exp
}

// 레벨업 기준
const EXP_PER_LEVEL = 100; // 100exp마다 레벨업
```

### 6.3 Stage Unlock Logic

```javascript
function isStageUnlocked(area, stageIndex, difficulty, progress) {
  // 첫 스테이지의 Easy는 항상 열림
  if (stageIndex === 0 && difficulty === 'easy') return true;

  // 같은 스테이지 내: 이전 난이도 클리어 필요
  if (difficulty === 'normal') {
    return isCleared(area, stageIndex, 'easy', progress);
  }
  if (difficulty === 'hard') {
    return isCleared(area, stageIndex, 'normal', progress);
  }

  // 다음 스테이지 Easy: 이전 스테이지 Hard 클리어 필요
  if (difficulty === 'easy' && stageIndex > 0) {
    return isCleared(area, stageIndex - 1, 'hard', progress);
  }

  return false;
}
```

---

## 7. Animation Specification

| Trigger | Animation | Library | Duration |
|---------|-----------|---------|----------|
| 캐릭터 선택 | bounce + scale | Framer Motion | 0.5s |
| 캐릭터 인사 | wave (좌우 흔들림) | Framer Motion | 1.0s |
| 정답 | scale up + green glow | Framer Motion | 0.3s |
| 오답 | shake (좌우 흔들림) | Framer Motion | 0.4s |
| 별 등장 | scale from 0 + rotate | Framer Motion | 0.6s (순차) |
| 레벨업 | flash + scale + confetti | Framer Motion | 1.5s |
| 스테이지 해금 | 자물쇠 깨지는 효과 | CSS + Framer | 0.8s |
| 페이지 전환 | fade + slide | Framer Motion | 0.3s |
| 말풍선 등장 | typewriter effect | CSS | 문자당 50ms |

---

## 8. Audio Specification

### 8.1 Audio File Structure

```
public/audio/
├── consonants/
│   ├── ㄱ.mp3          # "기역" 발음
│   ├── ㄱ-word.mp3     # "기린" 발음
│   └── ... (14 x 2 = 28 files)
├── vowels/
│   ├── ㅏ.mp3          # "아" 발음
│   ├── ㅏ-word.mp3     # "아이스크림" 발음
│   └── ... (10 x 2 = 20 files)
├── numbers/
│   ├── 1-kr.mp3        # "일" 발음
│   ├── 1-en.mp3        # "one" 발음
│   └── ... (10 x 2 = 20 files)
├── alphabet/
│   ├── a.mp3           # "에이" 발음
│   ├── a-word.mp3      # "apple" 발음
│   └── ... (26 x 2 = 52 files)
├── sfx/
│   ├── correct.mp3     # 정답 효과음
│   ├── wrong.mp3       # 오답 효과음
│   ├── star.mp3        # 별 등장
│   ├── levelup.mp3     # 레벨업
│   ├── click.mp3       # 버튼 클릭
│   └── unlock.mp3      # 스테이지 해금
└── characters/
    ├── dino-hello.mp3  # 캐릭터별 인사
    ├── dino-great.mp3  # 캐릭터별 칭찬
    ├── dino-tryagain.mp3
    └── ... (4캐릭터 x 3종 = 12 files)
```

### 8.2 Audio Total: ~132 files

| Category | Count | Format |
|----------|-------|--------|
| 자음 (글자+단어) | 28 | mp3, 44.1kHz, mono |
| 모음 (글자+단어) | 20 | mp3, 44.1kHz, mono |
| 숫자 (한글+영어) | 20 | mp3, 44.1kHz, mono |
| 알파벳 (글자+단어) | 52 | mp3, 44.1kHz, mono |
| 효과음 | 6 | mp3, 44.1kHz, mono |
| 캐릭터 음성 | ~12 | mp3, 44.1kHz, mono |

---

## 9. Image Asset Specification

### 9.1 Image Structure

```
public/images/
├── characters/
│   ├── dino-1.png ~ dino-4.png       # 공룡 레벨별 (4장)
│   ├── tobot-1.png ~ tobot-4.png     # 또봇 레벨별 (4장)
│   ├── elsa-1.png ~ elsa-4.png       # 엘사 레벨별 (4장)
│   └── hatchping-1.png ~ hatchping-4.png  # 하츄핑 레벨별 (4장)
├── matching/
│   ├── consonants/                    # 자음 매칭 이미지 (14장)
│   │   ├── giraffe.png, butterfly.png, ...
│   ├── vowels/                        # 모음 매칭 이미지 (10장)
│   ├── numbers/                       # 숫자 매칭 이미지 (10장)
│   └── alphabet/                      # 알파벳 매칭 이미지 (26장)
├── ui/
│   ├── logo.png                       # 로고
│   ├── star-empty.png                 # 빈 별
│   ├── star-filled.png                # 채워진 별
│   ├── lock.png                       # 자물쇠
│   └── trophy.png                     # 트로피
└── worlds/
    ├── consonant-bg.png               # 자음 나라 배경
    ├── vowel-bg.png                   # 모음 나라 배경
    ├── number-bg.png                  # 숫자 나라 배경
    └── alphabet-bg.png                # 알파벳 나라 배경
```

### 9.2 Image Sizes

| Type | Size | Format | Note |
|------|------|--------|------|
| 캐릭터 (카드) | 200x240px | PNG (투명) | 선택 화면용 |
| 캐릭터 (아바타) | 80x80px | PNG (투명) | 스테이지 내 작은 표시 |
| 매칭 이미지 | 200x200px | PNG (투명) | 학습 화면 큰 이미지 |
| 월드 배경 | 375x200px | JPG | 월드 카드 배경 |
| UI 아이콘 | 48x48px | PNG/SVG | 별, 자물쇠 등 |

---

## 10. Responsive Design

### 10.1 Breakpoints (Tailwind)

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    screens: {
      'sm': '375px',    // 작은 모바일
      'md': '768px',    // 태블릿
      'lg': '1024px',   // 큰 태블릿/데스크탑
    }
  }
}
```

### 10.2 Layout Rules

| Element | Mobile (<768px) | Tablet (768px+) |
|---------|-----------------|------------------|
| 캐릭터 카드 | 2x2 그리드 | 4x1 가로 배치 |
| 월드 카드 | 1열 세로 스크롤 | 2x2 그리드 |
| 스테이지 노드 | 3열 그리드 (80px) | 5열 그리드 (96px) |
| 4지선다 | 2x2 그리드 (64px) | 4x1 가로 (72px) |
| 캔버스 | 280x280px | 400x400px |
| 글자 크기 (학습) | 72px | 120px |

---

## 11. Error Handling

| Scenario | Handling | UX |
|----------|----------|-----|
| Web Speech API 미지원 | `useSpeech.supported = false` | 말하기 건너뛰기 버튼 표시 |
| 음성 파일 로드 실패 | try-catch + fallback | 글자만 표시, 다시 듣기 비활성화 |
| IndexedDB 접근 불가 | in-memory fallback | 경고 메시지 + 메모리 모드로 동작 |
| 캔버스 터치 미지원 | mouse event fallback | 자동 감지 (touch vs mouse) |
| 이미지 로드 실패 | placeholder + alt text | 글자 설명 텍스트로 대체 |

---

## 12. Implementation Order

### Phase 1: Core Setup (1일차)
1. [x] Vite + React + Tailwind 프로젝트 초기화
2. [ ] React Router 설정 (5개 라우트)
3. [ ] Dexie.js DB 스키마 설정
4. [ ] 정적 데이터 파일 생성 (consonants, vowels, numbers, alphabet, characters)
5. [ ] CharacterContext 설정

### Phase 2: Pages + Navigation (2일차)
6. [ ] HomePage (시작 화면)
7. [ ] SelectPage (캐릭터 선택)
8. [ ] WorldMapPage (월드맵 + 영역 카드)
9. [ ] StageGrid (스테이지 목록 + 잠금 로직)
10. [ ] 공통 컴포넌트 (BigButton, BackButton, ProgressBar)

### Phase 3: Learning Core (3~4일차)
11. [ ] EasyMode (듣기+보기 + 4지선다)
12. [ ] useAudio 훅 (음성 재생)
13. [ ] SpeechBubble (캐릭터 말풍선)
14. [ ] NormalMode (읽기 + 매칭 퀴즈)
15. [ ] useSpeech 훅 (Web Speech API)
16. [ ] HardMode (캔버스 따라쓰기 + 빈칸 채우기)
17. [ ] WritingCanvas 컴포넌트

### Phase 4: Reward + Progress (5일차)
18. [ ] useProgress 훅 (진행 상황 저장/로드)
19. [ ] Stage scoring 로직
20. [ ] RewardModal (별 + 경험치 + 레벨업)
21. [ ] Stage unlock 로직
22. [ ] CharacterAvatar (레벨별 이미지)

### Phase 5: Polish (6일차)
23. [ ] Framer Motion 애니메이션 적용
24. [ ] 효과음 통합
25. [ ] 반응형 최적화 (모바일/태블릿 테스트)
26. [ ] 에러 핸들링 + fallback

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 0.1 | 2026-03-05 | Initial design document |
