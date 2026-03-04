import { useReducer, useState, useEffect, useRef, useCallback, useMemo } from "react";

// ─────────────────────────────────────────────
// 🏨 Tamaverse — 데모 게임 (Prompt 1 + 2)
// 단일 .jsx 파일 · React + Tailwind · useReducer
// ─────────────────────────────────────────────

// ═══════════════════════════════════════════════
// 1. 상수 & 디자인 토큰
// ═══════════════════════════════════════════════

const COLORS = {
  bg: "#1a1a2e",
  bgElevated: "#16213e",
  bgSurface: "#1e2a4a",
  card: "#1c1c35",
  accent: "#e94560",
  accentHover: "#ff6b6b",
  core: "#4ecdc4",
  expansion: "#ff9f43",
  balance: "#7B61FF",
  text: "#f5f5f5",
  subtext: "#b0b8c8",
  muted: "#a0a0a0",
  eventHighlight: "rgba(233,69,96,0.12)",
  positive: "#4ecdc4",
  negative: "#e94560",
  locked: "rgba(255,255,255,0.15)",
  border: "rgba(255,255,255,0.1)",
  borderHover: "rgba(255,255,255,0.18)",
  success: "#4ecdc4",
  surface: "rgba(255,255,255,0.05)",
};

// Shared modal width — all modals MUST use this for consistent sizing
const MODAL_W = { width: 520, minWidth: 520, maxWidth: 520, boxSizing: "border-box" };

// ═══════════════════════════════════════════════
// 2. 위치 (Location) 데이터 — 7개 공간
// ═══════════════════════════════════════════════

const INITIAL_LOCATIONS = [
  { id: "lobby", name: "Lobby", floor: "1F", emoji: "🛋️", minVersion: "1.0", isLocked: false, currentNpcs: [] },
  { id: "cafe", name: "Tamaverse Brew", floor: "1F", emoji: "☕", minVersion: "1.0", isLocked: false, currentNpcs: [] },
  { id: "rooms", name: "Rooms", floor: "2F", emoji: "🛏️", minVersion: "1.0", isLocked: false, currentNpcs: [] },
  { id: "restaurant", name: "The Table", floor: "3F", emoji: "🍽️", minVersion: "1.0", isLocked: false, currentNpcs: [] },
  { id: "stage", name: "Stage Tamaverse", floor: "4F", emoji: "🎭", minVersion: "1.1", isLocked: true, currentNpcs: [] },
  { id: "skyline", name: "Skyline", floor: "5F", emoji: "🌆", minVersion: "1.2", isLocked: true, currentNpcs: [] },
  { id: "vending", name: "Vending Corner", floor: "B1F", emoji: "🏪", minVersion: "1.2", isLocked: true, currentNpcs: [] },
];

// ═══════════════════════════════════════════════
// 2-A. 프리셋 NPC 5인 데이터
// ═══════════════════════════════════════════════

const PRESET_NPCS = [
  {
    id: "haru", name: "하루", emoji: "🎨",
    description: "조용한 일러스트레이터",
    personality: { social: -1, thinking: -1, energy: -1 },
    interests: ["예술", "문학", "자연"],
    behaviorWeights: {
      lateNight: { rooms: 5, cafe: 2 },
      morning: { cafe: 5, rooms: 2, lobby: 1 },
      afternoon: { cafe: 4, rooms: 3, lobby: 1 },
      evening: { rooms: 4, restaurant: 3, cafe: 1 },
    },
  },
  {
    id: "kai", name: "카이", emoji: "🎸",
    description: "열정적인 인디 뮤지션",
    personality: { social: 1, thinking: -1, energy: 1 },
    interests: ["음악", "여행", "요리"],
    behaviorWeights: {
      lateNight: { cafe: 4, lobby: 3 },
      morning: { lobby: 3, restaurant: 3, cafe: 2 },
      afternoon: { cafe: 3, lobby: 3, restaurant: 2 },
      evening: { cafe: 3, restaurant: 4, lobby: 1 },
    },
  },
  {
    id: "mio", name: "미오", emoji: "📚",
    description: "날카로운 미스터리 작가",
    personality: { social: -1, thinking: 1, energy: -1 },
    interests: ["문학", "과학", "게임"],
    behaviorWeights: {
      lateNight: { lobby: 3, rooms: 4 },
      morning: { cafe: 5, rooms: 2 },
      afternoon: { rooms: 5, cafe: 2, lobby: 1 },
      evening: { cafe: 3, restaurant: 3, rooms: 2 },
    },
  },
  {
    id: "sora", name: "소라", emoji: "🌱",
    description: "따뜻한 정원사",
    personality: { social: 1, thinking: -1, energy: 1 },
    interests: ["자연", "요리", "사진"],
    behaviorWeights: {
      lateNight: { rooms: 5, lobby: 2 },
      morning: { lobby: 4, restaurant: 3, cafe: 1 },
      afternoon: { lobby: 3, restaurant: 3, cafe: 2 },
      evening: { cafe: 3, restaurant: 4, lobby: 1 },
    },
  },
  {
    id: "ren", name: "렌", emoji: "🎮",
    description: "쿨한 게임 디자이너",
    personality: { social: 1, thinking: 1, energy: 1 },
    interests: ["게임", "음악", "운동"],
    behaviorWeights: {
      lateNight: { lobby: 4, rooms: 3 },
      morning: { rooms: 4, cafe: 2, lobby: 2 },
      afternoon: { lobby: 3, cafe: 3, restaurant: 2 },
      evening: { restaurant: 4, lobby: 3, cafe: 1 },
    },
  },
];

// ═══════════════════════════════════════════════
// 2-B. 아바타 이모지 / 관심사 / 수트케이스
// ═══════════════════════════════════════════════

const AVATAR_EMOJIS = ["👩‍🎨", "🧑‍🏫", "🧑‍🎤", "🧑‍🚀", "🧑‍🍳", "🧑‍💻", "🧑‍🎶", "🧙"];

const INTEREST_OPTIONS = [
  { id: "예술", emoji: "🎨", label: "예술" },
  { id: "음악", emoji: "🎵", label: "음악" },
  { id: "문학", emoji: "📚", label: "문학" },
  { id: "자연", emoji: "🌿", label: "자연" },
  { id: "게임", emoji: "🎮", label: "게임" },
  { id: "요리", emoji: "🍳", label: "요리" },
  { id: "여행", emoji: "✈️", label: "여행" },
  { id: "사진", emoji: "📷", label: "사진" },
  { id: "운동", emoji: "🏃", label: "운동" },
  { id: "과학", emoji: "🔬", label: "과학" },
];

const SUITCASE_ITEMS = [
  { id: "camera", emoji: "📷", name: "빈티지 카메라", cost: 25, weight: 0.8, volume: 1.5, desc: "관찰력+2, 하루 친화+1", event: "포토 에세이 이벤트", npcAffinity: { haru: 1 } },
  { id: "ukulele", emoji: "🎸", name: "우쿨렐레", cost: 30, weight: 0.5, volume: 3.0, desc: "사교성+3, 카이 친화+2", event: "합주 이벤트", npcAffinity: { kai: 2 } },
  { id: "cookies", emoji: "🍪", name: "수제 쿠키 박스", cost: 15, weight: 0.6, volume: 1.0, desc: "온기+2, 소라 친화+1", event: "쿠키 나눔 이벤트", npcAffinity: { sora: 1 } },
  { id: "cactus", emoji: "🪴", name: "미니 선인장", cost: 10, weight: 0.4, volume: 0.8, desc: "온기+1, 전체 친화+0.5", event: null, npcAffinity: {} },
  { id: "scarf", emoji: "🧣", name: "수제 머플러", cost: 10, weight: 0.2, volume: 0.5, desc: "내향성+1, 하루 친화+0.5", event: null, npcAffinity: { haru: 0.5 } },
  { id: "notebook", emoji: "📓", name: "가죽 노트", cost: 20, weight: 0.3, volume: 0.8, desc: "지식+2, 미오 친화+1.5", event: "북클럽 이벤트", npcAffinity: { mio: 1.5 } },
  { id: "plant", emoji: "🌱", name: "미니 화분", cost: 15, weight: 0.7, volume: 1.2, desc: "온기+1, 소라 친화+1", event: "정원 가꾸기 이벤트", npcAffinity: { sora: 1 } },
  { id: "boardgame", emoji: "🎲", name: "보드게임 세트", cost: 35, weight: 1.2, volume: 2.5, desc: "사교성+3, 렌 친화+2", event: "보드게임 대회 이벤트", npcAffinity: { ren: 2 } },
  { id: "telescope", emoji: "🔭", name: "천체 망원경", cost: 30, weight: 1.5, volume: 3.5, desc: "지식+3, 미오 친화+1.5", event: "별자리 관측 이벤트", npcAffinity: { mio: 1.5 } },
  { id: "teaset", emoji: "🍵", name: "차 세트", cost: 20, weight: 0.9, volume: 1.8, desc: "온기+2, 하루 친화+1", event: "티타임 이벤트", npcAffinity: { haru: 1 } },
  { id: "perfume", emoji: "🌸", name: "핸드메이드 향수", cost: 20, weight: 0.2, volume: 0.3, desc: "매력+2, 소라 친화+1", event: "향기 조합 이벤트", npcAffinity: { sora: 1 } },
  { id: "sketchbook", emoji: "🎨", name: "스케치북 세트", cost: 15, weight: 0.4, volume: 1.0, desc: "창의력+2, 카이 친화+1", event: "즉석 드로잉 이벤트", npcAffinity: { kai: 1 } },
  { id: "vinyl", emoji: "💿", name: "바이닐 LP", cost: 25, weight: 0.3, volume: 0.8, desc: "감성+3, 렌 친화+1.5", event: "DJ 나이트 이벤트", npcAffinity: { ren: 1.5 } },
  { id: "umbrella", emoji: "☂️", name: "투명 우산", cost: 10, weight: 0.4, volume: 1.5, desc: "차분함+1, 전체 친화+0.3", event: null, npcAffinity: {} },
  { id: "polaroid", emoji: "📸", name: "즉석 사진기", cost: 20, weight: 0.5, volume: 0.6, desc: "추억+2, 전체 친화+0.5", event: "포토부스 이벤트", npcAffinity: {} },
  { id: "music_box", emoji: "🎵", name: "오르골", cost: 25, weight: 0.6, volume: 0.5, desc: "감성+3, 미오 친화+2", event: "자장가 이벤트", npcAffinity: { mio: 2 } },
];

// ═══════════════════════════════════════════════
// 2-E. 브랜디드 NPC — 루나 (v1.2+)
// ═══════════════════════════════════════════════

const BRANDED_NPC_LUNA = {
  id: "luna", name: "루나", emoji: "🧥",
  description: "LUNA Fashion 크리에이티브 디렉터",
  personality: { social: 1, thinking: -1, energy: 1 },
  interests: ["패션", "예술", "여행"],
  behaviorWeights: {
    lateNight: { skyline: 4, rooms: 3 },
    morning: { cafe: 4, lobby: 3, skyline: 1 },
    afternoon: { lobby: 4, cafe: 3, restaurant: 1 },
    evening: { restaurant: 4, skyline: 3, cafe: 1 },
  },
};

// NPCs that arrive with version upgrades (4 per version)
const VERSION_NPCS = {
  "1.1": [
    { id: "yuna", name: "유나", emoji: "🎤", description: "감성 보컬리스트", personality: { social: 1, thinking: -1, energy: 1 }, interests: ["음악", "여행", "사진"], behaviorWeights: { lateNight: { stage: 4, rooms: 3 }, morning: { cafe: 4, lobby: 2, rooms: 2 }, afternoon: { stage: 5, cafe: 2, lobby: 1 }, evening: { stage: 4, restaurant: 3, cafe: 1 } } },
    { id: "taeho", name: "태호", emoji: "🎬", description: "독립영화 감독", personality: { social: -1, thinking: 1, energy: -1 }, interests: ["예술", "문학", "사진"], behaviorWeights: { lateNight: { rooms: 5, cafe: 2 }, morning: { cafe: 5, lobby: 2 }, afternoon: { cafe: 3, lobby: 3, rooms: 2 }, evening: { restaurant: 3, cafe: 3, rooms: 2 } } },
  ],
  "1.2": [
    { id: "doyun", name: "도윤", emoji: "🏄", description: "자유로운 서퍼", personality: { social: 1, thinking: -1, energy: 1 }, interests: ["운동", "여행", "음악"], behaviorWeights: { lateNight: { rooms: 4, skyline: 3 }, morning: { skyline: 5, cafe: 2, lobby: 1 }, afternoon: { skyline: 4, cafe: 2, lobby: 2 }, evening: { restaurant: 4, skyline: 3, lobby: 1 } } },
    { id: "haeun", name: "하은", emoji: "🎻", description: "클래식 첼리스트", personality: { social: -1, thinking: 1, energy: -1 }, interests: ["음악", "문학", "예술"], behaviorWeights: { lateNight: { rooms: 5, stage: 2 }, morning: { cafe: 4, rooms: 3, stage: 1 }, afternoon: { stage: 4, rooms: 3, cafe: 1 }, evening: { stage: 5, restaurant: 2, cafe: 1 } } },
  ],
};

// ═══════════════════════════════════════════════
// 2-F. 버전업 내용 데이터
// ═══════════════════════════════════════════════

const VERSION_UPDATES = {
  "1.1": {
    title: "v1.1 — 콘텐츠 확장",
    features: [
      { emoji: "🎭", text: "4F 스테이지 Tamaverse 개방" },
      { emoji: "🎨", text: "공동창작 라이브러리: 새 아이템 & 이벤트" },
      { emoji: "☕", text: "MORI 커피 콜라보레이션 메뉴" },
      { emoji: "🧥", text: "LUNA 패션 브랜디드 아이템" },
      { emoji: "🎵", text: "음악실 스테이지 이벤트" },
    ],
  },
  "1.2": {
    title: "v1.2 — 생태계 연결",
    features: [
      { emoji: "🌆", text: "5F 루프탑 '스카이라인' 개방" },
      { emoji: "🏪", text: "B1F 자판기 실물 교환 기능" },
      { emoji: "💰", text: "OSYZ 메인 크레딧 연동" },
      { emoji: "🧥", text: "브랜디드 NPC '루나' (LUNA 패션) 입주" },
    ],
  },
  "1.3": {
    title: "v1.3 — 트랜스미디어",
    features: [
      { emoji: "📤", text: "스토리 내보내기 기능" },
      { emoji: "📺", text: "외부 채널 송출 시뮬레이션" },
      { emoji: "📊", text: "트랜스미디어 대시보드" },
      { emoji: "🎬", text: "IP 확장 추천 보고서" },
      { emoji: "📋", text: "콘텐츠 하이라이트 모음" },
    ],
  },
};

// ═══════════════════════════════════════════════
// 3. 액션 타입
// ═══════════════════════════════════════════════

const ACTION = {
  SET_PHASE: "SET_PHASE",
  SET_CASTING_STEP: "SET_CASTING_STEP",
  SET_CUSTOM_NPC_NAME: "SET_CUSTOM_NPC_NAME",
  SET_CUSTOM_NPC_EMOJI: "SET_CUSTOM_NPC_EMOJI",
  SET_CUSTOM_NPC_PERSONALITY: "SET_CUSTOM_NPC_PERSONALITY",
  SET_CUSTOM_NPC_INTERESTS: "SET_CUSTOM_NPC_INTERESTS",
  TOGGLE_SUITCASE_ITEM: "TOGGLE_SUITCASE_ITEM",
  COMPLETE_CASTING: "COMPLETE_CASTING",
  SIMULATION_TICK: "SIMULATION_TICK",
  SET_SPEED: "SET_SPEED",
  SET_RUNNING: "SET_RUNNING",
  UPDATE_NPC_LOCATION: "UPDATE_NPC_LOCATION",
  UPDATE_NPC_ACTIVITY: "UPDATE_NPC_ACTIVITY",
  UPDATE_NPC_MOOD: "UPDATE_NPC_MOOD",
  SET_BEHAVIOR_DIRECTIVE: "SET_BEHAVIOR_DIRECTIVE",
  UPDATE_RELATIONSHIP: "UPDATE_RELATIONSHIP",
  ADD_CONTENT: "ADD_CONTENT",
  ADD_FEED_ITEM: "ADD_FEED_ITEM",
  ADD_EVENT_LOG: "ADD_EVENT_LOG",
  VERSION_UP: "VERSION_UP",
  VERSION_DOWN: "VERSION_DOWN",
  SET_ACTIVE_TAB: "SET_ACTIVE_TAB",
  SET_SELECTED_SPACE: "SET_SELECTED_SPACE",
  OPEN_MODAL: "OPEN_MODAL",
  CLOSE_MODAL: "CLOSE_MODAL",
  SET_MAP: "SET_MAP",
  SET_CONTENT_FILTER: "SET_CONTENT_FILTER",
  ADD_BRANDED_NPC: "ADD_BRANDED_NPC",
  SET_STORY_EXPORT: "SET_STORY_EXPORT",
  ADD_COUPON: "ADD_COUPON",
  TOGGLE_FEED_PAUSE: "TOGGLE_FEED_PAUSE",
  CLEAR_FEED: "CLEAR_FEED",
  SET_RELATION_FOCUS: "SET_RELATION_FOCUS",
  TOGGLE_DIRECTIVE_QUEUE: "TOGGLE_DIRECTIVE_QUEUE",
  CONSUME_DIRECTIVE: "CONSUME_DIRECTIVE",
  SCHEDULE_NPC_ARRIVALS: "SCHEDULE_NPC_ARRIVALS",
  ARRIVE_PENDING_NPC: "ARRIVE_PENDING_NPC",
  ADD_NPC_BUBBLE: "ADD_NPC_BUBBLE",
};

// ═══════════════════════════════════════════════
// 4. 초기 상태
// ═══════════════════════════════════════════════

const INITIAL_STATE = {
  appPhase: "intro",
  castingStep: null,
  currentVersion: "1.0",
  simulation: { isRunning: false, speed: 1, gameTime: 480, gameDay: 1, realStartTime: null },
  npcs: { custom: null, presets: [], branded: [] },
  npcStates: {},
  relationships: [],
  eventLog: [],
  contents: [],
  liveFeed: [],
  locations: INITIAL_LOCATIONS.map((l) => ({ ...l })),
  ui: { activeRightTab: "myNpc", selectedSpaceId: null, modalOpen: null, modalData: null, contentFilter: { npcId: "all", type: "all" }, mapFloor: "1F", mapSplit: 6, feedPaused: false, relationFocusNpc: null },
  previousVersion: "1.0",
  credits: 500,
  storyExport: { selectedOptions: [], previewGenerated: false },
  coupons: [],
  pendingArrivals: [], // NPCs scheduled to arrive: { npc, arrivalTick }
  npcBubbles: {}, // { [npcId]: { icon, time } } - floating icons on map
  castingDraft: { name: "", emoji: null, personality: { social: 0, thinking: 0, energy: 0 }, interests: [], suitcaseItems: [] },
};

// ═══════════════════════════════════════════════
// 5. 리듀서
// ═══════════════════════════════════════════════

const VERSION_ORDER = ["1.0", "1.1", "1.2", "1.3"];

function gameReducer(state, action) {
  switch (action.type) {
    case ACTION.SET_PHASE: return { ...state, appPhase: action.payload };
    case ACTION.SET_CASTING_STEP: return { ...state, castingStep: action.payload };
    case ACTION.SET_CUSTOM_NPC_NAME: return { ...state, castingDraft: { ...state.castingDraft, name: action.payload } };
    case ACTION.SET_CUSTOM_NPC_EMOJI: return { ...state, castingDraft: { ...state.castingDraft, emoji: action.payload } };
    case ACTION.SET_CUSTOM_NPC_PERSONALITY: return { ...state, castingDraft: { ...state.castingDraft, personality: { ...state.castingDraft.personality, ...action.payload } } };
    case ACTION.SET_CUSTOM_NPC_INTERESTS: return { ...state, castingDraft: { ...state.castingDraft, interests: action.payload } };
    case ACTION.TOGGLE_SUITCASE_ITEM: {
      const id = action.payload;
      const cur = state.castingDraft.suitcaseItems;
      const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
      return { ...state, castingDraft: { ...state.castingDraft, suitcaseItems: next } };
    }
    case ACTION.COMPLETE_CASTING:
      return { ...state, appPhase: "simulation", castingStep: null, npcs: action.payload.npcs, npcStates: action.payload.npcStates, relationships: action.payload.relationships, simulation: { ...state.simulation, isRunning: true, realStartTime: Date.now() } };
    case ACTION.SIMULATION_TICK: {
      const nt = state.simulation.gameTime + 10 * state.simulation.speed;
      const over = nt >= 1440;
      return { ...state, simulation: { ...state.simulation, gameTime: over ? nt - 1440 : nt, gameDay: over ? state.simulation.gameDay + 1 : state.simulation.gameDay } };
    }
    case ACTION.SET_SPEED: return { ...state, simulation: { ...state.simulation, speed: action.payload } };
    case ACTION.SET_RUNNING: return { ...state, simulation: { ...state.simulation, isRunning: action.payload } };
    case ACTION.UPDATE_NPC_LOCATION: return { ...state, npcStates: { ...state.npcStates, [action.payload.npcId]: { ...state.npcStates[action.payload.npcId], currentLocation: action.payload.location } } };
    case ACTION.UPDATE_NPC_ACTIVITY: return { ...state, npcStates: { ...state.npcStates, [action.payload.npcId]: { ...state.npcStates[action.payload.npcId], currentActivity: action.payload.activity } } };
    case ACTION.UPDATE_NPC_MOOD: return { ...state, npcStates: { ...state.npcStates, [action.payload.npcId]: { ...state.npcStates[action.payload.npcId], mood: action.payload.mood } } };
    case ACTION.SET_BEHAVIOR_DIRECTIVE: return { ...state, npcStates: { ...state.npcStates, [action.payload.npcId]: { ...state.npcStates[action.payload.npcId], behaviorDirective: action.payload.directive } } };
    case ACTION.TOGGLE_DIRECTIVE_QUEUE: {
      const npcId = action.payload.npcId, dir = action.payload.directive;
      const ns = state.npcStates[npcId] || {};
      const queue = ns.directiveQueue || [];
      const idx = queue.indexOf(dir);
      let newQ;
      if (idx >= 0) { newQ = queue.filter((_, i) => i !== idx); }
      else if (queue.length < 6) { newQ = [...queue, dir]; }
      else { newQ = queue; }
      return { ...state, npcStates: { ...state.npcStates, [npcId]: { ...ns, directiveQueue: newQ } } };
    }
    case ACTION.CONSUME_DIRECTIVE: {
      const npcId = action.payload.npcId;
      const ns = state.npcStates[npcId] || {};
      const queue = ns.directiveQueue || [];
      if (queue.length === 0) return state;
      const newQ = queue.slice(1); // Remove first item, shift rest forward
      return { ...state, npcStates: { ...state.npcStates, [npcId]: { ...ns, directiveQueue: newQ } } };
    }
    case ACTION.SCHEDULE_NPC_ARRIVALS: {
      // payload: { npcs: [...npcData], baseTime: currentGameTime, baseDay: currentDay }
      const { npcs: newNpcs, baseTime, baseDay } = action.payload;
      const baseAbs = (baseDay || 1) * 1440 + baseTime;
      const arrivals = newNpcs.map((npc, i) => ({
        npc,
        arrivalAbs: baseAbs + (i + 1) * 60, // stagger by 60 game-minutes each
      }));
      return { ...state, pendingArrivals: [...(state.pendingArrivals || []), ...arrivals] };
    }
    case ACTION.ARRIVE_PENDING_NPC: {
      const npc = action.payload;
      const newBranded = [...(state.npcs.branded || []), npc];
      const newNpcStates = { ...state.npcStates };
      const loc = npc.behaviorWeights.morning ? Object.keys(npc.behaviorWeights.morning)[0] : "lobby";
      newNpcStates[npc.id] = { currentLocation: loc, currentActivity: "체크인하는 중", mood: "😊", behaviorDirective: null, directiveQueue: [] };
      // Create relationships with all existing NPCs
      const allExisting = [...(state.npcs.presets || []), state.npcs.custom, ...(state.npcs.branded || [])].filter(Boolean);
      const newRels = allExisting.map(ex => ({ npcA: npc.id, npcB: ex.id, score: 0, history: [] }));
      return { ...state, npcs: { ...state.npcs, branded: newBranded }, npcStates: newNpcStates, relationships: [...state.relationships, ...newRels], pendingArrivals: (state.pendingArrivals || []).filter(a => a.npc.id !== npc.id) };
    }
    case ACTION.ADD_NPC_BUBBLE: {
      const { npcId, icon } = action.payload;
      return { ...state, npcBubbles: { ...state.npcBubbles, [npcId]: { icon, time: Date.now() } } };
    }
    case ACTION.SET_RELATION_FOCUS: return { ...state, ui: { ...state.ui, relationFocusNpc: action.payload } };
    case ACTION.UPDATE_RELATIONSHIP: {
      const { npcA, npcB, change, event, time } = action.payload;
      const ex = state.relationships.find((r) => (r.npcA === npcA && r.npcB === npcB) || (r.npcA === npcB && r.npcB === npcA));
      if (ex) return { ...state, relationships: state.relationships.map((r) => (r.npcA === npcA && r.npcB === npcB) || (r.npcA === npcB && r.npcB === npcA) ? { ...r, score: r.score + change, history: [...r.history, { time, event, change }] } : r) };
      return { ...state, relationships: [...state.relationships, { npcA, npcB, score: change, history: [{ time, event, change }] }] };
    }
    case ACTION.ADD_CONTENT: return { ...state, contents: [...state.contents, action.payload] };
    case ACTION.ADD_FEED_ITEM: { if (state.ui.feedPaused) return state; const f = [...state.liveFeed, action.payload]; return { ...state, liveFeed: f.length > 200 ? f.slice(-200) : f }; }
    case ACTION.ADD_EVENT_LOG: return { ...state, eventLog: [...state.eventLog, action.payload] };
    case ACTION.VERSION_UP: { const i = VERSION_ORDER.indexOf(state.currentVersion); if (i >= VERSION_ORDER.length - 1) return state; const nv = VERSION_ORDER[i + 1]; return { ...state, previousVersion: state.currentVersion, currentVersion: nv, locations: state.locations.map((l) => parseFloat(l.minVersion) <= parseFloat(nv) ? { ...l, isLocked: false } : l) }; }
    case ACTION.VERSION_DOWN: { const i = VERSION_ORDER.indexOf(state.currentVersion); if (i <= 0) return state; const pv = VERSION_ORDER[i - 1]; return { ...state, previousVersion: state.currentVersion, currentVersion: pv, locations: state.locations.map((l) => parseFloat(l.minVersion) > parseFloat(pv) ? { ...l, isLocked: true } : l) }; }
    case ACTION.SET_ACTIVE_TAB: return { ...state, ui: { ...state.ui, activeRightTab: action.payload } };
    case ACTION.SET_SELECTED_SPACE: return { ...state, ui: { ...state.ui, selectedSpaceId: action.payload } };
    case ACTION.OPEN_MODAL: return { ...state, ui: { ...state.ui, modalOpen: action.payload.modal, modalData: action.payload.data || null } };
    case ACTION.CLOSE_MODAL: return { ...state, ui: { ...state.ui, modalOpen: null, modalData: null } };
    case ACTION.SET_MAP: return { ...state, ui: { ...state.ui, mapFloor: action.payload.floor ?? state.ui.mapFloor, mapSplit: action.payload.split ?? state.ui.mapSplit } };
    case ACTION.SET_CONTENT_FILTER: return { ...state, ui: { ...state.ui, contentFilter: { ...state.ui.contentFilter, ...action.payload } } };
    case ACTION.ADD_BRANDED_NPC: {
      const npc = action.payload;
      const newBranded = [...(state.npcs.branded || []), npc];
      const newNpcStates = { ...state.npcStates, [npc.id]: { currentLocation: "lobby", currentActivity: "체크인하는 중", mood: "😊", behaviorDirective: null, directiveQueue: [] } };
      // Add relationships with all existing NPCs
      const allExisting = [...(state.npcs.presets || []), state.npcs.custom, ...(state.npcs.branded || [])].filter(Boolean);
      const newRels = allExisting.map((n) => ({ npcA: npc.id, npcB: n.id, score: 0, history: [] }));
      return { ...state, npcs: { ...state.npcs, branded: newBranded }, npcStates: newNpcStates, relationships: [...state.relationships, ...newRels] };
    }
    case ACTION.SET_STORY_EXPORT: return { ...state, storyExport: { ...state.storyExport, ...action.payload } };
    case ACTION.ADD_COUPON: return { ...state, coupons: [...state.coupons, action.payload] };
    case ACTION.TOGGLE_FEED_PAUSE: return { ...state, ui: { ...state.ui, feedPaused: !state.ui.feedPaused } };
    case ACTION.CLEAR_FEED: return { ...state, liveFeed: [] };
    default: return state;
  }
}

// ═══════════════════════════════════════════════
// 6. 유틸리티
// ═══════════════════════════════════════════════

function formatGameTime(m) { const x = ((m % 1440) + 1440) % 1440; return `${String(Math.floor(x / 60)).padStart(2, "0")}:${String(x % 60).padStart(2, "0")}`; }
function getTimePeriod(m) { const x = ((m % 1440) + 1440) % 1440; if (x < 360) return "lateNight"; if (x < 720) return "morning"; if (x < 1080) return "afternoon"; return "evening"; }
function versionGte(c, t) { return parseFloat(c) >= parseFloat(t); }

function personalityLabel(axis, val) {
  const L = { social: { "-1": "내향적", "1": "외향적" }, thinking: { "-1": "감성적", "1": "분석적" }, energy: { "-1": "차분한", "1": "활동적" } };
  return L[axis]?.[String(val)] || "";
}
function personalityTags(p) { return ["social", "thinking", "energy"].map((a) => personalityLabel(a, p[a])).filter(Boolean); }

// ═══════════════════════════════════════════════
// 6-A. 시뮬레이션 엔진 (Prompt 4)
// ═══════════════════════════════════════════════

// ── 행동/활동 템플릿 ──
const ACTIVITIES = {
  lobby: ["소파에 앉아 쉬는 중", "로비를 거니는 중", "프론트 데스크와 대화 중", "체크인 안내판을 보는 중"],
  cafe: ["커피를 마시는 중", "창가에 앉아 독서 중", "디저트를 고르는 중", "노트에 무언가를 적는 중"],
  rooms: ["객실에서 휴식 중", "음악을 듣는 중", "짐을 정리하는 중", "창밖을 바라보는 중"],
  restaurant: ["식사 중", "메뉴를 고르는 중", "차를 마시는 중", "새로운 요리를 시도하는 중"],
  stage: ["공연을 감상하는 중", "무대 뒤를 구경하는 중", "오디션 준비 중", "악기를 만지는 중"],
  skyline: ["야경을 감상하는 중", "사진을 찍는 중", "바람을 쐬는 중", "별을 바라보는 중"],
  vending: ["자판기를 살펴보는 중", "음료를 고르는 중", "간식을 먹는 중"],
};

const MOODS = ["😊", "😌", "🤔", "😄", "😴", "🥰", "😎", "🙂", "😤", "😒", "😓", "🫤"];

const INTERACTION_TEMPLATES = [
  { text: (a, b) => `${a.emoji} ${a.name}과(와) ${b.emoji} ${b.name}이(가) 가볍게 인사를 나눴다.`, change: 0.3, type: "action" },
  { text: (a, b) => `${a.emoji} ${a.name}이(가) ${b.emoji} ${b.name}에게 말을 걸었다.`, change: 0.5, type: "dialogue" },
  { text: (a, b) => `${a.emoji} ${a.name}과(와) ${b.emoji} ${b.name}이(가) 이야기꽃을 피우고 있다.`, change: 1.0, type: "dialogue" },
  { text: (a, b) => `${a.emoji} ${a.name}이(가) ${b.emoji} ${b.name}에게 관심을 보이고 있다.`, change: 0.8, type: "action" },
  { text: (a, b) => `${a.emoji} ${a.name}과(와) ${b.emoji} ${b.name}이(가) 함께 웃고 있다.`, change: 1.2, type: "dialogue" },
];

const NEGATIVE_INTERACTION_TEMPLATES = [
  { text: (a, b) => `${a.emoji} ${a.name}이(가) ${b.emoji} ${b.name}의 말에 표정이 굳었다.`, change: -0.5, type: "dialogue" },
  { text: (a, b) => `${a.emoji} ${a.name}과(와) ${b.emoji} ${b.name} 사이에 어색한 침묵이 흘렀다.`, change: -0.3, type: "action" },
  { text: (a, b) => `${a.emoji} ${a.name}이(가) ${b.emoji} ${b.name}의 의견에 반박했다.`, change: -0.8, type: "dialogue" },
  { text: (a, b) => `${a.emoji} ${a.name}과(와) ${b.emoji} ${b.name}이(가) 같은 자리를 두고 경쟁했다.`, change: -0.6, type: "action" },
  { text: (a, b) => `${a.emoji} ${a.name}이(가) ${b.emoji} ${b.name}을(를) 무시하고 지나쳤다.`, change: -0.4, type: "action" },
  { text: (a, b) => `${a.emoji} ${a.name}과(와) ${b.emoji} ${b.name}이(가) 소리를 높이며 논쟁 중이다.`, change: -1.0, type: "dialogue" },
  { text: (a, b) => `${a.emoji} ${a.name}이(가) ${b.emoji} ${b.name}의 취향을 은근히 비꼬았다.`, change: -0.7, type: "dialogue" },
  { text: (a, b) => `${a.emoji} ${a.name}과(와) ${b.emoji} ${b.name}이(가) 서로 다른 방향으로 걸어갔다.`, change: -0.2, type: "action" },
];

const CONFLICT_INTEREST_INTERACTIONS = {
  "예술": [(a, b) => `${a.emoji} ${a.name}과(와) ${b.emoji} ${b.name}이(가) 예술 철학을 놓고 격하게 토론했다.`],
  "음악": [(a, b) => `${a.emoji} ${a.name}이(가) ${b.emoji} ${b.name}의 음악 취향을 이해할 수 없다는 표정이다.`],
  "문학": [(a, b) => `${a.emoji} ${a.name}과(와) ${b.emoji} ${b.name}이(가) 결말 해석을 두고 의견 충돌했다.`],
  "게임": [(a, b) => `${a.emoji} ${a.name}과(와) ${b.emoji} ${b.name}이(가) 게임에서 승부를 가리고 있다. 분위기가 뜨겁다.`],
  "요리": [(a, b) => `${a.emoji} ${a.name}과(와) ${b.emoji} ${b.name}이(가) 레시피 정통성을 두고 다투었다.`],
  "사진": [(a, b) => `${a.emoji} ${a.name}이(가) ${b.emoji} ${b.name}의 사진을 허락 없이 올려서 갈등이 생겼다.`],
  "운동": [(a, b) => `${a.emoji} ${a.name}과(와) ${b.emoji} ${b.name}이(가) 운동 방식을 두고 신경전을 벌이고 있다.`],
};

const INTEREST_INTERACTIONS = {
  "예술": [
    (a, b) => `${a.emoji} ${a.name}과(와) ${b.emoji} ${b.name}이(가) 예술에 대해 토론하고 있다.`,
    (a, b) => `${a.emoji} ${a.name}이(가) ${b.emoji} ${b.name}에게 스케치를 보여주고 있다.`,
  ],
  "음악": [
    (a, b) => `${a.emoji} ${a.name}과(와) ${b.emoji} ${b.name}이(가) 좋아하는 음악을 공유하고 있다.`,
    (a, b) => `${a.emoji} ${a.name}이(가) ${b.emoji} ${b.name}에게 노래를 들려주고 있다.`,
  ],
  "문학": [
    (a, b) => `${a.emoji} ${a.name}과(와) ${b.emoji} ${b.name}이(가) 책 이야기를 나누고 있다.`,
  ],
  "자연": [
    (a, b) => `${a.emoji} ${a.name}과(와) ${b.emoji} ${b.name}이(가) 식물을 함께 가꾸고 있다.`,
  ],
  "게임": [
    (a, b) => `${a.emoji} ${a.name}과(와) ${b.emoji} ${b.name}이(가) 게임을 하고 있다.`,
  ],
  "요리": [
    (a, b) => `${a.emoji} ${a.name}과(와) ${b.emoji} ${b.name}이(가) 레시피를 교환하고 있다.`,
  ],
  "여행": [
    (a, b) => `${a.emoji} ${a.name}과(와) ${b.emoji} ${b.name}이(가) 여행 이야기를 나누고 있다.`,
  ],
  "사진": [
    (a, b) => `${a.emoji} ${a.name}이(가) ${b.emoji} ${b.name}의 사진을 찍어주고 있다.`,
  ],
  "운동": [
    (a, b) => `${a.emoji} ${a.name}과(와) ${b.emoji} ${b.name}이(가) 스트레칭을 하고 있다.`,
  ],
  "과학": [
    (a, b) => `${a.emoji} ${a.name}과(와) ${b.emoji} ${b.name}이(가) 과학 이야기를 나누고 있다.`,
  ],
};

const SOLO_ACTIONS = {
  lobby: [
    (n) => `${n.emoji} ${n.name}이(가) 로비를 서성이고 있다.`,
    (n) => `${n.emoji} ${n.name}이(가) 로비 소파에 앉아 생각에 잠겼다.`,
  ],
  cafe: [
    (n) => `${n.emoji} ${n.name}이(가) 커피 한 잔을 주문했다.`,
    (n) => `${n.emoji} ${n.name}이(가) 카페 창가 자리에 앉았다.`,
  ],
  rooms: [
    (n) => `${n.emoji} ${n.name}이(가) 객실에서 쉬고 있다.`,
  ],
  restaurant: [
    (n) => `${n.emoji} ${n.name}이(가) 식사를 즐기고 있다.`,
    (n) => `${n.emoji} ${n.name}이(가) 메뉴판을 살펴보고 있다.`,
  ],
  stage: [(n) => `${n.emoji} ${n.name}이(가) 스테이지를 둘러보고 있다.`],
  skyline: [(n) => `${n.emoji} ${n.name}이(가) 스카이라인에서 경치를 감상 중이다.`],
  vending: [(n) => `${n.emoji} ${n.name}이(가) 자판기에서 음료를 고르고 있다.`],
};

const DIARY_TEMPLATES = [
  (n, day) => ({ title: `Day ${day}의 기록`, mood: "🌤️", weather: "맑음", body: `오늘은 Day ${day}. 타마버스 생활이 점점 익숙해지고 있다. ${n.interests[0]}에 대해 깊이 생각해본 하루였다.\n\n아침에 일어나 창밖을 보니 햇살이 로비까지 들어왔다. 조식을 먹으며 어제 만난 사람들을 떠올렸다. 오후에는 혼자만의 시간을 가지며 ${n.interests[0]}에 몰두했다.\n\n내일은 좀 더 용기를 내서 새로운 공간을 탐험해봐야겠다. 이 타마버스에는 아직 가보지 못한 곳이 많다.`, ps: `P.S. ${n.interests[1] || n.interests[0]}도 해보고 싶다` }),
  (n, day) => ({ title: `새로운 만남`, mood: "😊", weather: "흐림", body: `Day ${day} 일기.\n\n새로운 사람들과의 만남이 즐거웠다. 특히 로비에서 우연히 마주친 사람과 ${n.interests[0]} 이야기를 나눌 수 있었다.\n\n대화 중에 서로의 취미가 비슷하다는 걸 알게 되었고, 다음에 함께 ${n.interests[1] || n.interests[0]}을(를) 해보기로 약속했다.\n\n사람과 사람 사이의 연결이란 참 신기하다. 같은 공간에 있다는 것만으로 이렇게 가까워질 수 있다니.`, ps: "내일이 벌써 기대된다" }),
  (n, day) => ({ title: `벌써 Day ${day}`, mood: "🌙", weather: "별이 빛나는 밤", body: `벌써 Day ${day}이라니. 이 타마버스에서의 시간이 특별하게 느껴진다.\n\n오늘은 좀 조용히 지냈다. ${n.interests[0]}을(를) 하면서 나 자신과 대화하는 시간을 가졌다. 때로는 이런 고요한 순간이 필요한 법이다.\n\n저녁에 옥상에 올라가니 하늘이 정말 예뻤다. 여기 있는 동안 이 풍경을 자주 봐야겠다.\n\n오늘의 한 줄: 가끔은 천천히 가는 것도 괜찮다.`, ps: null }),
  (n, day) => ({ title: `특별한 하루`, mood: "⭐", weather: "따뜻함", body: `Day ${day}.\n\n오늘은 유독 특별한 하루였다. ${n.interests[0]}을(를) 하다가 예상치 못한 즐거움을 발견했다.\n\n타마버스의 각 층마다 분위기가 다르다는 걸 새삼 느꼈다. 1층 로비의 편안함, 레스토랑의 따스한 조명, 루프탑의 시원한 바람까지.\n\n이런 공간에서 지내다 보면 일상에서 놓치고 있던 소소한 행복들이 보이기 시작한다.`, ps: `${n.interests[1] || "여행"}의 진짜 의미를 알 것 같다` }),
  (n, day) => ({ title: `생각이 많은 밤`, mood: "🌜", weather: "안개", body: `Day ${day}, 늦은 밤.\n\n잠이 오지 않아 일기를 쓴다. 요즘 ${n.interests[0]}에 대해 새로운 시각이 생기고 있다.\n\n여기서 만난 사람들은 저마다 다른 이야기를 품고 있었다. 그 다양한 이야기들이 한 공간에서 교차하는 게 타마버스에서 펼쳐지는 다마고치 이야기의 매력인 것 같다.\n\n내일은 어떤 하루가 될까. 그 불확실함이 두렵기도 하지만, 동시에 설레기도 하다.`, ps: null }),
];

const SNS_TEMPLATES = [
  (n, loc) => ({ platform: "Tamaverse_gram", handle: `@${n.name.toLowerCase().replace(/\s/g, "_")}`, body: `📍 ${loc}에서 보내는 여유로운 오후`, hashtags: [`#Tamaverse`, `#${n.interests[0]}`, `#타마버스라이프`, `#${loc.replace(/\s/g, "")}`], likes: Math.floor(Math.random() * 200) + 50, comments: [{ user: "타마버스지기", text: "좋은 시간 보내세요! ✨" }], img: "☕🏨" }),
  (n) => ({ platform: "Tamaverse_gram", handle: `@${n.name.toLowerCase().replace(/\s/g, "_")}`, body: `오늘 하루도 감사한 마음으로 ✨\n이 타마버스에서의 매일이 선물 같다`, hashtags: [`#일상`, `#${n.interests[0]}`, `#타마버스생활`, `#감성`], likes: Math.floor(Math.random() * 150) + 30, comments: [{ user: "여행자", text: "분위기 최고 👏" }, { user: "감성러버", text: "나도 가고 싶다 🥺" }], img: "✨🌿" }),
  (n, loc) => ({ platform: "Tamaverse_gram", handle: `@${n.name.toLowerCase().replace(/\s/g, "_")}`, body: `${loc}의 분위기에 취하는 중 🏨\n${n.interests[0]}을(를) 좋아하는 사람이라면 꼭 와봐야 할 곳`, hashtags: [`#${n.interests[1] || n.interests[0]}`, `#Tamaverse`, `#추천`, `#힐링`], likes: Math.floor(Math.random() * 300) + 80, comments: [{ user: "팔로워1", text: "여기 어디야?!" }, { user: "팔로워2", text: "사진 더 올려줘 📸" }], img: "🏨🌅" }),
  (n, loc) => ({ platform: "Tamaverse_gram", handle: `@${n.name.toLowerCase().replace(/\s/g, "_")}`, body: `오늘의 ${n.interests[0]} 기록 📝\n매일 조금씩 성장하는 느낌이 좋다`, hashtags: [`#성장`, `#${n.interests[0]}일기`, `#타마버스`, `#기록`], likes: Math.floor(Math.random() * 120) + 40, comments: [{ user: "응원단", text: "멋져요! 화이팅! 💪" }], img: "📝💪" }),
];

// ── 엔진 함수: NPC 위치 결정 ──
function pickLocation(npc, period, locations, directive, directiveQueue) {
  const weights = { ...(npc.behaviorWeights[period] || {}) };
  // directive queue 가중치 (슬롯 순서대로 감소) — amenity ID를 location ID로 변환
  const queue = directiveQueue || (directive ? [directive] : []);
  queue.forEach((dir, i) => {
    const locId = AMENITY_TO_LOC[dir] || dir; // amenity ID → location ID, fallback to direct
    if (locId && weights[locId] !== undefined) {
      weights[locId] = (weights[locId] || 0) + Math.max(2, 8 - i * 1.5);
    }
  });
  // 잠긴 장소 제거
  const locked = new Set(locations.filter((l) => l.isLocked).map((l) => l.id));
  const entries = Object.entries(weights).filter(([loc]) => !locked.has(loc));
  if (entries.length === 0) return "lobby";
  const total = entries.reduce((s, [, w]) => s + w, 0);
  let r = Math.random() * total;
  for (const [loc, w] of entries) { r -= w; if (r <= 0) return loc; }
  return entries[0][0];
}

// ── 엔진 함수: 공유 관심사 찾기 ──
function findSharedInterests(npcA, npcB) {
  return (npcA.interests || []).filter((i) => (npcB.interests || []).includes(i));
}

// ── 엔진 함수: 피드 ID 생성 ──
let feedCounter = 0;
function nextFeedId() { return `f${Date.now()}-${++feedCounter}`; }

// ── 메인 시뮬레이션 훅 ──
function useSimulationEngine(state, dispatch) {
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    if (!state.simulation.isRunning || state.simulation.speed === 0) return;

    const TICK_MS = 3000; // 3초마다 틱
    const interval = setInterval(() => {
      const s = stateRef.current;
      const { gameTime, gameDay, speed } = s.simulation;
      const newTime = gameTime + 10 * speed;
      const dayRolled = newTime >= 1440;
      const actualTime = dayRolled ? newTime - 1440 : newTime;
      const actualDay = dayRolled ? gameDay + 1 : gameDay;
      const period = getTimePeriod(actualTime);
      const timeStr = formatGameTime(actualTime);
      const allNpcs = getAllNpcs(s);

      // ── 1. NPC 이동 (확률적) ──
      allNpcs.forEach((npc) => {
        if (Math.random() < 0.35) { // 35% 확률로 이동 시도
          const ns = s.npcStates[npc.id];
          const newLoc = pickLocation(npc, period, s.locations, ns?.behaviorDirective, ns?.directiveQueue);
          const oldLoc = ns?.currentLocation;
          if (newLoc !== oldLoc) {
            dispatch({ type: ACTION.UPDATE_NPC_LOCATION, payload: { npcId: npc.id, location: newLoc } });
            const locName = s.locations.find((l) => l.id === newLoc)?.name || newLoc;
            dispatch({ type: ACTION.ADD_FEED_ITEM, payload: { id: nextFeedId(), type: "action", text: `${npc.emoji} ${npc.name}이(가) ${locName}(으)로 이동했다.`, time: timeStr, day: actualDay } });
            // Consume directive queue: if first queue item maps to this location, shift queue
            const queue = ns?.directiveQueue || [];
            if (queue.length > 0) {
              const firstDir = queue[0];
              const targetLoc = AMENITY_TO_LOC[firstDir] || firstDir;
              if (targetLoc === newLoc) {
                dispatch({ type: ACTION.CONSUME_DIRECTIVE, payload: { npcId: npc.id } });
                const amenity = Object.values(FLOOR_AMENITIES).flat().find(a => a.id === firstDir);
                if (amenity) {
                  dispatch({ type: ACTION.ADD_FEED_ITEM, payload: { id: nextFeedId(), type: "event", text: `🎯 ${npc.emoji} ${npc.name}이(가) ${amenity.emoji} ${amenity.name}에서 지시를 수행했다.`, time: timeStr, day: actualDay } });
                }
              }
            }
          }
          // 활동 업데이트
          const acts = ACTIVITIES[newLoc] || ACTIVITIES.lobby;
          dispatch({ type: ACTION.UPDATE_NPC_ACTIVITY, payload: { npcId: npc.id, activity: acts[Math.floor(Math.random() * acts.length)] } });
        }
      });

      // ── 1b. 대기 중 NPC 도착 체크 ──
      const pending = s.pendingArrivals || [];
      if (pending.length > 0) {
        const currentAbs = actualDay * 1440 + actualTime;
        pending.forEach(pa => {
          if (currentAbs >= pa.arrivalAbs) {
            dispatch({ type: ACTION.ARRIVE_PENDING_NPC, payload: pa.npc });
            dispatch({ type: ACTION.ADD_FEED_ITEM, payload: { id: nextFeedId(), type: "event", text: `🧳 ${pa.npc.emoji} ${pa.npc.name}이(가) Tamaverse에 체크인했습니다!`, time: timeStr, day: actualDay } });
            dispatch({ type: ACTION.ADD_EVENT_LOG, payload: { type: "checkin", title: `${pa.npc.name} 체크인`, description: `${pa.npc.description} ${pa.npc.name}이(가) 타마버스에 입주했습니다.`, day: actualDay, time: timeStr, npcsInvolved: [pa.npc.id] } });
          }
        });
      }

      // ── 2. 솔로 액션 (확률) ──
      allNpcs.forEach((npc) => {
        if (Math.random() < 0.15) {
          const ns = s.npcStates[npc.id];
          const loc = ns?.currentLocation || "lobby";
          const templates = SOLO_ACTIONS[loc] || SOLO_ACTIONS.lobby;
          const tmpl = templates[Math.floor(Math.random() * templates.length)];
          dispatch({ type: ACTION.ADD_FEED_ITEM, payload: { id: nextFeedId(), type: "action", text: tmpl(npc), time: timeStr, day: actualDay } });
        }
      });

      // ── 3. NPC 상호작용 (같은 장소) ──
      const locGroups = {};
      allNpcs.forEach((npc) => {
        const loc = s.npcStates[npc.id]?.currentLocation || "lobby";
        if (!locGroups[loc]) locGroups[loc] = [];
        locGroups[loc].push(npc);
      });

      Object.entries(locGroups).forEach(([, npcs]) => {
        if (npcs.length < 2) return;
        // 각 쌍에 대해 상호작용 확률
        for (let i = 0; i < npcs.length; i++) {
          for (let j = i + 1; j < npcs.length; j++) {
            if (Math.random() > 0.25) continue; // 25% 확률
            const a = npcs[i], b = npcs[j];
            const shared = findSharedInterests(a, b);

            let feedText, relChange, feedType;
            // 기존 관계 점수 확인
            const existingRel = s.relationships.find(r => (r.npcA === a.id && r.npcB === b.id) || (r.npcA === b.id && r.npcB === a.id));
            const existingScore = existingRel?.score || 0;
            
            // 성격 비호환성 계산
            const incompatible = (a.personality.social !== b.personality.social ? 1 : 0) +
              (a.personality.thinking !== b.personality.thinking ? 1 : 0) +
              (a.personality.energy !== b.personality.energy ? 1 : 0);
            // 갈등 확률: 기본 15% + 비호환성 10%씩 + 이미 사이 나쁘면 추가
            const conflictChance = 0.15 + incompatible * 0.1 + (existingScore < -1 ? 0.15 : 0);
            const isConflict = Math.random() < conflictChance;

            if (isConflict) {
              // 갈등/분쟁/경쟁 상호작용
              if (shared.length > 0 && Math.random() < 0.5) {
                const interest = shared[Math.floor(Math.random() * shared.length)];
                const templates = CONFLICT_INTEREST_INTERACTIONS[interest] || [];
                if (templates.length > 0) {
                  feedText = templates[Math.floor(Math.random() * templates.length)](a, b);
                } else {
                  feedText = `${a.emoji} ${a.name}과(와) ${b.emoji} ${b.name}이(가) ${interest}에 대한 의견 차이로 불편해졌다.`;
                }
                relChange = -(0.5 + Math.random() * 0.8);
              } else {
                const tmpl = NEGATIVE_INTERACTION_TEMPLATES[Math.floor(Math.random() * NEGATIVE_INTERACTION_TEMPLATES.length)];
                feedText = tmpl.text(a, b);
                relChange = tmpl.change - Math.random() * 0.3;
              }
              feedType = "dialogue";
            } else if (shared.length > 0 && Math.random() < 0.6) {
              // 공유 관심사 기반 상호작용
              const interest = shared[Math.floor(Math.random() * shared.length)];
              const templates = INTEREST_INTERACTIONS[interest] || [];
              if (templates.length > 0) {
                feedText = templates[Math.floor(Math.random() * templates.length)](a, b);
              } else {
                feedText = `${a.emoji} ${a.name}과(와) ${b.emoji} ${b.name}이(가) ${interest}에 대해 이야기하고 있다.`;
              }
              relChange = 1.0 + Math.random() * 0.5; // 공유 관심사 → 더 큰 친밀도 변화
              feedType = "dialogue";
            } else {
              // 일반 상호작용
              const tmpl = INTERACTION_TEMPLATES[Math.floor(Math.random() * INTERACTION_TEMPLATES.length)];
              feedText = tmpl.text(a, b);
              relChange = tmpl.change + Math.random() * 0.3;
              feedType = tmpl.type;
            }

            // 성격 호환성 보너스/페널티 (갈등이 아닐 때만)
            if (!isConflict) {
              const compat = (a.personality.social === b.personality.social ? 0.2 : 0) +
                (a.personality.thinking === b.personality.thinking ? 0.1 : -0.1) +
                (a.personality.energy === b.personality.energy ? 0.1 : 0);
              relChange += compat;
            }

            dispatch({ type: ACTION.ADD_FEED_ITEM, payload: { id: nextFeedId(), type: feedType, text: feedText, time: timeStr, day: actualDay } });
            dispatch({ type: ACTION.UPDATE_RELATIONSHIP, payload: { npcA: a.id, npcB: b.id, change: Math.round(relChange * 10) / 10, event: feedText.replace(/.*이\(가\) /, "").slice(0, 30), time: timeStr } });
            // Map bubble icons for interaction
            const bubbleIcon = feedType === "dialogue" ? "💬" : relChange > 0 ? "💕" : "💔";
            dispatch({ type: ACTION.ADD_NPC_BUBBLE, payload: { npcId: a.id, icon: bubbleIcon } });
            dispatch({ type: ACTION.ADD_NPC_BUBBLE, payload: { npcId: b.id, icon: bubbleIcon } });

            // 관계 변화 피드 (긍정/부정 모두)
            if (Math.abs(relChange) >= 0.8) {
              const isPos = relChange > 0;
              dispatch({ type: ACTION.ADD_FEED_ITEM, payload: { id: nextFeedId(), type: "relationship", text: `${isPos ? "💕" : "💔"} ${a.emoji} ${a.name} ↔ ${b.emoji} ${b.name} 친밀도 ${isPos ? "+" : ""}${relChange.toFixed(1)}`, time: timeStr, day: actualDay } });
            }
          }
        }
      });

      // ── 4. 기분 변화 ──
      allNpcs.forEach((npc) => {
        if (Math.random() < 0.1) {
          dispatch({ type: ACTION.UPDATE_NPC_MOOD, payload: { npcId: npc.id, mood: MOODS[Math.floor(Math.random() * MOODS.length)] } });
        }
      });

      // ── 5. 이벤트 (랜덤, 드문 확률) ──
      if (Math.random() < 0.08) {
        const events = [
          { title: "갑자기 비가 내린다", desc: "타마버스 안의 NPC들이 창밖을 바라보며 생각에 잠겼다.", emoji: "🌧️" },
          { title: "카페 특별 메뉴", desc: "Tamaverse Brew에서 오늘의 특별 메뉴가 공개되었다.", emoji: "☕" },
          { title: "노을이 아름답다", desc: "서쪽 하늘이 붉게 물들었다. 스카이라인에서 보면 장관일 것이다.", emoji: "🌅" },
          { title: "택배가 도착했다", desc: "누군가에게 소포가 배달되었다. 무엇이 들어있을까?", emoji: "📦" },
          { title: "BGM 변경", desc: "타마버스에 잔잔한 재즈 음악이 흐르기 시작했다.", emoji: "🎶" },
        ];
        const ev = events[Math.floor(Math.random() * events.length)];
        dispatch({ type: ACTION.ADD_FEED_ITEM, payload: { id: nextFeedId(), type: "event", text: `${ev.emoji} [이벤트] ${ev.title} — ${ev.desc}`, time: timeStr, day: actualDay } });
        dispatch({ type: ACTION.ADD_EVENT_LOG, payload: { type: "special", title: ev.title, description: ev.desc, day: actualDay, time: timeStr, npcsInvolved: [] } });
      }

      // ── 5-B. 브랜디드 이벤트 (v1.1+) ──
      if (versionGte(s.currentVersion, "1.1") && Math.random() < 0.04) {
        const brandedEvents = [
          { cond: true, text: "☕ Tamaverse Brew에 MORI Coffee 시즌 라떼가 추가되었습니다!", title: "MORI Coffee 라떼 런칭", coupon: { emoji: "☕", title: "MORI Coffee 50% 할인", desc: "NPC가 MORI 라떼를 마셔서 획득!" } },
          { cond: period === "evening", text: "🎵 스테이지 Tamaverse에서 음악실 오픈마이크가 시작됩니다!", title: "음악실 오픈마이크" },
        ];
        if (versionGte(s.currentVersion, "1.2")) {
          brandedEvents.push({ cond: true, text: "🧥 루나(LUNA Fashion)가 패션 팝업스토어를 열고 있습니다!", title: "LUNA Fashion 팝업", coupon: { emoji: "🧥", title: "LUNA Fashion 10% 할인", desc: "루나와 패션 대화를 해서 획득!" } });
        }
        const eligible = brandedEvents.filter((e) => e.cond);
        if (eligible.length > 0) {
          const bev = eligible[Math.floor(Math.random() * eligible.length)];
          dispatch({ type: ACTION.ADD_FEED_ITEM, payload: { id: nextFeedId(), type: "event", text: bev.text, time: timeStr, day: actualDay } });
          dispatch({ type: ACTION.ADD_EVENT_LOG, payload: { type: "special", title: bev.title, description: bev.text, day: actualDay, time: timeStr, npcsInvolved: [] } });
          if (bev.coupon) {
            dispatch({ type: ACTION.ADD_COUPON, payload: { ...bev.coupon, day: actualDay, time: timeStr } });
          }
        }
      }

      // ── 5-C. 아이템 특수 이벤트 (수트케이스) ──
      const customNpc = s.npcs.custom;
      if (customNpc && Math.random() < 0.06) {
        const items = customNpc.suitcaseItems || [];
        const cLoc = s.npcStates[customNpc.id]?.currentLocation;
        const itemEvents = [
          { item: "camera", npc: "haru", text: `📷 [특수 이벤트] ${customNpc.name}이(가) 하루에게 빈티지 카메라로 포토 에세이를 찍어주고 있다!`, title: "포토 에세이", change: 2.0 },
          { item: "ukulele", npc: "kai", text: `🎸 [특수 이벤트] ${customNpc.name}과(와) 카이가 즉흥 듀엣을 하고 있다!`, title: "즉흥 듀엣", change: 2.5 },
          { item: "cookies", npc: "sora", text: `🍪 [특수 이벤트] ${customNpc.name}이(가) 소라에게 수제 쿠키를 나눠주고 있다!`, title: "쿠키 나눔", change: 2.0 },
          { item: "notebook", npc: "mio", text: `📓 [특수 이벤트] ${customNpc.name}과(와) 미오가 북클럽을 열고 있다!`, title: "북클럽", change: 2.0 },
          { item: "boardgame", npc: "ren", text: `🎲 [특수 이벤트] 심야 보드게임 대회가 시작되었다!`, title: "심야 보드게임 대회", change: 2.5 },
          { item: "telescope", npc: "mio", text: `🔭 [특수 이벤트] ${customNpc.name}과(와) 미오가 별자리를 관측하고 있다!`, title: "별자리 관측", change: 2.0 },
          { item: "teaset", npc: "haru", text: `🍵 [특수 이벤트] ${customNpc.name}과(와) 하루가 티타임을 즐기고 있다!`, title: "티타임", change: 1.5 },
          { item: "plant", npc: "sora", text: `🌱 [특수 이벤트] ${customNpc.name}과(와) 소라가 정원을 가꾸고 있다!`, title: "정원 가꾸기", change: 1.5 },
        ];
        const eligible = itemEvents.filter((e) => items.includes(e.item) && s.npcStates[e.npc]?.currentLocation === cLoc);
        if (eligible.length > 0) {
          const ie = eligible[Math.floor(Math.random() * eligible.length)];
          dispatch({ type: ACTION.ADD_FEED_ITEM, payload: { id: nextFeedId(), type: "event", text: ie.text, time: timeStr, day: actualDay } });
          dispatch({ type: ACTION.ADD_EVENT_LOG, payload: { type: "item", title: ie.title, description: ie.text, day: actualDay, time: timeStr, npcsInvolved: [customNpc.id, ie.npc] } });
          dispatch({ type: ACTION.UPDATE_RELATIONSHIP, payload: { npcA: customNpc.id, npcB: ie.npc, change: ie.change, event: ie.title, time: timeStr } });
          dispatch({ type: ACTION.ADD_FEED_ITEM, payload: { id: nextFeedId(), type: "relationship", text: `💕 ${customNpc.emoji} ${customNpc.name} ↔ ${getNpc(s, ie.npc)?.emoji || ""} ${getNpc(s, ie.npc)?.name || ""} 친밀도 +${ie.change}`, time: timeStr, day: actualDay } });
        }
      }

      // ── 5-D. 관계 임계치 이벤트 ──
      s.relationships.forEach((rel) => {
        const milestones = [
          { threshold: 3, event: "함께 산책", desc: (a, b) => `${a?.emoji} ${a?.name}과(와) ${b?.emoji} ${b?.name}이(가) 함께 산책을 나갔다.`, change: 1 },
          { threshold: 5, event: "선물 교환", desc: (a, b) => `${a?.emoji} ${a?.name}과(와) ${b?.emoji} ${b?.name}이(가) 서로 선물을 교환했다!`, change: 2 },
          { threshold: 7, event: "비밀 공유", desc: (a, b) => `${a?.emoji} ${a?.name}과(와) ${b?.emoji} ${b?.name}이(가) 서로에게 비밀을 털어놓았다.`, change: 1.5 },
          { threshold: 9, event: "베스트 프렌드", desc: (a, b) => `🎉 ${a?.emoji} ${a?.name}과(와) ${b?.emoji} ${b?.name}이(가) 베스트 프렌드가 되었다!`, change: 1 },
          { threshold: -3, event: "사소한 갈등", desc: (a, b) => `😤 ${a?.emoji} ${a?.name}과(와) ${b?.emoji} ${b?.name} 사이에 갈등이 생겼다.`, change: -0.5 },
        ];
        milestones.forEach((m) => {
          const crossed = m.threshold > 0 ? (rel.score >= m.threshold && rel.score - (rel.history.length > 0 ? rel.history[rel.history.length - 1].change : 0) < m.threshold) : (rel.score <= m.threshold && rel.score - (rel.history.length > 0 ? rel.history[rel.history.length - 1].change : 0) > m.threshold);
          if (crossed && Math.random() < 0.5) {
            const a = getNpc(s, rel.npcA), b = getNpc(s, rel.npcB);
            const text = m.desc(a, b);
            dispatch({ type: ACTION.ADD_FEED_ITEM, payload: { id: nextFeedId(), type: "event", text: `✨ [관계 이벤트] ${text}`, time: timeStr, day: actualDay } });
            dispatch({ type: ACTION.ADD_EVENT_LOG, payload: { type: "relationship", title: m.event, description: text, day: actualDay, time: timeStr, npcsInvolved: [rel.npcA, rel.npcB] } });
          }
        });
      });

      // ── 6. 콘텐츠 생성 (Day 전환 + Day 1 중간 시점) ──
      const shouldGenContent = dayRolled || (gameDay === 1 && gameTime > 0 && gameTime % 180 === 0);
      if (shouldGenContent) {
        const isIntraDay = !dayRolled && gameDay === 1;
        allNpcs.forEach((npc, npcIdx) => {
          const baseDelay = npcIdx * 1200; // 1.2초 간격 순차 생성
          // 일기 (Day전환: 50%, Day1 중간: 20%)
          if (Math.random() < (isIntraDay ? 0.2 : 0.5)) {
            const tmpl = DIARY_TEMPLATES[Math.floor(Math.random() * DIARY_TEMPLATES.length)];
            const diaryData = tmpl(npc, gameDay);
            setTimeout(() => {
              dispatch({ type: ACTION.ADD_CONTENT, payload: { id: `diary-${npc.id}-d${gameDay}-${Date.now()}`, type: "diary", authorId: npc.id, day: gameDay, text: diaryData.body, richData: diaryData, createdAt: Date.now() } });
              dispatch({ type: ACTION.ADD_NPC_BUBBLE, payload: { npcId: npc.id, icon: "📔" } });
            }, baseDelay);
          }
          // SNS (Day전환: 40%, Day1 중간: 15%)
          if (Math.random() < (isIntraDay ? 0.15 : 0.4)) {
            const loc = s.locations.find((l) => l.id === (s.npcStates[npc.id]?.currentLocation || "lobby"));
            const tmpl = SNS_TEMPLATES[Math.floor(Math.random() * SNS_TEMPLATES.length)];
            const snsData = tmpl(npc, loc?.name || "타마버스");
            setTimeout(() => {
              dispatch({ type: ACTION.ADD_CONTENT, payload: { id: `sns-${npc.id}-d${gameDay}-${Date.now()}`, type: "sns", authorId: npc.id, day: gameDay, text: snsData.body, richData: snsData, createdAt: Date.now() } });
              dispatch({ type: ACTION.ADD_NPC_BUBBLE, payload: { npcId: npc.id, icon: "📱" } });
            }, baseDelay + 600);
          }
        });
        if (dayRolled) {
          dispatch({ type: ACTION.ADD_FEED_ITEM, payload: { id: nextFeedId(), type: "event", text: `🌅 ── Day ${actualDay} 시작 ──`, time: "00:00", day: actualDay } });
          dispatch({ type: ACTION.ADD_EVENT_LOG, payload: { type: "system", title: `Day ${actualDay} 시작`, description: `새로운 하루가 시작되었습니다.`, day: actualDay, time: "00:00", npcsInvolved: [] } });
        }
      }

      // ── 7. 시간 진행 ──
      dispatch({ type: ACTION.SIMULATION_TICK });
    }, TICK_MS);

    return () => clearInterval(interval);
  }, [state.simulation.isRunning, state.simulation.speed, dispatch]);
}

// ═══════════════════════════════════════════════
// 7. IntroScreen
// ═══════════════════════════════════════════════

const STARS = Array.from({ length: 24 }, (_, i) => ({
  left: `${5 + Math.floor(i * 3.7 + i * i * 0.8) % 90}%`,
  top: `${3 + Math.floor(i * 7.3 + i * 1.9) % 90}%`,
  delay: `${(i * 0.7) % 3}s`,
  ch: i % 3 === 0 ? "✦" : i % 3 === 1 ? "✧" : "·",
}));

function IntroScreen({ dispatch }) {
  const quickStart = () => {
    const names = ["별이", "하늘", "누리", "새봄", "다온", "나래", "아린", "도윤"];
    const emojis = ["👩‍🎨", "🧑‍🏫", "🧑‍🎤", "🧑‍🚀", "🧑‍🍳", "🧑‍💻", "🧑‍🎶", "🧙"];
    const allInterests = ["예술", "음악", "문학", "자연", "게임", "요리", "여행", "사진", "운동", "과학"];
    const allItems = SUITCASE_ITEMS.map((it) => it.id);

    const name = names[Math.floor(Math.random() * names.length)];
    const emoji = emojis[Math.floor(Math.random() * emojis.length)];
    const personality = {
      social: Math.random() > 0.5 ? 1 : -1,
      thinking: Math.random() > 0.5 ? 1 : -1,
      energy: Math.random() > 0.5 ? 1 : -1,
    };
    // Pick 3 random interests
    const shuffled = [...allInterests].sort(() => Math.random() - 0.5);
    const interests = shuffled.slice(0, 3);
    // Pick random suitcase items within 100pt budget
    const shuffledItems = [...allItems].sort(() => Math.random() - 0.5);
    const suitcaseItems = [];
    let cost = 0;
    for (const id of shuffledItems) {
      const item = SUITCASE_ITEMS.find((it) => it.id === id);
      if (item && cost + item.cost <= 100) { suitcaseItems.push(id); cost += item.cost; }
    }

    const customNpc = {
      id: "custom", name, emoji, description: "나의 에이전트",
      personality, interests, suitcaseItems,
      behaviorWeights: { lateNight: { rooms: 5, lobby: 2 }, morning: { cafe: 4, lobby: 3, rooms: 1 }, afternoon: { cafe: 3, lobby: 3, restaurant: 2 }, evening: { restaurant: 4, cafe: 3, lobby: 1 } },
    };
    const allNpcs = [customNpc, ...PRESET_NPCS];
    const period = getTimePeriod(480);
    const npcStates = {};
    allNpcs.forEach((npc) => {
      const w = npc.behaviorWeights[period] || {};
      const entries = Object.entries(w);
      const tot = entries.reduce((s, [, v]) => s + v, 0);
      let r = Math.random() * tot, loc = entries[0]?.[0] || "lobby";
      for (const [lid, wt] of entries) { r -= wt; if (r <= 0) { loc = lid; break; } }
      npcStates[npc.id] = { currentLocation: loc, currentActivity: "둘러보는 중", mood: "😊", lastActionTime: 0, behaviorDirective: null, directiveQueue: [] };
    });
    const rels = [];
    for (let i = 0; i < allNpcs.length; i++) for (let j = i + 1; j < allNpcs.length; j++) rels.push({ npcA: allNpcs[i].id, npcB: allNpcs[j].id, score: 0, history: [] });
    dispatch({ type: ACTION.COMPLETE_CASTING, payload: { npcs: { custom: customNpc, presets: [...PRESET_NPCS], branded: [] }, npcStates, relationships: rels } });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen relative overflow-hidden" style={{ background: COLORS.bg }}>
      {/* Rotating radial gradient background */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 600px 400px at 30% 40%, rgba(233,69,96,0.08), transparent), radial-gradient(ellipse 500px 350px at 70% 60%, rgba(78,205,196,0.06), transparent)" }} />
      {/* Grid overlay */}
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(78,205,196,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(78,205,196,0.015) 1px, transparent 1px)", backgroundSize: "48px 48px" }} />
      <div className="absolute inset-0 pointer-events-none">
        {STARS.map((s, i) => (
          <span key={i} className="absolute text-xs" style={{ left: s.left, top: s.top, animation: `pulse 3s ease-in-out ${s.delay} infinite`, color: COLORS.core + "44" }}>{s.ch}</span>
        ))}
      </div>
      <div className="text-8xl mb-4" style={{ animation: "fadeInUp 0.6s ease-out both", filter: "drop-shadow(0 4px 24px rgba(233,69,96,0.3))" }}>🏨</div>
      <h1 className="text-6xl font-bold tracking-tight mb-3" style={{ fontFamily: "'Playfair Display', serif", background: "linear-gradient(135deg, #e94560, #ff6b6b)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", animation: "fadeInUp 0.6s ease-out 0.2s both, titleGlow 3s ease-in-out infinite", letterSpacing: "-1px" }}>Tamaverse</h1>
      <p className="text-xl mb-14 tracking-wide" style={{ color: COLORS.subtext, animation: "fadeInUp 0.6s ease-out 0.4s both" }}>다마고치 세계 안, 어딘가에 존재하는 타마버스</p>
      <div className="flex gap-5" style={{ animation: "fadeInUp 0.6s ease-out 0.6s both" }}>
        <button onClick={() => { if(window.gtag) gtag('event','tamaverse_checkin',{event_category:'conversion',event_label:'intro_checkin'}); dispatch({ type: ACTION.SET_PHASE, payload: "worldbuilding" }); }} className="px-12 py-4 rounded-xl text-white font-semibold text-xl tracking-wide transition-all duration-300 hover:scale-105 active:scale-95" style={{ background: "linear-gradient(135deg, #e94560, #ff6b6b)", boxShadow: "0 6px 30px rgba(233,69,96,0.4)", minWidth: 220, borderRadius: 50 }}>
          🏨 체크인하기
        </button>
        <button onClick={() => { if(window.gtag) gtag('event','tamaverse_quickstart',{event_category:'conversion',event_label:'intro_quickstart'}); quickStart(); }}
          className="px-12 py-4 font-semibold text-xl tracking-wide transition-all duration-300 hover:scale-105 active:scale-95"
          style={{ background: "transparent", color: COLORS.subtext, border: `1px solid ${COLORS.border}`, borderRadius: 50, minWidth: 220 }}>
          ⚡ 빠른 시작
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// 8. WorldbuildingScreen — 세계관 소개
// ═══════════════════════════════════════════════

const WB_TEXTS = [
  { emoji: "🌍", text: "타마버스 —\n다마고치의 이야기가 펼쳐지는\n신비로운 공간입니다." },
  { emoji: "🤖", text: "이 타마버스에는 AI 에이전트가 살아갑니다.\n각자의 성격, 관심사, 보관함을 갖고\n자유롭게 행동하며 관계를 맺어갑니다." },
  { emoji: "🎬", text: "당신은 연출자입니다.\n삶을 설계하고, 감상하고,\n방향을 제시하세요." },
  { emoji: "✨", text: "이제, 당신의 첫 번째\n에이전트를 캐스팅하세요." },
];

function WorldbuildingScreen({ dispatch }) {
  const [step, setStep] = useState(0);
  const [vis, setVis] = useState(true);

  const goNext = useCallback(() => {
    if (step >= WB_TEXTS.length - 1) { dispatch({ type: ACTION.SET_PHASE, payload: "casting" }); dispatch({ type: ACTION.SET_CASTING_STEP, payload: 1 }); return; }
    setVis(false);
    setTimeout(() => { setStep((s) => s + 1); setVis(true); }, 300);
  }, [step, dispatch]);

  const skip = () => { dispatch({ type: ACTION.SET_PHASE, payload: "casting" }); dispatch({ type: ACTION.SET_CASTING_STEP, payload: 1 }); };
  const item = WB_TEXTS[step];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 relative" style={{ background: COLORS.bg }}>
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(78,205,196,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(78,205,196,0.015) 1px, transparent 1px)", backgroundSize: "48px 48px" }} />
      <button onClick={skip} className="absolute top-6 right-6 text-sm px-3 py-1.5 rounded-lg transition-all hover:opacity-70" style={{ color: COLORS.subtext, background: COLORS.surface }}>건너뛰기 →</button>
      <div className="flex gap-2 mb-8" style={{ position: "relative", zIndex: 1 }}>
        {WB_TEXTS.map((_, i) => <div key={i} className="w-2 h-2 rounded-full transition-all duration-300" style={{ background: i === step ? COLORS.accent : "rgba(255,255,255,0.15)", transform: i === step ? "scale(1.3)" : "scale(1)" }} />)}
      </div>
      <div className="max-w-md w-full rounded-2xl p-10 text-center transition-all duration-300" style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, opacity: vis ? 1 : 0, transform: vis ? "translateY(0)" : "translateY(12px)", position: "relative", zIndex: 1, borderRadius: 12 }}>
        <p className="text-5xl mb-6">{item.emoji}</p>
        <p className="text-lg leading-relaxed whitespace-pre-line" style={{ color: COLORS.text }}>{item.text}</p>
      </div>
      <button onClick={goNext} className="mt-8 px-8 py-3 text-white font-semibold transition-all duration-300 hover:scale-105 active:scale-95" style={{ background: "linear-gradient(135deg, #e94560, #ff6b6b)", boxShadow: "0 4px 16px rgba(233,69,96,0.3)", borderRadius: 50, position: "relative", zIndex: 1 }}>
        {step >= WB_TEXTS.length - 1 ? "캐스팅 시작 ✨" : "다음"}
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════
// 9. CastingFlow — 4단계
// ═══════════════════════════════════════════════

function CastingFlow({ state, dispatch }) {
  const step = state.castingStep;
  return (
    <div className="flex flex-col items-center min-h-screen px-4 py-8 relative" style={{ background: COLORS.bg }}>
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(78,205,196,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(78,205,196,0.015) 1px, transparent 1px)", backgroundSize: "48px 48px" }} />
      <CastingProgress currentStep={step} />
      {step === 1 && <CastingStep1 state={state} dispatch={dispatch} />}
      {step === 2 && <CastingStep2 state={state} dispatch={dispatch} />}
      {step === 3 && <CastingStep3 state={state} dispatch={dispatch} />}
      {step === 4 && <CastingStep4 state={state} dispatch={dispatch} />}
    </div>
  );
}

function CastingProgress({ currentStep }) {
  const steps = [{ n: 1, l: "기본 정보" }, { n: 2, l: "관심사" }, { n: 3, l: "가방 챙기기" }, { n: 4, l: "체크인" }];
  return (
    <div className="flex items-center gap-1 mb-8">
      {steps.map((s, i) => (
        <div key={s.n} className="flex items-center gap-1">
          <div className="flex flex-col items-center">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300" style={{ background: s.n < currentStep ? COLORS.core : s.n === currentStep ? COLORS.accent : "rgba(255,255,255,0.08)", color: s.n <= currentStep ? "#fff" : COLORS.subtext, boxShadow: s.n === currentStep ? "0 2px 12px rgba(233,69,96,0.4)" : "none", border: s.n > currentStep ? `1px solid ${COLORS.border}` : "none" }}>
              {s.n < currentStep ? "✓" : s.n}
            </div>
            <span className="text-xs mt-1" style={{ color: s.n === currentStep ? COLORS.text : COLORS.subtext }}>{s.l}</span>
          </div>
          {i < steps.length - 1 && <div className="w-8 h-0.5 mb-4 rounded" style={{ background: s.n < currentStep ? COLORS.core : "rgba(255,255,255,0.1)" }} />}
        </div>
      ))}
    </div>
  );
}

// ── Step 1: 기본 정보 ──
function CastingStep1({ state, dispatch }) {
  const d = state.castingDraft;
  const nameOk = d.name.length >= 1 && d.name.length <= 8;
  const canNext = nameOk && d.emoji !== null && d.personality.social !== 0 && d.personality.thinking !== 0 && d.personality.energy !== 0;

  return (
    <div className="w-full max-w-lg p-6" style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12 }}>
      <h2 className="text-xl font-bold mb-1" style={{ color: COLORS.text }}>Step 1 — 기본 정보</h2>
      <p className="text-sm mb-6" style={{ color: COLORS.subtext }}>당신의 에이전트를 만들어 주세요.</p>

      <label className="block text-sm font-medium mb-1.5" style={{ color: COLORS.text }}>이름</label>
      <input value={d.name} onChange={(e) => dispatch({ type: ACTION.SET_CUSTOM_NPC_NAME, payload: e.target.value.slice(0, 8) })} placeholder="이름을 입력하세요 (1~8자)" className="w-full px-4 py-2.5 rounded-lg text-sm outline-none transition-all duration-200 mb-5" style={{ background: COLORS.bgElevated, border: `1px solid ${d.name.length > 0 && nameOk ? COLORS.core : COLORS.border}`, color: COLORS.text }} />

      <label className="block text-sm font-medium mb-2" style={{ color: COLORS.text }}>아바타</label>
      <div className="grid grid-cols-4 gap-2 mb-5 p-3 rounded-xl" style={{ background: COLORS.bgElevated, border: `1px solid ${COLORS.border}` }}>
        {AVATAR_EMOJIS.map((em) => (
          <button key={em} onClick={() => dispatch({ type: ACTION.SET_CUSTOM_NPC_EMOJI, payload: em })} className="h-14 rounded-xl text-2xl transition-all duration-200 hover:scale-105" style={{ background: "transparent", border: `2px solid ${d.emoji === em ? COLORS.accent : "transparent"}`, boxShadow: d.emoji === em ? `0 0 12px ${COLORS.accent}66, 0 0 24px ${COLORS.accent}22, inset 0 0 8px ${COLORS.accent}15` : "none", filter: d.emoji === em ? `drop-shadow(0 0 6px ${COLORS.accent})` : "none" }}>
            {em}
          </button>
        ))}
      </div>

      <label className="block text-sm font-medium mb-2" style={{ color: COLORS.text }}>성격 <span style={{ color: COLORS.accent, fontSize: 12, fontWeight: 600 }}>· 각 항목에서 하나를 선택하세요</span></label>
      <div className="space-y-2.5 mb-6">
        {[{ axis: "social", left: "내향적 🌙", right: "🌞 외향적" }, { axis: "thinking", left: "감성적 💗", right: "🧠 분석적" }, { axis: "energy", left: "차분한 🍃", right: "⚡ 활동적" }].map(({ axis, left, right }) => (
          <div key={axis} className="flex items-center gap-2">
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: d.personality[axis] !== 0 ? COLORS.positive : COLORS.negative, shrink: 0, transition: "background 0.2s" }} />
            {[{ v: -1, label: left }, { v: 1, label: right }].map(({ v, label }) => (
              <button key={v} onClick={() => dispatch({ type: ACTION.SET_CUSTOM_NPC_PERSONALITY, payload: { [axis]: v } })} className="flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200" style={{ background: d.personality[axis] === v ? COLORS.accent + "10" : "transparent", color: d.personality[axis] === v ? "#fff" : COLORS.subtext, border: `1px solid ${d.personality[axis] === v ? COLORS.accent : COLORS.border}`, boxShadow: d.personality[axis] === v ? `0 0 10px ${COLORS.accent}44, 0 0 20px ${COLORS.accent}15` : "none" }}>
                {label}
              </button>
            ))}
          </div>
        ))}
      </div>

      <button disabled={!canNext} onClick={() => dispatch({ type: ACTION.SET_CASTING_STEP, payload: 2 })} className="w-full py-3 text-white font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:hover:scale-100" style={{ background: "linear-gradient(135deg, #e94560, #ff6b6b)", borderRadius: 8, boxShadow: "0 4px 16px rgba(233,69,96,0.3)" }}>
        다음 →
      </button>
    </div>
  );
}

// ── Step 2: 관심사 ──
function CastingStep2({ state, dispatch }) {
  const sel = state.castingDraft.interests;
  const cnt = sel.length;
  const toggle = (id) => {
    if (sel.includes(id)) dispatch({ type: ACTION.SET_CUSTOM_NPC_INTERESTS, payload: sel.filter((x) => x !== id) });
    else if (cnt < 3) dispatch({ type: ACTION.SET_CUSTOM_NPC_INTERESTS, payload: [...sel, id] });
  };

  return (
    <div className="w-full max-w-lg rounded-2xl p-6" style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}>
      <h2 className="text-xl font-bold mb-1" style={{ color: COLORS.text }}>Step 2 — 관심사</h2>
      <p className="text-sm mb-1" style={{ color: COLORS.subtext }}>3개를 선택하세요.</p>
      <p className="text-sm font-bold mb-5" style={{ color: cnt === 3 ? COLORS.success : COLORS.accent }}>선택: {cnt}/3</p>
      <div className="grid grid-cols-2 gap-2.5 mb-6">
        {INTEREST_OPTIONS.map((o) => { const a = sel.includes(o.id); return (
          <button key={o.id} onClick={() => toggle(o.id)} className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-[1.02]" style={{ background: a ? COLORS.accent + "08" : "transparent", border: `2px solid ${a ? COLORS.accent : COLORS.border}`, color: a ? COLORS.text : COLORS.subtext, opacity: !a && cnt >= 3 ? 0.4 : 1, boxShadow: a ? `0 0 12px ${COLORS.accent}44, 0 0 24px ${COLORS.accent}15` : "none" }}>
            <span className="text-xl">{o.emoji}</span><span>{o.label}</span>
          </button>
        ); })}
      </div>
      <div className="flex gap-2">
        <button onClick={() => dispatch({ type: ACTION.SET_CASTING_STEP, payload: 1 })} className="flex-1 py-3 rounded-xl font-medium text-sm" style={{ background: COLORS.bg, color: COLORS.subtext, border: `1px solid ${COLORS.border}` }}>← 이전</button>
        <button disabled={cnt !== 3} onClick={() => dispatch({ type: ACTION.SET_CASTING_STEP, payload: 3 })} className="flex-1 py-3 rounded-xl text-white font-semibold disabled:opacity-40" style={{ background: COLORS.accent }}>다음 →</button>
      </div>
    </div>
  );
}

// ── Step 3: 수트케이스 ──
function CastingStep3({ state, dispatch }) {
  const sel = state.castingDraft.suitcaseItems;
  const totalW = sel.reduce((s, id) => { const it = SUITCASE_ITEMS.find((x) => x.id === id); return s + (it ? it.weight : 0); }, 0);
  const totalV = sel.reduce((s, id) => { const it = SUITCASE_ITEMS.find((x) => x.id === id); return s + (it ? it.volume : 0); }, 0);
  const maxW = 5.0, maxV = 10.0;
  const toggle = (id) => {
    const it = SUITCASE_ITEMS.find((x) => x.id === id);
    if (!it) return;
    if (sel.includes(id)) dispatch({ type: ACTION.TOGGLE_SUITCASE_ITEM, payload: id });
    else if (totalW + it.weight <= maxW && totalV + it.volume <= maxV) dispatch({ type: ACTION.TOGGLE_SUITCASE_ITEM, payload: id });
  };
  const wPct = Math.min(totalW / maxW * 100, 100);
  const vPct = Math.min(totalV / maxV * 100, 100);
  const wCol = wPct > 80 ? (wPct >= 100 ? COLORS.negative : "#E8A84C") : COLORS.success;
  const vCol = vPct > 80 ? (vPct >= 100 ? COLORS.negative : "#E8A84C") : COLORS.success;

  return (
    <div className="w-full max-w-lg rounded-2xl p-6" style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}>
      <h2 className="text-xl font-bold mb-1" style={{ color: COLORS.text }}>Step 3 — 가방 챙기기</h2>
      <p className="text-sm mb-4" style={{ color: COLORS.subtext }}>무게 {maxW}kg · 부피 {maxV}L 내에서 아이템을 선택하세요.</p>

      {/* 가방 비주얼 */}
      <div className="rounded-xl p-4 mb-4" style={{ background: COLORS.bg, border: `1px dashed ${COLORS.border}` }}>
        <div className="flex items-center justify-between mb-1">
          <span className="text-lg">🧳</span>
        </div>
        {/* Weight bar */}
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-xs font-bold shrink-0" style={{ color: COLORS.subtext, width: 32 }}>무게</span>
          <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ background: COLORS.border }}>
            <div className="h-full rounded-full transition-all duration-300" style={{ width: `${wPct}%`, background: wCol }} />
          </div>
          <span className="text-xs font-bold shrink-0" style={{ color: totalW > maxW ? COLORS.negative : COLORS.text, width: 56, textAlign: "right" }}>{totalW.toFixed(1)}/{maxW}kg</span>
        </div>
        {/* Volume bar */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold shrink-0" style={{ color: COLORS.subtext, width: 32 }}>부피</span>
          <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ background: COLORS.border }}>
            <div className="h-full rounded-full transition-all duration-300" style={{ width: `${vPct}%`, background: vCol }} />
          </div>
          <span className="text-xs font-bold shrink-0" style={{ color: totalV > maxV ? COLORS.negative : COLORS.text, width: 56, textAlign: "right" }}>{totalV.toFixed(1)}/{maxV}L</span>
        </div>
        {sel.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {sel.map((id) => { const it = SUITCASE_ITEMS.find((x) => x.id === id); return (
              <span key={id} className="px-2 py-1 rounded-lg text-xs font-medium" style={{ background: COLORS.accent + "18", color: COLORS.accent }}>{it?.emoji} {it?.name}</span>
            ); })}
          </div>
        )}
      </div>

      <div className="space-y-2 mb-6 max-h-64 overflow-y-auto pr-1">
        {SUITCASE_ITEMS.map((it) => { const a = sel.includes(it.id); const cant = !a && (totalW + it.weight > maxW || totalV + it.volume > maxV); return (
          <button key={it.id} onClick={() => toggle(it.id)} className="w-full flex items-start gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200" style={{ background: a ? COLORS.accent + "06" : "transparent", border: `1px solid ${a ? COLORS.accent : COLORS.border}`, opacity: cant ? 0.35 : 1, boxShadow: a ? `0 0 10px ${COLORS.accent}33, 0 0 20px ${COLORS.accent}11` : "none" }}>
            <span className="text-xl mt-0.5">{it.emoji}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold" style={{ color: COLORS.text }}>{it.name}</span>
                <div className="flex gap-1.5 shrink-0 ml-2">
                  <span className="text-xs font-bold px-1.5 py-0.5 rounded" style={{ background: a ? COLORS.accent + "22" : COLORS.border + "66", color: a ? COLORS.accent : COLORS.subtext }}>{it.weight}kg</span>
                  <span className="text-xs font-bold px-1.5 py-0.5 rounded" style={{ background: a ? COLORS.accent + "22" : COLORS.border + "66", color: a ? COLORS.accent : COLORS.subtext }}>{it.volume}L</span>
                </div>
              </div>
              <p className="text-xs mt-0.5" style={{ color: COLORS.subtext }}>{it.desc}</p>
              {it.event && <p className="text-xs mt-0.5" style={{ color: COLORS.positive }}>✦ {it.event}</p>}
            </div>
          </button>
        ); })}
      </div>

      <div className="flex gap-2">
        <button onClick={() => dispatch({ type: ACTION.SET_CASTING_STEP, payload: 2 })} className="flex-1 py-3 rounded-xl font-medium text-sm" style={{ background: COLORS.bg, color: COLORS.subtext, border: `1px solid ${COLORS.border}` }}>← 이전</button>
        <button disabled={sel.length === 0} onClick={() => dispatch({ type: ACTION.SET_CASTING_STEP, payload: 4 })} className="flex-1 py-3 rounded-xl text-white font-semibold disabled:opacity-40" style={{ background: COLORS.accent }}>다음 →</button>
      </div>
    </div>
  );
}

// ── Step 4: 체크인 연출 ──
function CastingStep4({ state, dispatch }) {
  const draft = state.castingDraft;
  const [phase, setPhase] = useState(0);
  const [unpackIdx, setUnpackIdx] = useState(0);
  const [npcIdx, setNpcIdx] = useState(0);

  useEffect(() => { const t = setTimeout(() => setPhase(1), 2000); return () => clearTimeout(t); }, []);
  useEffect(() => { if (phase === 1) { const t = setTimeout(() => setPhase(2), 2000); return () => clearTimeout(t); } }, [phase]);
  useEffect(() => {
    if (phase === 2 && unpackIdx < draft.suitcaseItems.length) { const t = setTimeout(() => setUnpackIdx((i) => i + 1), 500); return () => clearTimeout(t); }
    if (phase === 2 && unpackIdx >= draft.suitcaseItems.length) { const t = setTimeout(() => setPhase(3), 800); return () => clearTimeout(t); }
  }, [phase, unpackIdx, draft.suitcaseItems.length]);
  useEffect(() => {
    if (phase === 3 && npcIdx < PRESET_NPCS.length) { const t = setTimeout(() => setNpcIdx((i) => i + 1), 1000); return () => clearTimeout(t); }
    if (phase === 3 && npcIdx >= PRESET_NPCS.length) { const t = setTimeout(() => setPhase(4), 500); return () => clearTimeout(t); }
  }, [phase, npcIdx]);

  const startSim = useCallback(() => {
    const customNpc = {
      id: "custom", name: draft.name, emoji: draft.emoji, description: "나의 에이전트",
      personality: { ...draft.personality }, interests: [...draft.interests], suitcaseItems: [...draft.suitcaseItems],
      behaviorWeights: { lateNight: { rooms: 5, lobby: 2 }, morning: { cafe: 4, lobby: 3, rooms: 1 }, afternoon: { cafe: 3, lobby: 3, restaurant: 2 }, evening: { restaurant: 4, cafe: 3, lobby: 1 } },
    };
    const allNpcs = [customNpc, ...PRESET_NPCS];
    const period = getTimePeriod(480);
    const npcStates = {};
    allNpcs.forEach((npc) => {
      const w = npc.behaviorWeights[period] || {};
      const entries = Object.entries(w);
      const tot = entries.reduce((s, [, v]) => s + v, 0);
      let r = Math.random() * tot, loc = entries[0]?.[0] || "lobby";
      for (const [lid, wt] of entries) { r -= wt; if (r <= 0) { loc = lid; break; } }
      npcStates[npc.id] = { currentLocation: loc, currentActivity: "둘러보는 중", mood: "😊", lastActionTime: 0, behaviorDirective: null, directiveQueue: [] };
    });
    const rels = [];
    for (let i = 0; i < allNpcs.length; i++) for (let j = i + 1; j < allNpcs.length; j++) rels.push({ npcA: allNpcs[i].id, npcB: allNpcs[j].id, score: 0, history: [] });
    dispatch({ type: ACTION.COMPLETE_CASTING, payload: { npcs: { custom: customNpc, presets: [...PRESET_NPCS], branded: [] }, npcStates, relationships: rels } });
  }, [draft, dispatch]);

  return (
    <div className="w-full max-w-lg p-6 text-center" style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12 }}>
      {phase === 0 && (
        <div style={{ animation: "fadeInUp 0.6s ease-out both" }}>
          <p className="text-6xl mb-4">{draft.emoji}</p>
          <p className="text-lg" style={{ color: COLORS.text }}>{draft.name}이(가) Tamaverse에 도착했습니다...</p>
          <p className="text-sm mt-2" style={{ color: COLORS.subtext }}>🏨</p>
        </div>
      )}
      {phase === 1 && (
        <div style={{ animation: "fadeInUp 0.6s ease-out both" }}>
          <p className="text-5xl mb-4">🛎️</p>
          <p className="text-lg font-medium" style={{ color: COLORS.text }}>환영합니다, {draft.name} 님.</p>
          <p className="text-base mt-1" style={{ color: COLORS.accent }}>객실 203호입니다.</p>
          <p className="text-xs mt-3" style={{ color: COLORS.subtext }}>짐을 정리하는 중...</p>
        </div>
      )}
      {phase === 2 && (
        <div style={{ animation: "fadeInUp 0.4s ease-out both" }}>
          <p className="text-4xl mb-3">🧳</p>
          <p className="text-sm font-medium mb-4" style={{ color: COLORS.text }}>짐 풀기</p>
          <div className="flex flex-wrap justify-center gap-2 min-h-[48px]">
            {draft.suitcaseItems.slice(0, unpackIdx).map((id) => { const it = SUITCASE_ITEMS.find((x) => x.id === id); return (
              <span key={id} className="px-3 py-1.5 rounded-lg text-sm" style={{ background: COLORS.accent + "18", color: COLORS.accent, animation: "fadeInUp 0.3s ease-out both" }}>{it?.emoji} {it?.name}</span>
            ); })}
          </div>
        </div>
      )}
      {phase === 3 && (
        <div style={{ animation: "fadeInUp 0.4s ease-out both" }}>
          <p className="text-sm font-medium mb-4" style={{ color: COLORS.text }}>타마버스의 다른 투숙객들을 소개합니다</p>
          <div className="space-y-2">
            {PRESET_NPCS.slice(0, npcIdx).map((npc) => (
              <div key={npc.id} className="flex items-center gap-3 px-4 py-3 rounded-xl text-left" style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, animation: "fadeInUp 0.4s ease-out both" }}>
                <span className="text-2xl">{npc.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold" style={{ color: COLORS.text }}>{npc.name}</p>
                  <p className="text-xs" style={{ color: COLORS.subtext }}>{npc.description}</p>
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {personalityTags(npc.personality).map((t) => <span key={t} className="text-xs px-1.5 py-0.5 rounded" style={{ background: COLORS.accent + "15", color: COLORS.accent }}>{t}</span>)}
                    {npc.interests.map((i) => <span key={i} className="text-xs px-1.5 py-0.5 rounded" style={{ background: COLORS.positive + "15", color: COLORS.positive }}>{i}</span>)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {phase === 4 && (
        <div style={{ animation: "fadeInUp 0.6s ease-out both" }}>
          <p className="text-5xl mb-3">✨</p>
          <p className="text-lg font-bold mb-1" style={{ color: COLORS.text }}>모든 준비가 완료되었습니다!</p>
          <p className="text-sm mb-6" style={{ color: COLORS.subtext }}>{draft.name}과(와) 5명의 투숙객이 Tamaverse에서 생활을 시작합니다.</p>
          <button onClick={startSim} className="px-8 py-3.5 text-white font-bold text-lg transition-all duration-300 hover:scale-105 active:scale-95" style={{ background: "linear-gradient(135deg, #e94560, #ff6b6b)", boxShadow: "0 6px 30px rgba(233,69,96,0.4)", borderRadius: 50 }}>
            🏨 타마버스 생활 시작
          </button>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════
// 10. SimulationScreen — Full 3-Panel UI (Prompt 3)
// ═══════════════════════════════════════════════

// Helper: get all active NPCs
function getAllNpcs(state) {
  return [...(state.npcs.presets || []), state.npcs.custom, ...(state.npcs.branded || [])].filter(Boolean);
}

// Helper: get NPC by id
function getNpc(state, id) {
  return getAllNpcs(state).find((n) => n.id === id);
}

// ── Modal Overlay ──
function ModalOverlay({ children, onClose, width }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0" style={{ background: "rgba(10,10,20,0.6)", backdropFilter: "blur(4px)" }} />
      <div className="relative z-10" style={{ maxHeight: "85vh", overflowY: "auto", flexShrink: 0, ...(width ? { width } : {}) }} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

// ── Behavior Directive Modal ──
function BehaviorDirectiveModal({ state, dispatch }) {
  const cn = state.npcs.custom;
  if (!cn) return null;
  const ns = state.npcStates[cn.id];
  const queue = ns?.directiveQueue || [];
  // Build facility-based options from all floors
  const options = [];
  const seenIds = new Set();
  Object.entries(FLOOR_AMENITIES).forEach(([floor, amenities]) => {
    amenities.forEach(a => {
      if (!seenIds.has(a.id) && a.app) {
        seenIds.add(a.id);
        options.push({ id: a.id, label: `${a.emoji} ${a.name}`, desc: a.desc });
      }
    });
  });
  return (
    <ModalOverlay width={520} onClose={() => dispatch({ type: ACTION.CLOSE_MODAL })}>
      <div className="rounded-2xl p-6" style={{ ...MODAL_W, background: COLORS.card, border: `1px solid ${COLORS.border}` }}>
        <h3 style={{ color: COLORS.text, fontWeight: 700, fontSize: 16, fontFamily: "'JetBrains Mono', monospace", marginBottom: 4 }}>🎯 활동 예약</h3>
        <p className="text-xs mb-2" style={{ color: COLORS.subtext }}>{cn.name}의 행동 우선순위를 설정합니다 (최대 6개).</p>
        {/* Queue slots — square icon cards */}
        <div className="flex gap-1.5 mb-4">
          {[0,1,2,3,4,5].map(i => {
            const dir = queue[i];
            const opt = dir ? options.find(o => o.id === dir) : null;
            const emoji = opt ? opt.label.split(" ")[0] : "";
            const name = opt ? opt.label.substring(opt.label.indexOf(" ") + 1) : "";
            return (
              <button key={i}
                className="flex flex-col items-center justify-center gap-0.5 rounded-xl transition-all"
                style={{ width: 72, height: 72, border: `1.5px ${dir ? "solid" : "dashed"} ${dir ? COLORS.accent : COLORS.border}`, background: dir ? COLORS.accent + "15" : COLORS.bg, cursor: dir ? "pointer" : "default", opacity: dir ? 1 : 0.5, flexShrink: 0 }}
                onClick={() => dir && dispatch({ type: ACTION.TOGGLE_DIRECTIVE_QUEUE, payload: { npcId: cn.id, directive: dir } })}>
                {opt ? (
                  <>
                    <span style={{ fontSize: 24 }}>{emoji}</span>
                    <span style={{ fontSize: 9, color: COLORS.text, fontWeight: 700, lineHeight: 1.1, textAlign: "center" }}>{name}</span>
                  </>
                ) : (
                  <span style={{ color: COLORS.border, fontSize: 18, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>{i + 1}</span>
                )}
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-1.5 mb-4" style={{ maxHeight: 200, overflowY: "auto" }}>
          {options.map((o) => {
            const inQueue = queue.includes(o.id);
            const queueFull = queue.length >= 6;
            const name = o.label.substring(o.label.indexOf(" ") + 1);
            return (
              <button key={String(o.id)} onClick={() => dispatch({ type: ACTION.TOGGLE_DIRECTIVE_QUEUE, payload: { npcId: cn.id, directive: o.id } })}
                className="px-3 py-1.5 rounded-lg font-medium transition-all hover:scale-[1.03]"
                style={{ background: inQueue ? COLORS.accent + "18" : COLORS.bg, border: `1px solid ${inQueue ? COLORS.accent : COLORS.border}`, color: inQueue ? COLORS.accent : COLORS.text, fontSize: 12, opacity: !inQueue && queueFull ? 0.35 : 1 }}>
                {name}{inQueue ? ` #${queue.indexOf(o.id) + 1}` : ""}
              </button>
            );
          })}
        </div>
        <button onClick={() => dispatch({ type: ACTION.CLOSE_MODAL })} className="w-full py-2.5 rounded-lg text-xs font-medium" style={{ background: COLORS.border + "66", color: COLORS.subtext }}>닫기</button>
      </div>
    </ModalOverlay>
  );
}

// ── Suitcase Modal ──
function SuitcaseModal({ state, dispatch }) {
  const cn = state.npcs.custom;
  if (!cn) return null;
  const items = (cn.suitcaseItems || []).map((id) => SUITCASE_ITEMS.find((x) => x.id === id)).filter(Boolean);
  return (
    <ModalOverlay width={520} onClose={() => dispatch({ type: ACTION.CLOSE_MODAL })}>
      <div className="rounded-2xl p-6" style={{ ...MODAL_W, background: COLORS.card, border: `1px solid ${COLORS.border}` }}>
        <h3 className="text-lg font-bold mb-4" style={{ color: COLORS.text }}>🗄️ {cn.name}의 보관함</h3>
        {items.length === 0 ? (
          <p className="text-sm text-center py-6" style={{ color: COLORS.subtext }}>보관함이 비어 있습니다.</p>
        ) : (
          <div className="space-y-2 mb-4">
            {items.map((it) => (
              <div key={it.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl" style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}` }}>
                <span className="text-xl">{it.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium" style={{ color: COLORS.text }}>{it.name}</p>
                  <p className="text-xs" style={{ color: COLORS.subtext }}>{it.desc}</p>
                  {it.event && <p className="text-xs" style={{ color: COLORS.positive }}>✦ {it.event}</p>}
                </div>
                <span className="text-xs font-bold shrink-0" style={{ color: COLORS.accent }}>{it.cost}pt</span>
              </div>
            ))}
          </div>
        )}
        <button onClick={() => dispatch({ type: ACTION.CLOSE_MODAL })} className="w-full py-2.5 rounded-lg text-xs font-medium" style={{ background: COLORS.border + "66", color: COLORS.subtext }}>닫기</button>
      </div>
    </ModalOverlay>
  );
}

// ── Relationship History Modal ──
function RelationHistoryModal({ state, dispatch }) {
  const data = state.ui.modalData;
  if (!data) return null;
  const rel = state.relationships.find((r) => (r.npcA === data.npcA && r.npcB === data.npcB) || (r.npcA === data.npcB && r.npcB === data.npcA));
  if (!rel) return null;
  const nA = getNpc(state, rel.npcA);
  const nB = getNpc(state, rel.npcB);
  return (
    <ModalOverlay width={520} onClose={() => dispatch({ type: ACTION.CLOSE_MODAL })}>
      <div className="rounded-2xl p-6" style={{ ...MODAL_W, background: COLORS.card, border: `1px solid ${COLORS.border}` }}>
        <h3 className="text-lg font-bold mb-1" style={{ color: COLORS.text }}>{nA?.emoji} {nA?.name} ↔ {nB?.emoji} {nB?.name}</h3>
        <p className="text-sm font-bold mb-4" style={{ color: rel.score >= 0 ? COLORS.positive : COLORS.negative }}>친밀도: {rel.score >= 0 ? "+" : ""}{rel.score.toFixed(1)}</p>
        {rel.history.length === 0 ? (
          <p className="text-sm text-center py-4" style={{ color: COLORS.subtext }}>아직 기록이 없습니다.</p>
        ) : (
          <div className="space-y-1.5 max-h-60 overflow-y-auto mb-4">
            {rel.history.map((h, i) => (
              <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg text-xs" style={{ background: COLORS.bg }}>
                <span style={{ color: COLORS.text }}>{h.event}</span>
                <span className="font-bold shrink-0 ml-2" style={{ color: h.change >= 0 ? COLORS.positive : COLORS.negative }}>{h.change >= 0 ? "+" : ""}{h.change.toFixed(1)}</span>
              </div>
            ))}
          </div>
        )}
        <button onClick={() => dispatch({ type: ACTION.CLOSE_MODAL })} className="w-full py-2.5 rounded-lg text-xs font-medium" style={{ background: COLORS.border + "66", color: COLORS.subtext }}>닫기</button>
      </div>
    </ModalOverlay>
  );
}

// ── Content Detail Modal ──
function ContentDetailModal({ state, dispatch }) {
  const c = state.ui.modalData;
  if (!c) return null;
  const npc = getNpc(state, c.authorId);
  const close = () => dispatch({ type: ACTION.CLOSE_MODAL });
  const rd = c.richData;

  // ── DIARY VIEW ──
  if (c.type === "diary") {
    const title = rd?.title || `Day ${c.day}의 일기`;
    const mood = rd?.mood || "📝";
    const weather = rd?.weather || "";
    const body = rd?.body || c.text;
    const ps = rd?.ps || null;
    return (
      <ModalOverlay width={520} onClose={close}>
        <div className="rounded-2xl overflow-hidden" style={{ ...MODAL_W, background: "#1e1b2e", border: `1px solid rgba(233,69,96,0.25)`, boxShadow: "0 8px 40px rgba(0,0,0,0.6)" }}>
          {/* Diary header - warm, personal feel */}
          <div className="px-6 pt-5 pb-4" style={{ background: "linear-gradient(135deg, rgba(233,69,96,0.08), rgba(255,159,67,0.06))", borderBottom: `1px solid ${COLORS.border}` }}>
            <div className="flex items-center gap-2 mb-3">
              <span style={{ fontSize: 18 }}>📔</span>
              <span style={{ color: COLORS.accent, fontSize: 11, fontWeight: 700, letterSpacing: 1, fontFamily: "'JetBrains Mono', monospace" }}>개인 일기</span>
            </div>
            <h2 style={{ color: COLORS.text, fontWeight: 800, fontSize: 22, fontFamily: "'Playfair Display', serif", lineHeight: 1.3 }}>{title}</h2>
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-1.5">
                <span style={{ fontSize: 14 }}>{npc?.emoji}</span>
                <span style={{ color: COLORS.text, fontSize: 13, fontWeight: 700 }}>{npc?.name}</span>
              </div>
              <span style={{ color: COLORS.subtext, fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}>DAY {c.day}</span>
              {weather && <span style={{ color: COLORS.subtext, fontSize: 12 }}>{mood} {weather}</span>}
            </div>
          </div>
          {/* Diary body */}
          <div className="px-6 py-5">
            <div className="relative" style={{ paddingLeft: 16, borderLeft: `2px solid rgba(233,69,96,0.2)` }}>
              <div style={{ color: "#d4cfe8", fontSize: 14, lineHeight: 1.9, whiteSpace: "pre-line", fontFamily: "'Noto Sans KR', sans-serif" }}>
                {body}
              </div>
              {ps && (
                <div className="mt-4 pt-3" style={{ borderTop: `1px dashed rgba(255,255,255,0.08)` }}>
                  <p style={{ color: COLORS.expansion, fontSize: 13, fontStyle: "italic" }}>{ps}</p>
                </div>
              )}
            </div>
            {/* Diary footer - date stamp */}
            <div className="flex items-center justify-between mt-5 pt-3" style={{ borderTop: `1px solid ${COLORS.border}` }}>
              <div className="flex items-center gap-2">
                <span style={{ fontSize: 12 }}>🕰️</span>
                <span style={{ color: COLORS.subtext, fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}>
                  Tamaverse · Day {c.day} · {mood}
                </span>
              </div>
              <span style={{ color: "rgba(233,69,96,0.5)", fontSize: 20, fontFamily: "'Playfair Display', serif" }}>✦</span>
            </div>
          </div>
          <div className="px-6 pb-4">
            <button onClick={close} className="w-full py-2.5 rounded-xl text-sm font-medium transition-all hover:bg-white/5" style={{ color: COLORS.subtext, background: COLORS.border + "33" }}>닫기</button>
          </div>
        </div>
      </ModalOverlay>
    );
  }

  // ── SNS VIEW ──
  const handle = rd?.handle || `@${(npc?.name || "user").toLowerCase().replace(/\s/g, "_")}`;
  const body = rd?.body || c.text;
  const hashtags = rd?.hashtags || [];
  const likes = rd?.likes || Math.floor(Math.random() * 100) + 20;
  const comments = rd?.comments || [];
  const img = rd?.img || "📸";
  const timeAgo = ["방금 전", "1분 전", "3분 전", "12분 전", "1시간 전"][Math.floor(Math.random() * 5)];

  return (
    <ModalOverlay width={520} onClose={close}>
      <div className="rounded-2xl overflow-hidden" style={{ ...MODAL_W, background: "#1a1a2e", border: `1px solid rgba(78,205,196,0.2)`, boxShadow: "0 8px 40px rgba(0,0,0,0.6)" }}>
        {/* SNS header - platform bar */}
        <div className="flex items-center justify-between px-4 py-2.5" style={{ background: "rgba(78,205,196,0.06)", borderBottom: `1px solid ${COLORS.border}` }}>
          <div className="flex items-center gap-2">
            <span style={{ fontSize: 14 }}>📱</span>
            <span style={{ color: COLORS.core, fontSize: 12, fontWeight: 800, letterSpacing: 1.5, fontFamily: "'JetBrains Mono', monospace" }}>Tamaverse_GRAM</span>
          </div>
          <span style={{ color: COLORS.subtext, fontSize: 11 }}>Day {c.day}</span>
        </div>
        {/* User info */}
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="flex items-center justify-center rounded-full" style={{ width: 40, height: 40, background: "linear-gradient(135deg, #e94560, #4ecdc4)", padding: 2 }}>
            <div className="flex items-center justify-center rounded-full w-full h-full" style={{ background: "#1a1a2e" }}>
              <span style={{ fontSize: 18 }}>{npc?.emoji}</span>
            </div>
          </div>
          <div>
            <p style={{ color: COLORS.text, fontSize: 14, fontWeight: 700 }}>{npc?.name}</p>
            <p style={{ color: COLORS.subtext, fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}>{handle}</p>
          </div>
          <span className="ml-auto px-3 py-1 rounded-full text-xs font-bold" style={{ background: "rgba(78,205,196,0.15)", color: COLORS.core, border: `1px solid rgba(78,205,196,0.3)` }}>팔로잉</span>
        </div>
        {/* Image area (emoji representation) */}
        <div className="flex items-center justify-center" style={{ height: 180, background: "linear-gradient(135deg, rgba(78,205,196,0.06), rgba(233,69,96,0.04))", borderTop: `1px solid ${COLORS.border}`, borderBottom: `1px solid ${COLORS.border}` }}>
          <span style={{ fontSize: 64, filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.3))" }}>{img}</span>
        </div>
        {/* Action bar */}
        <div className="flex items-center gap-4 px-4 py-2.5">
          <span style={{ fontSize: 20, cursor: "pointer" }}>❤️</span>
          <span style={{ fontSize: 20, cursor: "pointer" }}>💬</span>
          <span style={{ fontSize: 20, cursor: "pointer" }}>🔖</span>
          <span className="ml-auto" style={{ color: COLORS.subtext, fontSize: 11 }}>{timeAgo}</span>
        </div>
        {/* Likes */}
        <div className="px-4 pb-1">
          <p style={{ color: COLORS.text, fontSize: 13, fontWeight: 700 }}>좋아요 {likes}개</p>
        </div>
        {/* Post body */}
        <div className="px-4 pb-2">
          <p style={{ color: COLORS.text, fontSize: 14, lineHeight: 1.7, whiteSpace: "pre-line" }}>
            <span style={{ fontWeight: 700 }}>{npc?.name}</span>{" "}{body}
          </p>
          {hashtags.length > 0 && (
            <p className="mt-1" style={{ color: COLORS.core, fontSize: 13 }}>
              {hashtags.join(" ")}
            </p>
          )}
        </div>
        {/* Comments */}
        {comments.length > 0 && (
          <div className="px-4 pb-3">
            {comments.map((cm, i) => (
              <p key={i} style={{ color: COLORS.subtext, fontSize: 12, marginTop: 4, lineHeight: 1.5 }}>
                <span style={{ color: COLORS.text, fontWeight: 700 }}>{cm.user}</span>{" "}{cm.text}
              </p>
            ))}
            <p className="mt-2" style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, cursor: "pointer" }}>댓글 더 보기...</p>
          </div>
        )}
        <div className="px-4 pb-4 pt-1">
          <button onClick={close} className="w-full py-2.5 rounded-xl text-sm font-medium transition-all hover:bg-white/5" style={{ color: COLORS.subtext, background: COLORS.border + "33" }}>닫기</button>
        </div>
      </div>
    </ModalOverlay>
  );
}

// (SimHeader moved to new UI section below)

// ── Pixel Art Floor Plans (Canvas 640×384, 4× detail) ──

const GW = 160, GH = 96, PX = 4;

// NPC spawn positions per location (game-pixel coords)
const NPC_POSITIONS = {
  lobby: [{ x: 30, y: 48 }, { x: 18, y: 64 }, { x: 50, y: 36 }, { x: 24, y: 40 }, { x: 55, y: 72 }, { x: 42, y: 56 }],
  cafe: [{ x: 114, y: 42 }, { x: 132, y: 42 }, { x: 114, y: 64 }, { x: 132, y: 64 }, { x: 102, y: 52 }, { x: 144, y: 36 }],
  rooms: [{ x: 30, y: 44 }, { x: 70, y: 44 }, { x: 110, y: 44 }, { x: 30, y: 74 }, { x: 70, y: 74 }, { x: 110, y: 74 }],
  restaurant: [{ x: 28, y: 44 }, { x: 52, y: 44 }, { x: 78, y: 50 }, { x: 28, y: 68 }, { x: 52, y: 68 }, { x: 120, y: 50 }],
  stage: [{ x: 80, y: 58 }, { x: 60, y: 66 }, { x: 100, y: 66 }, { x: 40, y: 74 }, { x: 120, y: 74 }, { x: 80, y: 74 }],
  skyline: [{ x: 40, y: 54 }, { x: 80, y: 48 }, { x: 120, y: 54 }, { x: 60, y: 72 }, { x: 100, y: 72 }, { x: 140, y: 50 }],
  vending: [{ x: 36, y: 48 }, { x: 56, y: 48 }, { x: 76, y: 48 }, { x: 120, y: 56 }, { x: 120, y: 72 }, { x: 44, y: 72 }],
};

const FLOOR_META = {
  "1F": { title: "1F — LOBBY & Tamaverse BREW", locs: ["lobby", "cafe"] },
  "2F": { title: "2F — ROOMS", locs: ["rooms"] },
  "3F": { title: "3F — THE TABLE", locs: ["restaurant"] },
  "4F": { title: "4F — STAGE Tamaverse", locs: ["stage"] },
  "5F": { title: "5F — SKYLINE", locs: ["skyline"] },
  "B1F": { title: "B1F — VENDING CORNER", locs: ["vending"] },
};

// Floor transit routes — multiple entry/exit points per floor for varied NPC movement
const FLOOR_ROUTES = {
  "1F": [{ x: 10, y: 50, label: "정문" }, { x: 78, y: 86, label: "엘리베이터" }, { x: 148, y: 60, label: "후문" }],
  "2F": [{ x: 12, y: 48, label: "계단(좌)" }, { x: 78, y: 86, label: "엘리베이터" }, { x: 145, y: 48, label: "계단(우)" }],
  "3F": [{ x: 15, y: 52, label: "계단(좌)" }, { x: 78, y: 86, label: "엘리베이터" }, { x: 140, y: 55, label: "서비스 통로" }],
  "4F": [{ x: 14, y: 45, label: "계단(좌)" }, { x: 78, y: 86, label: "엘리베이터" }],
  "5F": [{ x: 78, y: 86, label: "엘리베이터" }, { x: 142, y: 42, label: "옥상 계단" }],
  "B1F": [{ x: 20, y: 50, label: "지하 계단" }, { x: 78, y: 86, label: "엘리베이터" }],
};
// Pick a random route for a given floor
function pickRoute(floorId, npcId) {
  const routes = FLOOR_ROUTES[floorId] || [{ x: 78, y: 86 }];
  // Use npcId hash + timestamp for deterministic but varied selection
  const hash = typeof npcId === "string" ? npcId.split("").reduce((a, c) => a + c.charCodeAt(0), 0) : 0;
  const idx = (hash + Math.floor(Date.now() / 3000)) % routes.length;
  return routes[idx];
}
// Legacy compatibility
const ELEVATOR_POS = {
  "1F": { x: 78, y: 86 },
  "2F": { x: 78, y: 86 },
  "3F": { x: 78, y: 86 },
  "4F": { x: 78, y: 86 },
  "5F": { x: 78, y: 86 },
  "B1F": { x: 78, y: 86 },
};

// Quick lookup: location → floor
const LOC_TO_FLOOR = {};
INITIAL_LOCATIONS.forEach(l => { LOC_TO_FLOOR[l.id] = l.floor; });

// Movement constants
const NPC_WALK_SPEED = 0.45; // game pixels per frame (~30fps)
const NPC_WALK_FRAME_RATE = 6; // frames between walk animation cycles
const NPC_IDLE_BOB_AMP = 0.4; // idle bobbing amplitude in game pixels
const NPC_IDLE_BOB_SPEED = 0.04; // bobbing speed

// Draw helper — game coords, canvas is PX× upscaled via ctx.scale
function D(ctx) {
  ctx.imageSmoothingEnabled = false;
  return {
    p: (x, y, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, 1, 1); },
    r: (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); },
    hl: (x, y, w, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, 1); },
    vl: (x, y, h, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, 1, h); },
    ctx,
  };
}

// Color utilities
function darken(hex, amt) { const n = parseInt(hex.slice(1), 16); return `#${[16,8,0].map(s=>Math.max(0,((n>>s)&0xff)-amt).toString(16).padStart(2,"0")).join("")}`; }
function lighten(hex, amt) { return darken(hex, -amt); }

// Deterministic palette from NPC id
function hashStr(s) { let h = 0; for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0; return Math.abs(h); }
const HAIR_PAL = ["#3a2010","#1a1018","#c87830","#d8a040","#a83020","#584838","#e8c878","#682828","#384878","#885828"];
const SHIRT_PAL = ["#c84040","#4868a8","#48a848","#d8a040","#8858a0","#c86840","#38a8a0","#a8486a","#6888b8","#d87858"];
const PANTS_PAL = ["#384878","#483828","#585858","#6b4422","#282858","#483838","#785830","#383848","#584828","#686868"];
const SKIN_PAL = ["#f0c8a0","#e8b888","#d8a870","#c89860","#f0d0b0","#e0b890"];
function getNpcPalette(npc) {
  const h = hashStr(npc.id + npc.name);
  return { hair: HAIR_PAL[h % 10], shirt: SHIRT_PAL[(h>>4) % 10], pants: PANTS_PAL[(h>>8) % 10], skin: SKIN_PAL[(h>>12) % 6] };
}

// Draw Stardew-style NPC sprite (5w×9h game pixels) on canvas
// walkFrame: 0=idle, 1=left-step, 2=idle, 3=right-step
function drawNpcSprite(d, x, y, palette, facing, walkFrame = 0) {
  const { hair, shirt, pants, skin } = palette;
  const hDk = darken(hair, 30), sDk = darken(shirt, 25), skDk = darken(skin, 20);
  const isWalking = walkFrame === 1 || walkFrame === 3;
  // Shadow (slightly wider when walking)
  d.ctx.fillStyle = "rgba(0,0,0,0.2)";
  d.ctx.fillRect(x - 1, y + 8, isWalking ? 6 : 5, 1);
  // Hair
  d.r(x, y, 3, 1, hDk); d.r(x - 1, y + 1, 5, 2, hair);
  // Face
  if (facing !== 3) {
    d.r(x, y + 2, 3, 1, skin);
    if (facing === 2) { // left
      d.p(x, y + 2, "#1a1018"); d.p(x + 1, y + 2, "#1a1018");
    } else { // front / right-ish
      d.p(x, y + 2, "#1a1018"); d.p(x + 2, y + 2, "#1a1018");
    }
    if (facing === 0) d.p(x + 1, y + 3, skDk);
  } else { d.r(x, y + 2, 3, 1, hDk); }
  d.r(x, y + 3, 3, 1, skin);
  // Shirt + arms
  d.r(x - 1, y + 4, 5, 2, shirt); d.hl(x - 1, y + 5, 5, sDk);
  // Arms swing when walking
  if (isWalking) {
    const armSwing = walkFrame === 1;
    d.p(x - 1, y + (armSwing ? 3 : 5), skin);
    d.p(x + 3, y + (armSwing ? 5 : 3), skin);
  } else {
    d.p(x - 1, y + 4, skin); d.p(x + 3, y + 4, skin);
  }
  // Pants + shoes — animated
  const pDk = darken(pants, 15), pDk2 = darken(pants, 35);
  if (walkFrame === 1) {
    // Left leg forward, right back
    d.r(x - 1, y + 6, 1, 1, pants); d.r(x + 2, y + 6, 1, 1, pants);
    d.p(x, y + 6, pDk);
    d.p(x - 1, y + 7, pDk2); d.p(x + 3, y + 7, pDk2);
    d.r(x + 1, y + 6, 1, 2, pants);
  } else if (walkFrame === 3) {
    // Right leg forward, left back
    d.r(x, y + 6, 1, 1, pants); d.r(x + 3, y + 6, 1, 1, pants);
    d.p(x + 2, y + 6, pDk);
    d.p(x, y + 7, pDk2); d.p(x + 2, y + 7, pDk2);
    d.r(x + 1, y + 6, 1, 2, pants);
  } else {
    // Standing still
    d.r(x, y + 6, 1, 2, pants); d.r(x + 2, y + 6, 1, 2, pants);
    d.p(x + 1, y + 6, pDk);
    d.p(x, y + 7, pDk2); d.p(x + 2, y + 7, pDk2);
  }
}

// ── HD Floor renderers ──
function hdWoodFloor(d, x0, y0, w, h) {
  const plankW = 8;
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) {
    const row = Math.floor((y - y0) / 4), offset = row % 2 === 1 ? 4 : 0;
    const px = (x - x0 + offset) % plankW, py = (y - y0) % 4;
    const pi = Math.floor((x - x0 + offset) / plankW) + row;
    const bases = ["#c8a070","#bc9464","#b48858","#d0a878","#c4985c","#c89c6c"];
    let c = bases[pi % 6];
    if (px === 0) c = "#8e6838";
    else if (px === 1) c = lighten(c, 8);
    else if (px === plankW - 1) c = darken(c, 12);
    if (py === 0) c = darken(c, 18);
    if (py === 2 && px > 1 && px < plankW - 1 && (x + pi * 3) % 5 === 0) c = darken(c, 10);
    if ((pi * 37 + row * 13) % 47 === 0 && px === 3 && py === 1) c = "#8e6838";
    if (py === 2 && (px === 1 || px === plankW - 2) && row % 3 === 0) c = "#7a5828";
    d.p(x, y, c);
  }
}
function hdStoneFloor(d, x0, y0, w, h) {
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) {
    const ty = Math.floor((y - y0) / 6), tx = Math.floor((x - x0 + (ty % 2 === 1 ? 3 : 0)) / 6);
    const lx = (x - x0 + (ty % 2 === 1 ? 3 : 0)) % 6, ly = (y - y0) % 6;
    const bases = ["#b0a898","#a89888","#b8b0a0","#a09080"];
    let c = bases[(tx + ty * 3) % 4];
    if (lx === 0 || ly === 0) c = "#787060";
    if (lx === 1 && ly === 1) c = lighten(c, 8);
    if (lx === 5 || ly === 5) c = darken(c, 8);
    if ((x * 17 + y * 31) % 23 === 0) c = darken(c, 5);
    d.p(x, y, c);
  }
}

// HD Walls with wallpaper, chair rail, wainscoting panels, baseboard
function hdWalls(d, x0, x1, hasBottom, wpColor, patternFn) {
  const w = x1 - x0;
  d.r(x0, 0, w, 1, "#3a2010");
  d.r(x0, 1, w, 5, wpColor || "#e0d0b0");
  if (patternFn) patternFn(d, x0, 1, w, 5);
  else { for (let y = 2; y < 5; y += 2) for (let x = x0 + 2; x < x1 - 2; x += 4) d.p(x, y, lighten(wpColor || "#e0d0b0", 10)); }
  d.hl(x0, 6, w, "#a88858"); d.hl(x0, 7, w, "#8a6838"); d.hl(x0, 8, w, "#6a4820");
  d.r(x0, 9, w, 3, "#b89868");
  for (let px = x0; px < x1; px += 10) { const pw = Math.min(10, x1 - px); d.vl(px, 9, 3, "#8a6838"); if (px + 1 < x1) d.vl(px + 1, 9, 3, "#c8a878"); if (pw > 4) d.r(px + 2, 10, pw - 4, 1, "#d0b888"); }
  d.hl(x0, 12, w, "#6a4820"); d.hl(x0, 13, w, "#5a3818");
  if (x0 <= 1) { for (let y = 0; y < GH; y++) { d.p(0, y, "#3a2010"); d.p(1, y, "#5a3818"); } }
  if (hasBottom) { d.hl(x0, GH - 2, w, "#5a3818"); d.hl(x0, GH - 1, w, "#3a2010"); }
}

function hdWindow(d, wx, wy, ww, wh) {
  d.r(wx, wy, ww, wh, "#6a4820");
  d.r(wx + 1, wy, ww - 2, 1, "#8a6838");
  d.r(wx + 1, wy + 1, ww - 2, wh - 2, "#78b8d8");
  d.hl(wx + 1, wy + Math.floor(wh / 2), ww - 2, "#6a4820");
  d.vl(wx + Math.floor(ww / 2), wy + 1, wh - 2, "#6a4820");
  d.r(wx + 2, wy + 1, ww - 4, 1, "#a0d8f0"); d.r(wx + 2, wy + 2, ww - 4, 1, "#88c8e8");
  d.p(wx + 2, wy + 2, "#d0f0ff"); d.p(wx + 3, wy + 2, "#c0e8f8");
  d.vl(wx + 1, wy + 1, wh - 2, "#a83828"); d.vl(wx + 2, wy + 1, wh - 2, "#882018");
  d.vl(wx + ww - 2, wy + 1, wh - 2, "#a83828"); d.vl(wx + ww - 3, wy + 1, wh - 2, "#882018");
  d.hl(wx, wy, ww, "#a88858");
  d.r(wx - 1, wy + wh, ww + 2, 1, "#c8a868");
  for (let i = 1; i <= 3; i++) { d.ctx.fillStyle = `rgba(255,248,200,${0.04 - i * 0.01})`; d.ctx.fillRect(wx, wy + wh + i, ww, 1); }
}

function hdPlant(d, px, py, sz) {
  const pw = Math.max(4, sz + 1), ph = Math.max(3, sz - 1);
  d.r(px - 1, py + sz * 2, pw + 2, 1, "#c8a060"); d.r(px, py + sz * 2 + 1, pw, ph, "#a06838");
  d.r(px + 1, py + sz * 2 + 1, pw - 2, 1, "#c08050"); d.r(px + 1, py + sz * 2, pw - 2, 1, "#504030");
  const lc = ["#48a830","#388820","#68c848","#2e7a18","#58b838","#307018"];
  for (let i = 0; i < sz * 3; i++) {
    const lx = px + Math.floor(pw / 2) + Math.floor(Math.cos(i * 1.2) * sz * 0.5 + Math.sin(i * 0.8) * sz * 0.3);
    const ly = py + sz * 2 - Math.floor(i * 0.7) - 1;
    if (ly >= py) { d.p(lx, ly, lc[i % 6]); d.p(lx + 1, ly, lc[(i + 2) % 6]); if (sz > 3) d.p(lx - 1, ly, lc[(i + 4) % 6]); }
  }
}

function hdFireplace(d, fx, fy) {
  d.r(fx, fy, 14, 2, "#a08868"); d.r(fx + 1, fy, 12, 1, "#c8a878");
  d.r(fx, fy + 2, 14, 12, "#706058");
  for (let sy = fy + 2; sy < fy + 14; sy += 3) for (let sx = fx; sx < fx + 14; sx += 4) { const off = Math.floor((sy - fy) / 3) % 2 === 1 ? 2 : 0; d.hl(sx + off, sy, 4, "#605048"); }
  d.r(fx + 3, fy + 4, 8, 8, "#282018"); d.r(fx + 3, fy + 4, 8, 1, "#3a2818");
  d.p(fx + 5, fy + 9, "#f88020"); d.p(fx + 6, fy + 8, "#f0c040"); d.p(fx + 7, fy + 9, "#f88020");
  d.p(fx + 8, fy + 10, "#e06010"); d.p(fx + 6, fy + 7, "#f8d848"); d.p(fx + 7, fy + 8, "#f0a028");
  d.p(fx + 5, fy + 10, "#c84010"); d.p(fx + 8, fy + 9, "#f0a028"); d.p(fx + 9, fy + 10, "#e07018");
  d.r(fx + 4, fy + 10, 6, 1, "#5a3818"); // logs
  d.p(fx + 4, fy + 11, "#c83808"); d.p(fx + 6, fy + 11, "#a82808"); d.p(fx + 8, fy + 11, "#c83808");
  for (let i = 1; i <= 6; i++) { d.ctx.fillStyle = `rgba(248,128,32,${0.06 - i * 0.008})`; d.ctx.fillRect(fx - 2, fy + 13 + i, 18, 1); }
  d.r(fx - 1, fy + 12, 16, 2, "#807068"); d.hl(fx - 1, fy + 12, 16, "#908878");
}

function hdBookshelf(d, bx, by, bw, bh) {
  d.r(bx, by, bw, bh, "#4a2810"); d.vl(bx, by, bh, "#3a2010"); d.vl(bx + bw - 1, by, bh, "#3a2010"); d.hl(bx, by, bw, "#5a3818");
  const bc = ["#c84040","#4898a0","#4868a8","#d8b040","#8858a0","#388820","#c87830","#6868a8","#d87848","#48a868"];
  const sH = Math.floor((bh - 2) / 5);
  for (let s = 0; s < 5; s++) { const sy = by + 1 + s * sH; d.hl(bx, sy + sH - 1, bw, "#6a4420"); d.hl(bx + 1, sy + sH, bw - 2, "#5a3818");
    for (let b = 0; b < bw - 2; b++) { const h2 = sH - 2 - (b % 3 === 0 ? 1 : 0); const cl = bc[(s * 7 + b * 3) % 10]; d.r(bx + 1 + b, sy + sH - 1 - h2, 1, h2, cl); if (h2 > 2) d.p(bx + 1 + b, sy + sH - h2, lighten(cl, 20)); }
  }
}

function hdSofa(d, sx, sy, w) {
  d.r(sx, sy, w, 2, darken("#c86040", 20)); d.hl(sx, sy, w, darken("#c86040", 30)); d.hl(sx + 1, sy + 1, w - 2, lighten("#c86040", 10));
  d.r(sx, sy + 2, w, 4, "#c86040"); d.r(sx + 1, sy + 2, w - 2, 3, "#d87858");
  for (let i = 1; i < Math.floor(w / 6); i++) d.vl(sx + i * Math.floor(w / Math.floor(w / 6)), sy + 2, 3, "#b85838");
  d.r(sx, sy + 1, 2, 5, darken("#c86040", 25)); d.r(sx + w - 2, sy + 1, 2, 5, darken("#c86040", 25));
  d.hl(sx, sy + 6, w, darken("#c86040", 35));
  d.ctx.fillStyle = "rgba(0,0,0,0.12)"; d.ctx.fillRect(sx, sy + 7, w, 1);
}

function hdCounter(d, cx, cy, cw, ch, vert) {
  if (vert) { d.r(cx, cy, cw, ch, "#7a5228"); d.vl(cx, cy, ch, "#8a6238"); d.vl(cx + cw - 1, cy, ch, "#5a3818"); d.r(cx, cy, cw, 1, "#c8a868"); }
  else { d.r(cx, cy, cw, 1, "#c8a868"); d.hl(cx, cy, cw, "#d8b878"); d.r(cx, cy + 1, cw, ch - 1, "#7a5228"); d.hl(cx, cy + ch, cw, "#5a3818");
    for (let px = cx + 2; px < cx + cw - 2; px += 8) { d.vl(px, cy + 2, ch - 3, "#6a4218"); d.vl(px + 1, cy + 2, ch - 3, "#8a6238"); }
  }
}

function hdCafeTable(d, tx, ty) {
  d.ctx.fillStyle = "rgba(0,0,0,0.1)"; d.ctx.fillRect(tx, ty + 7, 10, 1);
  d.r(tx, ty, 10, 6, "#8b6030"); d.r(tx + 1, ty, 8, 1, "#a87840"); d.r(tx + 1, ty + 1, 8, 4, "#c8a868"); d.hl(tx, ty + 6, 10, "#6a4020");
  d.p(tx + 1, ty + 6, "#6a4020"); d.p(tx + 8, ty + 6, "#6a4020");
  d.p(tx + 3, ty + 1, "#f0e8d8"); d.p(tx + 4, ty + 1, "#f0e8d8"); d.p(tx + 6, ty + 2, "#a05028"); d.p(tx + 6, ty + 1, "#d8d0c0");
  const chair = (cx2, cy2, flip) => { d.r(cx2, cy2, 4, 2, "#8b6030"); d.r(cx2, cy2 + 2, 4, 1, "#a07040");
    if (!flip) { d.r(cx2, cy2 - 2, 4, 2, "#6a4020"); d.hl(cx2, cy2 - 2, 4, "#7a5030"); }
    else { d.r(cx2, cy2 + 3, 4, 2, "#6a4020"); d.hl(cx2 + 1, cy2 + 3, 2, "#7a5030"); }
  };
  chair(tx + 1, ty - 4, false); chair(tx + 5, ty - 4, false);
  chair(tx + 1, ty + 7, true); chair(tx + 5, ty + 7, true);
}

function hdCarpet(d, cx, cy, cw, ch) {
  d.r(cx, cy, cw, ch, "#8a2818");
  d.hl(cx, cy, cw, "#d8a040"); d.hl(cx, cy + ch - 1, cw, "#d8a040"); d.vl(cx, cy, ch, "#d8a040"); d.vl(cx + cw - 1, cy, ch, "#d8a040");
  d.hl(cx + 1, cy + 1, cw - 2, "#6a1810"); d.hl(cx + 1, cy + ch - 2, cw - 2, "#6a1810"); d.vl(cx + 1, cy + 1, ch - 2, "#6a1810"); d.vl(cx + cw - 2, cy + 1, ch - 2, "#6a1810");
  d.hl(cx + 2, cy + 2, cw - 4, "#c89030"); d.hl(cx + 2, cy + ch - 3, cw - 4, "#c89030"); d.vl(cx + 2, cy + 2, ch - 4, "#c89030"); d.vl(cx + cw - 3, cy + 2, ch - 4, "#c89030");
  for (let y = cy + 4; y < cy + ch - 4; y += 3) for (let x = cx + 4; x < cx + cw - 4; x += 3) { d.p(x, y, "#b83828"); d.p(x + 1, y, "#9a2018"); d.p(x, y + 1, "#9a2018"); d.p(x + 1, y + 1, "#c84838"); }
  for (let x = cx + 1; x < cx + cw - 1; x += 2) { d.p(x, cy + ch, "#c89030"); d.p(x, cy - 1, "#c89030"); }
}

function sharedWoodFloor(d, x0, y0, w, h) {
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) {
    const plk = Math.floor((x + Math.floor(y / 4) * 3) / 6);
    d.p(x, y, ["#c8a070", "#bc9464", "#b48858", "#d0a878"][(plk + Math.floor(y / 4)) % 4]);
    if ((x + Math.floor(y / 4) * 3) % 6 === 0) d.p(x, y, "#a07848");
    if (y % 4 === 0 && (x + plk) % 3 !== 0) d.p(x, y, "#a07848");
  }
}

function sharedStoneFloor(d, x0, y0, w, h) {
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) {
    const shifted = Math.floor((y - y0) / 8) % 2 === 1;
    const ax = shifted ? (x - x0 + 4) % 8 : (x - x0) % 8;
    d.p(x, y, ["#a09888", "#989088", "#b0a898"][(Math.floor((x - x0) / 8) + Math.floor((y - y0) / 8)) % 3]);
    if (ax === 0 || (y - y0) % 8 === 0) d.p(x, y, "#807870");
  }
}

function sharedTileFloor(d, x0, y0, w, h, c1, c2) {
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) {
    d.p(x, y, ((x - x0 + y - y0) % 2 === 0) ? c1 : c2);
    if ((x - x0) % 8 === 0 || (y - y0) % 8 === 0) d.p(x, y, "#787068");
  }
}

function sharedWalls(d, bottom) {
  d.r(0, 0, GW, 2, "#4a3018"); d.r(0, 2, GW, 3, "#d8c4a0"); d.hl(0, 5, GW, "#7a5a3a");
  d.r(0, 6, GW, 3, "#a89068"); d.hl(0, 9, GW, "#5c4028");
  d.vl(0, 0, GH, "#4a3018"); d.vl(GW - 1, 0, GH, "#4a3018");
  if (bottom) { d.hl(0, GH - 4, GW, "#7a5a3a"); d.r(0, GH - 3, GW, 3, "#a89068"); d.hl(0, GH - 1, GW, "#4a3018"); }
}

function sharedWindow(d, wx, wy, ww, wh) {
  d.r(wx, wy, ww, wh, "#7a5a3a"); d.r(wx + 1, wy + 1, ww - 2, wh - 2, "#88c8e8");
  d.hl(wx + 1, wy + Math.floor(wh / 2), ww - 2, "#7a5a3a"); d.vl(wx + Math.floor(ww / 2), wy + 1, wh - 2, "#7a5a3a");
  d.p(wx + 2, wy + 2, "#b8e0f8"); d.p(wx + 3, wy + 2, "#b8e0f8"); d.p(wx + 2, wy + 3, "#b8e0f8");
  d.vl(wx + 1, wy + 1, wh - 2, "#e8d8c0"); d.vl(wx + ww - 2, wy + 1, wh - 2, "#e8d8c0");
}

function sharedPlant(d, px, py, sz) {
  d.r(px, py + sz + 1, Math.max(2, sz), Math.max(2, sz - 1), "#a06838");
  d.r(px, py + sz, Math.max(2, sz + 1), 1, "#c8a868");
  const lc = ["#48a830", "#388820", "#68c848", "#2e7a18"];
  for (let i = 0; i < sz * 2; i++) {
    const lx = px + Math.floor(Math.sin(i * 1.8) * sz * 0.7) + 1, ly = py + Math.floor(i * 0.5);
    d.p(lx, ly, lc[i % 4]); d.p(lx + 1, ly, lc[(i + 1) % 4]);
    if (sz > 3) { d.p(lx - 1, ly, lc[(i + 2) % 4]); d.p(lx + 2, ly, lc[(i + 3) % 4]); }
  }
}

function sharedTable(d, tx, ty, chairs) {
  d.r(tx, ty, 8, 6, "#b08050"); d.r(tx + 1, ty + 1, 6, 4, "#c8a868"); d.hl(tx, ty + 6, 8, "#7a5830");
  d.p(tx + 2, ty + 1, "#f0e8d8"); d.p(tx + 4, ty + 2, "#f8f0e0");
  if (chairs) {
    d.r(tx + 1, ty - 3, 3, 2, "#8b6030"); d.r(tx + 4, ty - 3, 3, 2, "#8b6030");
    d.r(tx + 1, ty - 1, 3, 1, "#a07040"); d.r(tx + 4, ty - 1, 3, 1, "#a07040");
    d.r(tx + 1, ty + 7, 3, 1, "#a07040"); d.r(tx + 4, ty + 7, 3, 1, "#a07040");
    d.r(tx + 1, ty + 8, 3, 2, "#8b6030"); d.r(tx + 4, ty + 8, 3, 2, "#8b6030");
  }
}

function sharedCarpet(d, cx, cy, cw, ch) {
  d.r(cx, cy, cw, ch, "#a03020");
  d.hl(cx, cy, cw, "#d8a040"); d.hl(cx, cy + ch - 1, cw, "#d8a040");
  d.vl(cx, cy, ch, "#d8a040"); d.vl(cx + cw - 1, cy, ch, "#d8a040");
  d.hl(cx + 1, cy + 1, cw - 2, "#c89030"); d.hl(cx + 1, cy + ch - 2, cw - 2, "#c89030");
  d.vl(cx + 1, cy + 1, ch - 2, "#c89030"); d.vl(cx + cw - 2, cy + 1, ch - 2, "#c89030");
  for (let y = cy + 3; y < cy + ch - 3; y += 4) for (let x = cx + 3; x < cx + cw - 3; x += 4) {
    d.p(x, y, "#c84838"); d.p(x + 1, y, "#b83828"); d.p(x, y + 1, "#b83828"); d.p(x + 1, y + 1, "#c84838");
  }
}

function sharedSofa(d, sx, sy) {
  d.r(sx, sy, 16, 2, "#7a3a20"); d.r(sx, sy + 2, 16, 5, "#c86040"); d.r(sx + 1, sy + 2, 14, 4, "#d87858");
  d.r(sx, sy + 2, 2, 5, "#7a3a20"); d.r(sx + 14, sy + 2, 2, 5, "#7a3a20");
  d.vl(sx + 5, sy + 3, 3, "#b85838"); d.vl(sx + 10, sy + 3, 3, "#b85838"); d.hl(sx, sy + 7, 16, "#6b3018");
}

// ═══════ 1F: LOBBY & Tamaverse BREW (HD) ═══════
function drawFloor1F(ctx) {
  const d = D(ctx);
  d.r(0, 0, GW, GH, "#0e0a06");
  // Floors
  hdWoodFloor(d, 2, 14, 69, 80); hdStoneFloor(d, 72, 14, 17, 80); hdWoodFloor(d, 90, 14, 68, 80);
  // Walls
  hdWalls(d, 0, 71, true, "#e0d0b0", (d2, x0, y, w, h) => { for (let py = y + 1; py < y + h; py += 2) for (let px = x0 + 2; px < x0 + w; px += 3) d2.p(px, py, "#e8d8c0"); });
  hdWalls(d, 89, GW, true, "#d8d0b8", (d2, x0, y, w, h) => { for (let py = y; py < y + h; py += 2) for (let px = x0 + 1; px < x0 + w; px += 4) d2.p(px + (py % 4 === 0 ? 2 : 0), py, "#e0d8c0"); });
  // Hallway walls (stone)
  d.r(72, 0, 17, 1, "#3a2010"); d.r(72, 1, 17, 5, "#908070"); d.r(72, 6, 17, 2, "#706058"); d.r(72, 8, 17, 2, "#807068");
  for (let y = 1; y < 8; y += 3) for (let x = 72; x < 89; x += 5) d.hl(x, y, 5, "#706058");
  d.hl(72, 10, 17, "#605048"); d.hl(72, 11, 17, "#504038");
  // Divider walls
  const wallDiv = (x, y0, h2) => { d.vl(x, y0, h2, "#3a2010"); d.vl(x + 1, y0, h2, "#7a5a3a"); d.vl(x + 2, y0, h2, "#b89868"); d.vl(x + 3, y0, h2, "#7a5a3a"); d.vl(x + 4, y0, h2, "#3a2010"); };
  wallDiv(69, 12, 26); wallDiv(69, 62, 32); wallDiv(85, 12, 26); wallDiv(85, 62, 32);
  d.r(69, 37, 5, 1, "#a88858"); d.r(85, 37, 5, 1, "#a88858");
  hdStoneFloor(d, 69, 38, 5, 24); hdStoneFloor(d, 85, 38, 5, 24);
  // Windows
  hdWindow(d, 10, 1, 12, 6); hdWindow(d, 28, 1, 12, 6); hdWindow(d, 48, 1, 12, 6);
  hdWindow(d, 96, 1, 12, 6); hdWindow(d, 114, 1, 12, 6); hdWindow(d, 134, 1, 12, 6);
  // Entrance
  d.r(75, GH - 2, 10, 2, "#3a2010"); d.r(76, GH - 6, 8, 4, "#5a3818"); d.r(77, GH - 5, 6, 2, "#4a2810"); d.p(82, GH - 4, "#d8b868");
  d.r(73, GH - 8, 14, 2, "#706858"); d.hl(74, GH - 7, 12, "#607048");

  // ══ LOBBY ══
  // Reception desk (L-shaped)
  hdCounter(d, 26, 26, 24, 4, false); hdCounter(d, 48, 17, 4, 13, true);
  d.p(30, 25, "#d8b040"); d.p(31, 25, "#d8b040"); d.p(30, 24, "#e8c848"); // bell
  d.r(34, 25, 5, 1, "#f0e8d8"); // papers
  d.r(38, 23, 3, 2, "#484848"); d.p(39, 23, "#88c8e8"); // monitor
  d.r(37, 25, 4, 1, "#e8e0d0"); // keyboard

  // Sofas
  hdSofa(d, 6, 38, 16); hdSofa(d, 6, 58, 16);
  // Coffee table
  d.r(9, 50, 10, 6, "#8b6030"); d.r(10, 50, 8, 1, "#a87840"); d.r(10, 51, 8, 4, "#c8a868"); d.hl(9, 56, 10, "#6a4020");
  d.r(11, 51, 3, 2, "#4898a0"); d.p(11, 51, "#58a8b0"); d.p(15, 52, "#f0e8d8"); // book + cup

  // Carpet
  hdCarpet(d, 26, 36, 36, 20);

  // Bookshelf
  hdBookshelf(d, 2, 14, 7, 22);

  // Fireplace
  hdFireplace(d, 2, 38);

  // Wall art
  d.r(12, 2, 5, 4, "#5a3818"); d.r(13, 3, 3, 2, "#88c8e8");
  d.r(36, 2, 8, 4, "#6a4420"); d.r(37, 2, 6, 1, "#8a6838"); d.r(37, 3, 6, 2, "#c86840"); d.p(39, 3, "#f0c040");

  // Floor lamp
  d.vl(63, 38, 12, "#787058"); d.r(61, 36, 5, 3, "#e8d8b0"); d.p(63, 37, "#fff8e0");
  d.ctx.fillStyle = "rgba(255,248,220,0.04)"; d.ctx.fillRect(59, 39, 9, 12);

  // Plants
  hdPlant(d, 62, 14, 5); hdPlant(d, 58, 74, 4); hdPlant(d, 2, 76, 3); hdPlant(d, 24, 14, 4);

  // ══ HALLWAY ══
  d.r(76, 16, 8, 56, "#8a2818"); d.vl(76, 16, 56, "#d8a040"); d.vl(83, 16, 56, "#d8a040"); d.hl(76, 16, 8, "#d8a040"); d.hl(76, 71, 8, "#d8a040");
  d.vl(77, 17, 54, "#6a1810"); d.vl(82, 17, 54, "#6a1810");
  for (let y = 18; y < 70; y += 3) d.hl(78, y, 4, "#c89030");
  d.vl(80, 6, 4, "#787058"); d.r(78, 10, 5, 2, "#e8d8b0"); d.p(80, 11, "#fff8e0"); // lamp
  d.r(73, 3, 4, 4, "#d8b040"); d.r(74, 4, 2, 2, "#f0e8d8"); d.p(75, 4, "#1a1a1a"); d.p(74, 5, "#1a1a1a"); // clock

  // ══ CAFÉ ══
  hdCounter(d, 92, 20, 22, 4, false); hdCounter(d, 92, 24, 4, 16, true);
  for (let i = 0; i < 4; i++) { d.r(97 + i * 5, 25, 3, 2, "#8b6030"); d.p(98 + i * 5, 27, "#6a4020"); } // bar stools

  // Espresso machine
  d.r(109, 12, 7, 8, "#606060"); d.r(110, 12, 5, 1, "#808080"); d.r(110, 13, 5, 6, "#484848");
  d.p(111, 14, "#888"); d.p(113, 14, "#888"); d.r(111, 17, 3, 1, "#383838");
  d.r(110, 11, 5, 1, "#909090"); d.p(112, 10, "#c0c0c0"); d.p(112, 9, "#d0d0d0"); // steam

  // Pastry case
  d.r(98, 13, 10, 6, "#8b6838"); d.r(99, 13, 8, 1, "#a88858"); d.r(99, 14, 8, 4, "#e8e0d0");
  d.p(100, 15, "#c89030"); d.p(102, 15, "#c84040"); d.p(104, 15, "#d8b040");
  d.p(101, 16, "#a87830"); d.p(103, 16, "#c86840"); d.hl(98, 19, 10, "#6a4820");

  // Café tables
  hdCafeTable(d, 112, 38); hdCafeTable(d, 132, 38); hdCafeTable(d, 112, 58); hdCafeTable(d, 132, 58);

  // Bottle shelf
  d.r(120, 3, 18, 1, "#5a3818"); d.r(120, 2, 18, 1, "#6a4820");
  ["#8b2020","#4898a0","#d8b040","#4868a8","#8858a0","#388820","#c87830","#8b2020"].forEach((c, i) => { d.r(121 + i * 2, 1, 1, 2, c); d.p(121 + i * 2, 0, darken(c, 20)); });

  // Menu board
  d.r(138, 2, 12, 6, "#2a2018"); d.r(139, 3, 10, 4, "#1a1410");
  d.hl(140, 3, 4, "#f0e8d0"); d.hl(140, 4, 6, "#d8d0b8"); d.hl(140, 5, 5, "#d8d0b8");

  // Plants
  hdPlant(d, 149, 14, 5); hdPlant(d, 149, 76, 4); hdPlant(d, 130, 14, 3);

  // Right wall edge
  d.vl(GW - 2, 0, GH, "#5a3818"); d.vl(GW - 1, 0, GH, "#3a2010");

  // Furniture shadows
  d.ctx.fillStyle = "rgba(0,0,0,0.08)";
  d.ctx.fillRect(26, 31, 24, 1); d.ctx.fillRect(92, 25, 22, 1); d.ctx.fillRect(6, 46, 16, 1); d.ctx.fillRect(6, 66, 16, 1);
}

// ═══════ 2F: ROOMS (Guest corridor) ═══════
function drawFloor2F(ctx) {
  const d = D(ctx);
  d.r(0, 0, GW, GH, "#1a120b");
  // Corridor
  sharedStoneFloor(d, 1, 10, 158, 16);
  sharedCarpet(d, 10, 12, 140, 12);
  // Room areas
  sharedWoodFloor(d, 1, 26, 158, 32);
  sharedWoodFloor(d, 1, 58, 158, 34);
  sharedWalls(d, true);
  d.hl(0, 25, GW, "#7a5a3a"); d.hl(0, 57, GW, "#7a5a3a");
  sharedWindow(d, 4, 2, 10, 6); sharedWindow(d, 146, 2, 10, 6);
  // Guest rooms
  const room = (rx, ry, flip) => {
    d.vl(rx, ry, 30, "#5c4028"); d.vl(rx + 1, ry, 30, "#a89068"); d.vl(rx + 48, ry, 30, "#5c4028");
    const dy = flip ? ry - 1 : ry + 30;
    d.r(rx + 20, dy, 8, 1, "#6b4422");
    // Bed
    d.r(rx + 4, ry + 4, 12, 18, "#e8e0d8"); d.r(rx + 5, ry + 5, 10, 4, "#f0e8e0");
    d.r(rx + 4, ry + 9, 12, 12, "#6888a8"); d.r(rx + 5, ry + 10, 10, 10, "#7898b8");
    d.hl(rx + 4, ry + 22, 12, "#5a3818");
    // Nightstand + lamp
    d.r(rx + 18, ry + 8, 5, 5, "#7a5228"); d.r(rx + 18, ry + 7, 5, 1, "#c8a868"); d.p(rx + 19, ry + 7, "#f0c040");
    // Desk + chair
    d.r(rx + 28, ry + 4, 14, 1, "#c8a868"); d.r(rx + 28, ry + 5, 14, 3, "#7a5228");
    d.r(rx + 32, ry + 9, 5, 2, "#8b6030"); d.r(rx + 32, ry + 11, 5, 2, "#a07040");
    // Window
    if (!flip) sharedWindow(d, rx + 15, ry + 26, 10, 4);
    else sharedWindow(d, rx + 15, ry, 10, 4);
    // Rug
    d.r(rx + 18, ry + 16, 12, 8, "#a03020"); d.r(rx + 19, ry + 17, 10, 6, "#b83828");
    // Door gold plate
    d.r(rx + 22, dy, 4, 1, "#d8b040");
  };
  room(2, 27, false); room(54, 27, false); room(106, 27, false);
  room(2, 58, true); room(54, 58, true); room(106, 58, true);
  // Corridor deco
  d.r(26, 3, 5, 4, "#d8b040"); d.r(27, 4, 3, 2, "#88c8e8");
  d.r(76, 3, 5, 4, "#5a3818"); d.r(77, 4, 3, 2, "#c84040");
  d.r(126, 3, 5, 4, "#d8b040"); d.r(127, 4, 3, 2, "#48a830");
  sharedPlant(d, 60, 12, 3); sharedPlant(d, 96, 12, 3);
  for (let x = 15; x < 145; x += 6) d.p(x, 18, "#d8a040");
}

// ═══════ 3F: THE TABLE (Restaurant) ═══════
function drawFloor3F(ctx) {
  const d = D(ctx);
  d.r(0, 0, GW, GH, "#1a120b");
  sharedTileFloor(d, 1, 10, 110, 82, "#dcc8a0", "#c8b490");
  sharedTileFloor(d, 114, 10, 45, 82, "#e0e0e0", "#d0d0d0");
  sharedWalls(d, true);
  // Kitchen divider
  d.vl(112, 10, 82, "#5c4028"); d.vl(113, 10, 82, "#a89068"); d.vl(114, 10, 82, "#5c4028");
  d.r(112, 30, 3, 16, "#c8a868"); d.r(112, 30, 3, 1, "#d8b040"); d.r(112, 45, 3, 1, "#d8b040");
  sharedWindow(d, 8, 2, 14, 6); sharedWindow(d, 30, 2, 14, 6); sharedWindow(d, 52, 2, 14, 6); sharedWindow(d, 78, 2, 14, 6);
  // Dining tables
  const dt = (tx, ty, round) => {
    if (round) {
      d.r(tx + 1, ty, 6, 8, "#8b6030"); d.r(tx + 2, ty + 1, 4, 6, "#c8a868");
      d.p(tx + 3, ty + 2, "#f0e8d8"); d.p(tx + 4, ty + 3, "#e8e0d8");
      d.r(tx - 1, ty + 2, 2, 4, "#8b6030"); d.r(tx + 7, ty + 2, 2, 4, "#8b6030");
    } else {
      d.r(tx, ty, 14, 7, "#8b6030"); d.r(tx + 1, ty + 1, 12, 5, "#c8a868"); d.hl(tx, ty + 7, 14, "#7a5228");
      d.p(tx + 3, ty + 2, "#f0e8d8"); d.p(tx + 7, ty + 2, "#f0e8d8"); d.p(tx + 10, ty + 2, "#f0e8d8");
      d.r(tx + 2, ty - 3, 4, 2, "#8b6030"); d.r(tx + 8, ty - 3, 4, 2, "#8b6030");
      d.r(tx + 2, ty + 8, 4, 2, "#8b6030"); d.r(tx + 8, ty + 8, 4, 2, "#8b6030");
    }
  };
  dt(10, 30, false); dt(10, 55, false); dt(36, 30, false); dt(36, 55, false);
  dt(65, 36, true); dt(65, 56, true); dt(82, 36, true); dt(82, 56, true);
  // Bar
  d.r(2, 12, 4, 38, "#8b6838"); d.r(2, 12, 4, 1, "#dcc8a0"); d.vl(5, 12, 38, "#6b4828");
  d.r(2, 52, 4, 1, "#5a3818");
  ["#8b2020", "#4868a8", "#d8b040", "#8b2020", "#388820"].forEach((c, i) => d.r(2, 53 + i * 3, 1, 2, c));
  // Chandelier
  d.r(50, 7, 12, 2, "#d8b040"); d.p(52, 8, "#fff8e0"); d.p(56, 8, "#fff8e0"); d.p(60, 8, "#fff8e0");
  // Kitchen
  d.r(118, 14, 16, 8, "#888888"); d.r(119, 15, 14, 6, "#686868");
  d.p(121, 16, "#f88020"); d.p(125, 16, "#f88020"); d.p(129, 16, "#f88020");
  d.r(118, 26, 20, 4, "#dcc8a0"); d.r(118, 30, 20, 3, "#8b6838");
  d.r(140, 14, 14, 20, "#c0c0c0"); d.r(141, 15, 12, 18, "#d0d0d0");
  d.r(118, 40, 28, 1, "#dcc8a0"); d.r(118, 41, 28, 3, "#8b6838"); d.r(128, 40, 8, 1, "#888888");
  d.r(118, 50, 20, 4, "#888888"); d.r(119, 51, 18, 2, "#686868");
  sharedPlant(d, 100, 14, 5); sharedPlant(d, 100, 74, 4); sharedPlant(d, 8, 74, 4);
  d.r(30, 80, 50, 6, "#a03020"); d.r(31, 81, 48, 4, "#b83828");
}

// ═══════ 4F: STAGE Tamaverse (Performance hall) ═══════
function drawFloor4F(ctx) {
  const d = D(ctx);
  d.r(0, 0, GW, GH, "#1a120b");
  // Stage (elevated polished wood)
  d.r(20, 10, 120, 30, "#3a2818"); sharedWoodFloor(d, 21, 11, 118, 28);
  d.hl(20, 40, 120, "#5a3818"); d.hl(20, 41, 120, "#4a2810");
  // Audience floor
  d.r(1, 42, 158, 50, "#282028");
  for (let y = 42; y < 92; y++) for (let x = 1; x < 159; x++) if ((x + y) % 4 === 0) d.p(x, y, "#302830");
  sharedWalls(d, true);
  // Curtains
  for (let y = 2; y < 40; y++) {
    d.r(20, y, 6, 1, y % 3 === 0 ? "#a82830" : "#8b2028");
    d.r(134, y, 6, 1, y % 3 === 0 ? "#a82830" : "#8b2028");
  }
  d.r(18, 1, 124, 2, "#d8b040");
  // Spotlights
  d.ctx.fillStyle = "rgba(255,248,220,0.04)"; d.ctx.fillRect(55, 15, 20, 24); d.ctx.fillRect(85, 15, 20, 24);
  // Mic stand
  d.r(78, 14, 4, 6, "#686868"); d.r(77, 13, 6, 1, "#888888"); d.p(79, 12, "#c0c0c0");
  // Piano
  d.r(36, 18, 16, 12, "#1a1a1a"); d.r(37, 19, 14, 3, "#f0e8d8"); d.r(37, 22, 14, 7, "#282828");
  // Speakers
  d.r(24, 20, 6, 10, "#383838"); d.r(25, 21, 4, 8, "#282828"); d.p(27, 24, "#484848");
  d.r(130, 20, 6, 10, "#383838"); d.r(131, 21, 4, 8, "#282828"); d.p(133, 24, "#484848");
  // Drums
  d.r(108, 18, 14, 12, "#c86040"); d.r(112, 16, 6, 4, "#d8b040"); d.r(110, 20, 10, 8, "#a85028");
  // Seats (5 rows × 12 cols)
  for (let row = 0; row < 5; row++) for (let col = 0; col < 12; col++) {
    const sx = 16 + col * 11, sy = 48 + row * 8;
    d.r(sx, sy, 6, 4, "#6b4422"); d.r(sx + 1, sy, 4, 3, "#8b5830");
  }
  // Aisle
  d.r(72, 42, 16, 50, "#5c2020"); d.vl(72, 42, 50, "#d8a040"); d.vl(87, 42, 50, "#d8a040");
  // Wall sconces
  d.r(4, 30, 3, 4, "#d8b040"); d.p(5, 31, "#fff8e0"); d.r(153, 30, 3, 4, "#d8b040"); d.p(154, 31, "#fff8e0");
  // Backstage doors
  d.r(2, 14, 6, 10, "#6b4422"); d.r(3, 15, 4, 8, "#5a3818"); d.p(6, 19, "#d8b868");
  d.r(152, 14, 6, 10, "#6b4422"); d.r(153, 15, 4, 8, "#5a3818"); d.p(152, 19, "#d8b868");
}

// ═══════ 5F: SKYLINE (Rooftop terrace) ═══════
function drawFloor5F(ctx) {
  const d = D(ctx);
  // Sky gradient
  for (let y = 0; y < GH; y++) {
    const t = y / GH;
    d.r(0, y, GW, 1, `rgb(${Math.floor(20 + t * 15)},${Math.floor(20 + t * 25)},${Math.floor(40 + t * 30)})`);
  }
  // Stars
  [[10,5],[30,8],[55,3],[90,6],[120,4],[145,7],[70,2],[105,9]].forEach(([x,y]) => d.p(x, y, "#f0e8d0"));
  // City silhouette
  [[5,20,12,18],[20,16,8,22],[30,22,10,16],[45,14,14,24],[62,18,8,20],[75,12,10,26],
   [90,20,12,18],[108,16,6,22],[118,18,14,20],[136,14,10,24],[150,20,8,18]].forEach(([bx,by,bw,bh]) => {
    d.r(bx, by, bw, bh, "#181828");
    for (let wy = by + 2; wy < by + bh - 2; wy += 4) for (let wx = bx + 2; wx < bx + bw - 2; wx += 3)
      d.p(wx, wy, Math.random() > 0.4 ? "#f0c840" : "#282838");
  });
  // Terrace floor
  sharedTileFloor(d, 1, 38, 158, 54, "#c8b490", "#b8a480");
  // Railing
  d.hl(0, 37, GW, "#888888"); d.hl(0, 34, GW, "#a0a0a0");
  for (let x = 4; x < GW - 4; x += 6) d.vl(x, 34, 4, "#888888");
  d.vl(0, 38, 54, "#4a3018"); d.vl(GW - 1, 38, 54, "#4a3018");
  d.hl(0, GH - 4, GW, "#7a5a3a"); d.r(0, GH - 3, GW, 3, "#a89068"); d.hl(0, GH - 1, GW, "#4a3018");
  // Bar
  d.r(10, 44, 30, 1, "#dcc8a0"); d.r(10, 45, 30, 4, "#8b6838"); d.hl(10, 49, 30, "#6b4828");
  for (let i = 0; i < 5; i++) { d.r(13 + i * 5, 50, 3, 2, "#8b6030"); d.p(14 + i * 5, 52, "#7a5228"); }
  d.r(10, 40, 30, 3, "#5a3818");
  ["#8b2020", "#4898a0", "#d8b040", "#8858a0", "#388820", "#c84040", "#4868a8"].forEach((c, i) => d.r(12 + i * 4, 40, 1, 3, c));
  // Lounge
  sharedSofa(d, 60, 52); d.r(64, 62, 10, 5, "#b08050"); d.r(65, 63, 8, 3, "#c8a868");
  d.r(60, 70, 16, 2, "#7a3a20"); d.r(60, 68, 16, 5, "#c86040"); d.r(61, 68, 14, 4, "#d87858");
  // Outdoor tables
  sharedTable(d, 100, 50, true); sharedTable(d, 126, 50, true); sharedTable(d, 100, 70, true);
  sharedPlant(d, 48, 40, 5); sharedPlant(d, 90, 40, 5); sharedPlant(d, 144, 40, 4);
  // String lights
  for (let x = 8; x < GW - 8; x += 8) { d.p(x, 38, "#f0c840"); d.p(x + 1, 38, "#f0c840"); }
  // Entrance
  d.r(74, GH - 4, 12, 4, "#6b4422"); d.r(75, GH - 3, 10, 2, "#5a3818");
}

// ═══════ B1F: BASEMENT (Vending + lounge) ═══════
function drawFloorB1(ctx) {
  const d = D(ctx);
  d.r(0, 0, GW, GH, "#1a120b");
  // Concrete floor
  for (let y = 10; y < GH - 4; y++) for (let x = 1; x < GW - 1; x++) {
    const v = 68 + ((x * 7 + y * 13) % 12);
    d.p(x, y, `rgb(${v},${v - 2},${v - 5})`);
  }
  // Industrial walls
  d.r(0, 0, GW, 2, "#383838"); d.r(0, 2, GW, 3, "#585858"); d.hl(0, 5, GW, "#484848");
  d.r(0, 6, GW, 3, "#505050"); d.hl(0, 9, GW, "#383838");
  d.vl(0, 0, GH, "#383838"); d.vl(GW - 1, 0, GH, "#383838");
  d.hl(0, GH - 4, GW, "#484848"); d.r(0, GH - 3, GW, 3, "#505050"); d.hl(0, GH - 1, GW, "#383838");
  // Ceiling pipes
  d.r(0, 8, GW, 1, "#787878"); d.r(0, 9, GW, 1, "#686868");
  for (let x = 20; x < GW; x += 40) d.vl(x, 3, 6, "#787878");
  // Fluorescent lights
  for (let x = 20; x < GW - 20; x += 35) {
    d.r(x, 6, 16, 1, "#d0d0d0"); d.r(x, 7, 16, 1, "#f0f0e0");
    d.ctx.fillStyle = "rgba(240,240,220,0.03)"; d.ctx.fillRect(x - 2, 8, 20, 10);
  }
  // Vending machines
  const vm = (vx, vy, bc, ac) => {
    d.r(vx, vy, 14, 24, bc); d.r(vx + 1, vy + 1, 12, 12, "#282828"); d.r(vx + 2, vy + 2, 10, 10, "#181818");
    for (let row = 0; row < 3; row++) for (let col = 0; col < 4; col++) {
      d.r(vx + 3 + col * 2, vy + 3 + row * 3, 1, 2, ["#c84040", "#4898a0", "#d8b040", "#48a830", "#8858a0"][(row * 4 + col) % 5]);
    }
    d.r(vx + 1, vy + 14, 12, 3, ac); d.r(vx + 4, vy + 18, 6, 3, "#282828");
    d.r(vx + 5, vy + 19, 4, 1, "#484848"); d.p(vx + 11, vy + 15, "#48a830"); d.hl(vx, vy + 24, 14, "#181818");
  };
  vm(10, 16, "#4868a8", "#6888c8"); vm(28, 16, "#c84040", "#e86050"); vm(46, 16, "#388820", "#58a838");
  vm(64, 16, "#8858a0", "#a878c0"); vm(82, 16, "#c87828", "#e89838");
  // Lounge
  d.r(110, 50, 18, 2, "#5a4028"); d.r(110, 52, 18, 5, "#8b6838"); d.r(111, 52, 16, 4, "#a07848");
  d.r(110, 52, 2, 5, "#5a4028"); d.r(126, 52, 2, 5, "#5a4028");
  d.r(114, 60, 10, 5, "#7a5228"); d.r(115, 61, 8, 3, "#8b6838");
  d.r(110, 68, 18, 2, "#5a4028"); d.r(110, 66, 18, 5, "#8b6838"); d.r(111, 66, 16, 4, "#a07848");
  // Storage shelves
  for (let i = 0; i < 3; i++) {
    const sx = 104 + i * 18;
    d.r(sx, 16, 5, 22, "#5a3818");
    for (let row = 0; row < 4; row++) { d.hl(sx, 18 + row * 5 + 4, 5, "#4a2810"); d.r(sx + 1, 18 + row * 5, 3, 3, ["#a89068", "#787878", "#c8a868", "#686868"][row]); }
  }
  // Arcade cabinet
  d.r(138, 20, 10, 16, "#282828"); d.r(139, 21, 8, 8, "#181848");
  d.p(142, 24, "#48a830"); d.p(144, 24, "#c84040"); d.p(143, 26, "#f0c040");
  d.r(140, 30, 6, 4, "#383838"); d.p(142, 31, "#c84040"); d.p(144, 31, "#4868a8");
  sharedPlant(d, 100, 48, 3);
  d.r(74, GH - 4, 12, 4, "#686868"); d.r(75, GH - 3, 10, 2, "#585858"); d.r(76, GH - 6, 8, 2, "#787878");
}

// Draw dispatcher
const FLOOR_DRAW = { "1F": drawFloor1F, "2F": drawFloor2F, "3F": drawFloor3F, "4F": drawFloor4F, "5F": drawFloor5F, "B1F": drawFloorB1 };

// ── Generic Floor Plan Modal ──
function FloorPlanModal({ state, dispatch }) {
  const canvasRef = useRef(null);
  const bgRef = useRef(null);
  const animRef = useRef({});
  const prevIdsRef = useRef(new Set());
  const rafRef = useRef(null);
  const frameRef = useRef(0);
  const [labelPos, setLabelPos] = useState({});

  const floorId = state.ui.modalData?.floor || "1F";
  const meta = FLOOR_META[floorId];
  const drawFn = FLOOR_DRAW[floorId];
  const allNpcs = getAllNpcs(state);
  const npcMap = {};
  (meta?.locs || []).forEach((id) => { npcMap[id] = []; });
  allNpcs.forEach((npc) => {
    const loc = state.npcStates[npc.id]?.currentLocation;
    if (loc && npcMap[loc] !== undefined) npcMap[loc].push(npc);
  });
  const npcList = [];
  (meta?.locs || []).forEach((locId) => {
    const positions = NPC_POSITIONS[locId] || [];
    (npcMap[locId] || []).forEach((npc, i) => {
      if (i >= positions.length) return;
      npcList.push({ npc, pos: positions[i], idx: i });
    });
  });

  const cW = Math.min(Math.floor(window.innerWidth * 0.6), 960);
  const cH = Math.floor(cW * (GH / GW));
  const s = cW / GW;
  const npcListKey = npcList.map(n => n.npc.id + ":" + n.pos.x + "," + n.pos.y).join("|");

  // Cache background
  useEffect(() => {
    if (!drawFn) return;
    const bg = document.createElement("canvas");
    bg.width = GW * PX; bg.height = GH * PX;
    const ctx = bg.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    ctx.save(); ctx.scale(PX, PX); drawFn(ctx); ctx.restore();
    bgRef.current = bg;
    // Reset anim state on floor change
    animRef.current = {};
    prevIdsRef.current = new Set();
  }, [floorId]);

  // Sync targets
  useEffect(() => {
    const currentIds = new Set(npcList.map(n => n.npc.id));
    const prevIds = prevIdsRef.current;
    const elev = ELEVATOR_POS[floorId] || { x: 78, y: 86 };
    npcList.forEach(({ npc, pos }) => {
      const a = animRef.current[npc.id];
      if (!a) {
        const isNew = !prevIds.has(npc.id);
        const route = pickRoute(floorId, npc.id);
        animRef.current[npc.id] = {
          x: isNew ? route.x : pos.x, y: isNew ? route.y : pos.y,
          targetX: pos.x, targetY: pos.y,
          walkFrame: 0, walkCtr: 0, facing: 0,
          phase: isNew ? "walking" : "idle", idleT: Math.random() * 200, opacity: 1,
        };
      } else {
        if (Math.abs(a.targetX - pos.x) > 0.5 || Math.abs(a.targetY - pos.y) > 0.5) {
          a.targetX = pos.x; a.targetY = pos.y; a.phase = "walking";
        }
      }
    });
    prevIds.forEach(id => {
      if (!currentIds.has(id) && animRef.current[id]) {
        const route = pickRoute(floorId, id);
        animRef.current[id].targetX = route.x; animRef.current[id].targetY = route.y;
        animRef.current[id].phase = "departing";
      }
    });
    prevIdsRef.current = currentIds;
  }, [npcListKey, floorId]);

  // Animation loop
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    cv.width = GW * PX; cv.height = GH * PX;
    const animate = () => {
      frameRef.current++;
      const bg = bgRef.current;
      const ctx = cv.getContext("2d");
      ctx.imageSmoothingEnabled = false;
      if (bg) ctx.drawImage(bg, 0, 0);
      else { rafRef.current = requestAnimationFrame(animate); return; }
      ctx.save(); ctx.scale(PX, PX);
      const d = D(ctx);
      const toRemove = [];
      const newLP = {};
      const entries = Object.entries(animRef.current).sort((a, b) => a[1].y - b[1].y);
      entries.forEach(([npcId, a]) => {
        const dx = a.targetX - a.x, dy = a.targetY - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (a.phase === "walking" || a.phase === "departing") {
          if (dist > 0.8) {
            const ratio = Math.min(NPC_WALK_SPEED / dist, 1);
            a.x += dx * ratio; a.y += dy * ratio;
            if (Math.abs(dx) > Math.abs(dy)) a.facing = dx > 0 ? 3 : 2;
            else a.facing = dy > 0 ? 0 : 1;
            a.walkCtr++;
            if (a.walkCtr >= NPC_WALK_FRAME_RATE) { a.walkCtr = 0; a.walkFrame = (a.walkFrame + 1) % 4; }
          } else {
            a.x = a.targetX; a.y = a.targetY;
            if (a.phase === "departing") toRemove.push(npcId);
            else { a.phase = "idle"; a.walkFrame = 0; }
          }
        } else {
          a.idleT += NPC_IDLE_BOB_SPEED;
          if (frameRef.current % 90 === (hashStr(npcId) % 90)) a.facing = Math.floor(Math.random() * 4);
          // Wander
          const wc = (frameRef.current + hashStr(npcId) * 7) % 180;
          if (wc === 0 && Math.random() < 0.6) {
            const ne = npcList.find(n => n.npc.id === npcId);
            if (ne) {
              a.targetX = Math.max(4, Math.min(GW - 6, ne.pos.x + (Math.random() - 0.5) * 12));
              a.targetY = Math.max(20, Math.min(GH - 4, ne.pos.y + (Math.random() - 0.5) * 6));
              a.phase = "walking";
            }
          }
          const ne2 = npcList.find(n => n.npc.id === npcId);
          if (ne2) {
            const hd = Math.sqrt((a.x - ne2.pos.x) ** 2 + (a.y - ne2.pos.y) ** 2);
            if (hd > 14 && (frameRef.current + hashStr(npcId)) % 120 === 0) {
              a.targetX = ne2.pos.x + (Math.random() - 0.5) * 4;
              a.targetY = ne2.pos.y + (Math.random() - 0.5) * 2;
              a.phase = "walking";
            }
          }
        }
        const bobY = a.phase === "idle" ? Math.sin(a.idleT) * NPC_IDLE_BOB_AMP : 0;
        const npcEntry = npcList.find(n => n.npc.id === npcId);
        if (npcEntry || a.phase === "departing") {
          const npc = npcEntry?.npc || { id: npcId, name: "?" };
          drawNpcSprite(d, Math.round(a.x), Math.round(a.y + bobY), getNpcPalette(npc), a.facing, a.walkFrame);
          newLP[npcId] = { x: a.x, y: a.y + bobY };
        }
      });
      toRemove.forEach(id => delete animRef.current[id]);
      ctx.restore();
      if (frameRef.current % 3 === 0) {
        setLabelPos(prev => {
          let changed = false;
          for (const id in newLP) { if (!prev[id] || Math.abs(prev[id].x - newLP[id].x) > 0.3 || Math.abs(prev[id].y - newLP[id].y) > 0.3) { changed = true; break; } }
          if (Object.keys(prev).length !== Object.keys(newLP).length) changed = true;
          return changed ? newLP : prev;
        });
      }
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [floorId, npcListKey]);

  const totalNpcs = npcList.length;

  return (
    <ModalOverlay onClose={() => dispatch({ type: ACTION.CLOSE_MODAL })}>
      <div className="rounded-2xl overflow-hidden" style={{
        background: COLORS.bgElevated, border: `1px solid ${COLORS.border}`,
        boxShadow: "0 16px 64px rgba(0,0,0,0.5)",
        maxWidth: "92vw", maxHeight: "90vh",
      }}>
        <div className="flex items-center justify-between px-5 py-3" style={{
          background: COLORS.card, borderBottom: `1px solid ${COLORS.border}`,
        }}>
          <div className="flex items-center gap-3">
            <span style={{ fontSize: 22 }}>🏨</span>
            <span style={{ color: COLORS.text, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 18, letterSpacing: 2 }}>
              {meta?.title || floorId}
            </span>
            <span style={{ color: COLORS.subtext, fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>{GW*PX}×{GH*PX}</span>
          </div>
          <button onClick={() => dispatch({ type: ACTION.CLOSE_MODAL })}
            className="w-8 h-8 rounded flex items-center justify-center text-sm font-bold transition-all hover:scale-110"
            style={{ background: COLORS.surface, color: COLORS.subtext, border: `1px solid ${COLORS.border}` }}>✕</button>
        </div>

        <div className="relative" style={{ padding: 12 }}>
          <div className="relative" style={{
            width: cW, height: cH, borderRadius: 6, overflow: "hidden",
            boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06), 0 2px 8px rgba(0,0,0,0.3)",
          }}>
            <canvas ref={canvasRef} style={{ width: cW, height: cH, display: "block", imageRendering: "pixelated" }} />
            {/* NPC animated labels */}
            {npcList.map(({ npc, pos }) => {
              const lbl = Math.max(9, Math.round(s * 2.2));
              const aPos = labelPos[npc.id] || pos;
              return (
                <div key={npc.id} title={`${npc.name}: ${state.npcStates[npc.id]?.currentActivity || "\u2014"}`}
                  style={{
                    position: "absolute", left: (aPos.x + 1) * s, top: (aPos.y - 2) * s,
                    transform: "translateX(-50%)",
                    zIndex: 10 + Math.floor(aPos.y), pointerEvents: "auto", cursor: "pointer",
                  }}>
                  {(() => {
                    const bub = state.npcBubbles?.[npc.id];
                    if (!bub) return null;
                    const age = Date.now() - bub.time;
                    if (age > 3000) return null;
                    const opacity = Math.max(0, 1 - age / 3000);
                    return <span style={{ display: "block", textAlign: "center", fontSize: lbl + 6, opacity, filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.8))", marginBottom: -2 }}>{bub.icon}</span>;
                  })()}
                  <span style={{ fontSize: lbl, fontWeight: 800, color: "#fff", whiteSpace: "nowrap", letterSpacing: 0.5, textShadow: "0 1px 3px rgba(0,0,0,0.95), 0 0 8px rgba(0,0,0,0.6)", fontFamily: "'JetBrains Mono', monospace", background: "rgba(10,10,20,0.6)", padding: "1px 5px", borderRadius: 3 }}>{npc.name}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-center gap-8 px-6 py-3" style={{
          background: COLORS.card, borderTop: `1px solid ${COLORS.border}`,
        }}>
          {(meta?.locs || []).map((locId) => {
            const loc = state.locations.find((l) => l.id === locId);
            return <span key={locId} style={{ color: COLORS.subtext, fontSize: 14, fontFamily: "'JetBrains Mono', monospace" }}>
              {loc?.emoji} {loc?.name}: {(npcMap[locId] || []).length} NPCs
            </span>;
          })}
          <span style={{ color: COLORS.muted, fontSize: 13, fontFamily: "'JetBrains Mono', monospace" }}>
            {totalNpcs} total · Hover NPC for activity
          </span>
        </div>
      </div>
    </ModalOverlay>
  );
}

// ── Inline Floor Map Pane (single floor canvas) ──
const ALL_FLOORS = ["5F", "4F", "3F", "2F", "1F", "B1F"];
const FLOOR_EMOJI = { "5F": "🌆", "4F": "🎭", "3F": "🍽️", "2F": "🛏️", "1F": "🛋️", "B1F": "🏪" };

function FloorMapPane({ floorId, state, width, height, mini, onClickFloor, onNpcClick }) {
  const canvasRef = useRef(null);
  const bgRef = useRef(null);        // cached floor background canvas
  const animRef = useRef({});          // { [npcId]: { x, y, targetX, targetY, walkFrame, walkCtr, facing, phase, idleT, opacity } }
  const prevIdsRef = useRef(new Set());
  const rafRef = useRef(null);
  const frameRef = useRef(0);
  const [labelPos, setLabelPos] = useState({}); // { [npcId]: { x, y } } — updated periodically for HTML overlay

  const drawFn = FLOOR_DRAW[floorId];
  const meta = FLOOR_META[floorId];
  const allNpcs = getAllNpcs(state);

  // Build npcList: which NPCs should be on this floor and their target positions
  const npcMap = {};
  (meta?.locs || []).forEach((id) => { npcMap[id] = []; });
  allNpcs.forEach((npc) => {
    const loc = state.npcStates[npc.id]?.currentLocation;
    if (loc && npcMap[loc] !== undefined) npcMap[loc].push(npc);
  });
  const npcList = [];
  (meta?.locs || []).forEach((locId) => {
    const positions = NPC_POSITIONS[locId] || [];
    (npcMap[locId] || []).forEach((npc, i) => {
      if (i >= positions.length) return;
      npcList.push({ npc, pos: positions[i], idx: i });
    });
  });

  const s = width / GW;
  const npcListKey = npcList.map(n => n.npc.id + ":" + n.pos.x + "," + n.pos.y).join("|");

  // ── 1. Cache floor background ──
  useEffect(() => {
    if (!drawFn) return;
    const bg = document.createElement("canvas");
    bg.width = GW * PX; bg.height = GH * PX;
    const ctx = bg.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    ctx.save(); ctx.scale(PX, PX);
    drawFn(ctx);
    ctx.restore();
    bgRef.current = bg;
  }, [floorId]);

  // ── 2. Sync NPC targets when npcList changes ──
  useEffect(() => {
    const currentIds = new Set(npcList.map(n => n.npc.id));
    const prevIds = prevIdsRef.current;

    npcList.forEach(({ npc, pos }) => {
      const a = animRef.current[npc.id];
      if (!a) {
        // New NPC arriving on this floor
        const isArrival = !prevIds.has(npc.id);
        const route = pickRoute(floorId, npc.id);
        const sx = isArrival ? route.x : pos.x;
        const sy = isArrival ? route.y : pos.y;
        animRef.current[npc.id] = {
          x: sx, y: sy, targetX: pos.x, targetY: pos.y,
          walkFrame: 0, walkCtr: 0, facing: 0,
          phase: isArrival ? "walking" : "idle",
          idleT: Math.random() * 200, opacity: 1,
        };
      } else {
        // Existing NPC — update target
        if (Math.abs(a.targetX - pos.x) > 0.5 || Math.abs(a.targetY - pos.y) > 0.5) {
          a.targetX = pos.x; a.targetY = pos.y;
          a.phase = "walking";
        }
      }
    });

    // NPCs that left this floor — animate toward a random route then remove
    prevIds.forEach(id => {
      if (!currentIds.has(id) && animRef.current[id]) {
        const route = pickRoute(floorId, id);
        animRef.current[id].targetX = route.x;
        animRef.current[id].targetY = route.y;
        animRef.current[id].phase = "departing";
      }
    });

    prevIdsRef.current = currentIds;
  }, [npcListKey, floorId]);

  // ── 3. Animation loop (full view only) ──
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    cv.width = GW * PX; cv.height = GH * PX;

    // For mini mode: just draw once statically
    if (mini) {
      const renderStatic = () => {
        const bg = bgRef.current;
        if (!bg) { requestAnimationFrame(renderStatic); return; }
        const ctx = cv.getContext("2d");
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(bg, 0, 0);
        ctx.save(); ctx.scale(PX, PX);
        const d = D(ctx);
        npcList.forEach(({ npc, pos, idx }) => {
          drawNpcSprite(d, pos.x, pos.y, getNpcPalette(npc), (idx + hashStr(npc.id)) % 4, 0);
        });
        ctx.restore();
      };
      renderStatic();
      // Redraw mini periodically for location changes
      const iv = setInterval(renderStatic, 2000);
      return () => clearInterval(iv);
    }

    // Full-view animation loop
    const animate = () => {
      frameRef.current++;
      const bg = bgRef.current;
      const ctx = cv.getContext("2d");
      ctx.imageSmoothingEnabled = false;

      // Draw cached background
      if (bg) ctx.drawImage(bg, 0, 0);
      else { rafRef.current = requestAnimationFrame(animate); return; }

      ctx.save(); ctx.scale(PX, PX);
      const d = D(ctx);
      const toRemove = [];
      const newLabelPos = {};

      // Sort by y for correct overlap order
      const entries = Object.entries(animRef.current).sort((a, b) => a[1].y - b[1].y);

      entries.forEach(([npcId, a]) => {
        const dx = a.targetX - a.x;
        const dy = a.targetY - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (a.phase === "walking" || a.phase === "departing") {
          if (dist > 0.8) {
            // Move toward target
            const spd = NPC_WALK_SPEED;
            const ratio = Math.min(spd / dist, 1);
            a.x += dx * ratio;
            a.y += dy * ratio;
            // Facing
            if (Math.abs(dx) > Math.abs(dy)) a.facing = dx > 0 ? 3 : 2;
            else a.facing = dy > 0 ? 0 : 1;
            // Walk frame cycle
            a.walkCtr++;
            if (a.walkCtr >= NPC_WALK_FRAME_RATE) { a.walkCtr = 0; a.walkFrame = (a.walkFrame + 1) % 4; }
          } else {
            // Arrived
            a.x = a.targetX; a.y = a.targetY;
            if (a.phase === "departing") { toRemove.push(npcId); }
            else { a.phase = "idle"; a.walkFrame = 0; }
          }
        } else {
          // Idle
          a.idleT += NPC_IDLE_BOB_SPEED;
          a.walkFrame = 0;
          // Occasional direction change
          if (frameRef.current % 90 === (hashStr(npcId) % 90)) {
            a.facing = Math.floor(Math.random() * 4);
          }
          // Wander: every ~180 frames (~6s), small random walk near home position
          const wanderCheck = (frameRef.current + hashStr(npcId) * 7) % 180;
          if (wanderCheck === 0 && Math.random() < 0.6) {
            const npcEntry = npcList.find(n => n.npc.id === npcId);
            if (npcEntry) {
              const homeX = npcEntry.pos.x, homeY = npcEntry.pos.y;
              const wx = homeX + (Math.random() - 0.5) * 12;
              const wy = homeY + (Math.random() - 0.5) * 6;
              // Clamp within floor bounds
              a.targetX = Math.max(4, Math.min(GW - 6, wx));
              a.targetY = Math.max(20, Math.min(GH - 4, wy));
              a.phase = "walking";
            }
          }
          // Return home after wandering: if far from home, drift back
          const npcEntry2 = npcList.find(n => n.npc.id === npcId);
          if (npcEntry2) {
            const hx = npcEntry2.pos.x, hy = npcEntry2.pos.y;
            const homeD = Math.sqrt((a.x - hx) ** 2 + (a.y - hy) ** 2);
            if (homeD > 14 && (frameRef.current + hashStr(npcId)) % 120 === 0) {
              a.targetX = hx + (Math.random() - 0.5) * 4;
              a.targetY = hy + (Math.random() - 0.5) * 2;
              a.phase = "walking";
            }
          }
        }

        // Draw
        const bobY = a.phase === "idle" ? Math.sin(a.idleT) * NPC_IDLE_BOB_AMP : 0;
        const npcEntry = npcList.find(n => n.npc.id === npcId);
        if (npcEntry || a.phase === "departing") {
          const npc = npcEntry?.npc || { id: npcId, name: "?" };
          drawNpcSprite(d, Math.round(a.x), Math.round(a.y + bobY), getNpcPalette(npc), a.facing, a.walkFrame);
          newLabelPos[npcId] = { x: a.x, y: a.y + bobY };
        }
      });

      toRemove.forEach(id => delete animRef.current[id]);
      ctx.restore();

      // Update label positions every 3 frames to reduce React re-renders
      if (frameRef.current % 3 === 0) {
        setLabelPos(prev => {
          let changed = false;
          for (const id in newLabelPos) {
            if (!prev[id] || Math.abs(prev[id].x - newLabelPos[id].x) > 0.3 || Math.abs(prev[id].y - newLabelPos[id].y) > 0.3) { changed = true; break; }
          }
          if (Object.keys(prev).length !== Object.keys(newLabelPos).length) changed = true;
          return changed ? newLabelPos : prev;
        });
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [floorId, width, mini, npcListKey]);

  const totalNpcs = npcList.length;

  return (
    <div style={{ width, height, position: "relative", background: "#0f0f1a", borderRadius: mini ? 4 : 6, overflow: "hidden", cursor: mini ? "pointer" : "default" }}
      onClick={mini && onClickFloor ? () => onClickFloor(floorId) : undefined}>
      {/* Floor label */}
      <div style={{
        position: "absolute", top: mini ? 3 : 6, left: mini ? 4 : 8, zIndex: 20,
        background: "rgba(10,10,20,0.7)", borderRadius: 4, padding: mini ? "2px 5px" : "3px 10px",
        color: COLORS.text, fontSize: mini ? 10 : 14, fontWeight: 800,
        fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1, pointerEvents: "none",
      }}>
        {FLOOR_EMOJI[floorId]} {floorId}
        {!mini && <span style={{ color: COLORS.subtext, marginLeft: 8, fontSize: 12 }}>{totalNpcs} NPCs</span>}
      </div>
      <canvas ref={canvasRef} style={{ width, height, display: "block", imageRendering: "pixelated" }} />
      {/* NPC clickable area (HTML overlay, covers sprite + name) — uses animated positions */}
      {!mini && npcList.map(({ npc, pos, idx }) => {
        const lbl = Math.max(10, Math.round(s * 1.8));
        const spriteH = 8 * s;
        const spriteW = 8 * s;
        const boxW = Math.max(spriteW + 8, 48);
        const boxH = spriteH + lbl + 8;
        const aPos = labelPos[npc.id] || pos;
        return (
          <div key={npc.id} title={`${npc.name}: ${state.npcStates[npc.id]?.currentActivity || "\u2014"}`}
            onClick={(e) => { e.stopPropagation(); if (onNpcClick) onNpcClick(npc.id); }}
            style={{
              position: "absolute",
              left: (aPos.x + 4) * s - boxW / 2,
              top: (aPos.y - 3) * s,
              width: boxW, height: boxH,
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end",
              zIndex: 10 + Math.floor(aPos.y), pointerEvents: "auto", cursor: "pointer",
              borderRadius: 4, transition: "none",
            }}
            onMouseEnter={e => { e.currentTarget.style.filter = "drop-shadow(0 0 6px rgba(233,69,96,0.6))"; e.currentTarget.querySelector('.npc-label').style.background = "rgba(233,69,96,0.7)"; e.currentTarget.querySelector('.npc-label').style.boxShadow = "0 0 8px rgba(233,69,96,0.5)"; }}
            onMouseLeave={e => { e.currentTarget.style.filter = "none"; e.currentTarget.querySelector('.npc-label').style.background = "rgba(10,10,20,0.7)"; e.currentTarget.querySelector('.npc-label').style.boxShadow = "none"; }}
          >
            {/* Floating bubble icon */}
            {(() => {
              const bub = state.npcBubbles?.[npc.id];
              if (!bub) return null;
              const age = Date.now() - bub.time;
              if (age > 3000) return null;
              const opacity = Math.max(0, 1 - age / 3000);
              const rise = Math.min(12, age / 150);
              return <span style={{ fontSize: Math.max(12, lbl + 4), position: "absolute", top: -rise - 8, left: "50%", transform: "translateX(-50%)", opacity, transition: "opacity 0.3s", pointerEvents: "none", filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.8))", zIndex: 100 }}>{bub.icon}</span>;
            })()}
            <span className="npc-label" style={{
              fontSize: lbl, fontWeight: 800,
              color: "#fff", whiteSpace: "nowrap", letterSpacing: 0.3,
              textShadow: "0 1px 2px rgba(0,0,0,0.95)",
              fontFamily: "'JetBrains Mono', monospace",
              background: "rgba(10,10,20,0.7)", padding: "1px 5px", borderRadius: 3,
              transition: "background 0.15s",
            }}>{npc.name}</span>
          </div>
        );
      })}
      {/* Mini mode: NPC count badges */}
      {mini && (
        <div style={{ position: "absolute", bottom: 3, right: 4, zIndex: 20, display: "flex", gap: 3 }}>
          {(meta?.locs || []).map((locId) => {
            const cnt = (npcMap[locId] || []).length;
            if (cnt === 0) return null;
            return <span key={locId} style={{
              background: "rgba(10,10,20,0.65)", borderRadius: 3, padding: "1px 4px",
              color: "#4ecdc4", fontSize: 10, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace",
            }}>{cnt}</span>;
          })}
        </div>
      )}
    </div>
  );
}


// ══════════════════════════════════════════════════════
// NEW UI COMPONENTS — Full Redesign
// ══════════════════════════════════════════════════════

const VERSION_FEATURES = {
  "1.0": [
    { emoji: "🛋️", label: "로비" },
    { emoji: "☕", label: "카페" },
    { emoji: "🛏️", label: "객실" },
    { emoji: "🍽️", label: "레스토랑" },
    { emoji: "👤", label: "내 NPC" },
    { emoji: "💬", label: "상호작용" },
  ],
  "1.1": [
    { emoji: "🎭", label: "공연장" },
    { emoji: "🎨", label: "공동창작" },
    { emoji: "🎵", label: "음악실" },
  ],
  "1.2": [
    { emoji: "🌆", label: "루프탑" },
    { emoji: "🏪", label: "자판기" },
    { emoji: "🧥", label: "루나 NPC" },
  ],
  "1.3": [
    { emoji: "📤", label: "내보내기" },
    { emoji: "📺", label: "외부 송출" },
    { emoji: "📊", label: "대시보드" },
  ],
};

const FLOOR_AMENITIES = {
  "1F": [
    { id: "sofa", emoji: "🛋️", name: "로비 소파", desc: "편안한 휴식", app: "lounge" },
    { id: "morning_coffee", emoji: "☕", name: "모닝 커피", desc: "커피 내리기", app: "coffee" },
    { id: "book_corner", emoji: "📚", name: "북 코너", desc: "독서 타임", app: "reading" },
    { id: "plant_lobby", emoji: "🌿", name: "로비 화분", desc: "물 주기", app: "plant" },
    { id: "guestbook", emoji: "📝", name: "방명록", desc: "메시지 남기기", app: "guestbook" },
  ],
  "2F": [
    { id: "bed", emoji: "🛏️", name: "침대", desc: "휴식", app: "sleep" },
    { id: "room_service", emoji: "🛎️", name: "룸 서비스", desc: "주문하기", app: "roomservice" },
    { id: "minibar", emoji: "🧊", name: "미니바", desc: "음료 선택", app: "minibar" },
    { id: "closet", emoji: "👔", name: "옷장", desc: "코디", app: "closet" },
  ],
  "3F": [
    { id: "table", emoji: "🍽️", name: "테이블", desc: "식사 공간", app: "dining" },
    { id: "chef_special", emoji: "👨‍🍳", name: "셰프 스페셜", desc: "오늘의 메뉴", app: "chef" },
    { id: "wine", emoji: "🍷", name: "와인 셀러", desc: "테이스팅", app: "wine" },
    { id: "dessert", emoji: "🍰", name: "디저트 바", desc: "디저트 선택", app: "dessert" },
  ],
  "4F": [
    { id: "stage_main", emoji: "🎭", name: "스테이지", desc: "공연 관람", app: "show" },
    { id: "open_mic", emoji: "🎤", name: "오픈마이크", desc: "노래 도전", app: "karaoke" },
    { id: "instruments", emoji: "🎸", name: "악기 코너", desc: "연주 체험", app: "instruments" },
  ],
  "5F": [
    { id: "telescope_sky", emoji: "🔭", name: "망원경", desc: "별자리 관측", app: "stargazing" },
    { id: "sunset_hour", emoji: "🌅", name: "선셋 아워", desc: "칵테일 만들기", app: "cocktail" },
    { id: "fashion_popup", emoji: "👗", name: "패션 팝업", desc: "코디 추천", app: "fashion" },
  ],
  "B1F": [
    { id: "vending_gacha", emoji: "🎰", name: "가챠 자판기", desc: "랜덤 뽑기!", app: "gacha" },
    { id: "arcade", emoji: "🕹️", name: "아케이드", desc: "반응 테스트", app: "arcade" },
    { id: "laundry", emoji: "👕", name: "세탁실", desc: "빨래 미션", app: "laundry" },
    { id: "storage", emoji: "📦", name: "창고", desc: "보관함", app: "storage" },
  ],
};

// Map amenity IDs to location IDs for directive queue
const AMENITY_TO_LOC = {};
Object.entries(FLOOR_AMENITIES).forEach(([floor, amenities]) => {
  const locs = FLOOR_META[floor]?.locs || [];
  amenities.forEach(a => { AMENITY_TO_LOC[a.id] = locs[0] || "lobby"; });
});

const GACHA_ITEMS = [
  { emoji: "⭐", name: "행운의 별", rarity: "common", desc: "오늘 하루가 빛날 거예요" },
  { emoji: "🍀", name: "네잎클로버", rarity: "common", desc: "행운이 찾아옵니다" },
  { emoji: "🎫", name: "골든 티켓", rarity: "rare", desc: "특별한 이벤트 초대권" },
  { emoji: "💎", name: "크리스탈", rarity: "rare", desc: "NPC 친밀도 부스트" },
  { emoji: "🦄", name: "유니콘 인형", rarity: "epic", desc: "전설의 아이템!" },
  { emoji: "🧸", name: "미니 곰인형", rarity: "common", desc: "귀여운 곰인형" },
  { emoji: "🎪", name: "서커스 티켓", rarity: "rare", desc: "스테이지 스페셜 공연" },
  { emoji: "🌈", name: "무지개 조각", rarity: "epic", desc: "모으면 소원이 이루어져요" },
];

const NPC_COLORS = {
  custom: { hair: "#8B4513", body: "#D4956B", legs: "#665544" },
  haru: { hair: "#2C2C54", body: "#A3C9D6", legs: "#555566" },
  kai: { hair: "#FF6B35", body: "#FFE66D", legs: "#445566" },
  sora: { hair: "#6C5CE7", body: "#FFA8B8", legs: "#554455" },
  mio: { hair: "#2D3436", body: "#55A88B", legs: "#443344" },
  ren: { hair: "#E17055", body: "#FDCB6E", legs: "#556644" },
  luna: { hair: "#DFE6E9", body: "#A29BFE", legs: "#445577" },
};

function drawPixelChar(ctx, x, y, size, colorScheme) {
  const s = size / 8;
  const c = colorScheme;
  ctx.fillStyle = "#FFD5B0";
  ctx.fillRect(x + 2*s, y, 4*s, 4*s);
  ctx.fillStyle = c.hair;
  ctx.fillRect(x + 1*s, y, 6*s, s);
  ctx.fillRect(x + 1*s, y + s, s, s);
  ctx.fillRect(x + 6*s, y + s, s, s);
  ctx.fillStyle = "#333";
  ctx.fillRect(x + 3*s, y + 2*s, s, s);
  ctx.fillRect(x + 5*s, y + 2*s, s, s);
  ctx.fillStyle = c.body;
  ctx.fillRect(x + 2*s, y + 4*s, 4*s, 3*s);
  ctx.fillStyle = c.legs || "#555";
  ctx.fillRect(x + 2*s, y + 7*s, 2*s, s);
  ctx.fillRect(x + 4*s, y + 7*s, 2*s, s);
}

// ── MAP VIEWER ──
function MapViewer({ state, dispatch }) {
  const activeFloor = state.ui.mapFloor;
  const splitMode = state.ui.mapSplit;
  const setFloor = (f) => dispatch({ type: ACTION.SET_MAP, payload: { floor: f } });
  const setSplit = (s) => dispatch({ type: ACTION.SET_MAP, payload: { split: s } });
  const containerRef = useRef(null);
  const [dims, setDims] = useState({ w: 600, h: 360 });

  useEffect(() => {
    const measure = () => { if (containerRef.current) { const r = containerRef.current.getBoundingClientRect(); setDims({ w: Math.floor(r.width), h: Math.floor(r.height) }); } };
    measure(); window.addEventListener("resize", measure); return () => window.removeEventListener("resize", measure);
  }, []);

  const amenities = FLOOR_AMENITIES[activeFloor] || [];
  const loc = state.locations.find(l => l.floor === activeFloor);
  const isLocked = loc?.isLocked;

  // Layout constants
  const bottomH = 180;
  const mapW = Math.max(100, dims.w);
  const mapH = Math.max(80, dims.h - bottomH);

  // Caster: find latest feed item relevant to current floor
  const floorLocs = (FLOOR_META[activeFloor]?.locs || []);
  const latestFloorEvent = useMemo(() => {
    const feed = [...state.liveFeed].reverse();
    for (const item of feed) {
      for (const locId of floorLocs) {
        const locName = state.locations.find(l => l.id === locId)?.name || locId;
        if (item.text && (item.text.includes(locName) || item.text.includes(FLOOR_EMOJI[activeFloor]))) return item;
      }
    }
    return feed[0] || null;
  }, [state.liveFeed.length, activeFloor]);

  // Caster dialogue generation - richer conversational style
  const casterDialogue = useMemo(() => {
    if (!latestFloorEvent) return `${FLOOR_META[activeFloor]?.title || activeFloor}에서 생중계 중입니다~ 아직은 조용한 분위기네요.`;
    const t = latestFloorEvent.text || "";
    // Parse NPC name and action from feed text
    const npcMatch = t.match(/^(.+?)\s(?:이|가)\(가\)\s/);
    const name = npcMatch ? npcMatch[1].replace(/[🎮💬⚡💕·]/g, "").trim() : "";
    if (t.includes("이동")) {
      const dest = t.match(/(.+?)\(으\)로 이동/);
      return `자, ${name}님이 방금 ${dest ? dest[1] : "다른 곳"}${dest?.[1]?.endsWith("로") ? "" : "으로"} 발걸음을 옮기고 있습니다! 어떤 일이 벌어질지 기대되네요~`;
    }
    if (t.includes("대화") || t.includes("💬")) return `오! ${name}님이 누군가와 이야기를 나누고 있어요. 무슨 대화일까요? 분위기가 좋아 보이는데요~`;
    if (t.includes("관계") || t.includes("💕")) return `이야~ 감정의 변화가 감지됩니다! ${name}님의 관계에 새로운 바람이 불고 있네요!`;
    if (t.includes("이벤트") || t.includes("⚡")) return `긴급 속보! ${FLOOR_META[activeFloor]?.title || activeFloor}에서 특별한 이벤트가 발생했습니다! 모두 주목해주세요~`;
    return `${FLOOR_META[activeFloor]?.title || activeFloor}에서 전해드립니다— ${name ? name + "님의 움직임이 포착됐는데요, " : ""}지금 이 순간에도 흥미로운 일들이 벌어지고 있습니다!`;
  }, [latestFloorEvent, activeFloor]);

  // Caster auto-cycling dialogue: rotate between live commentary and ambient lines
  const CASTER_AMBIENT = useMemo(() => [
    `${FLOOR_META[activeFloor]?.title || activeFloor}의 분위기가 정말 좋습니다! 투숙객들의 하루가 궁금하시죠?`,
    "오늘도 Tamaverse에서 새로운 이야기가 만들어지고 있습니다~",
    `지금 ${FLOOR_META[activeFloor]?.title || activeFloor}에는 어떤 드라마가 펼쳐지고 있을까요?`,
    "캐스터가 실시간으로 전해드리겠습니다! 놓치지 마세요~",
    `투숙객들 사이에 미묘한 감정선이 흐르고 있는 것 같은데요...`,
    "조용한 것 같지만, 이런 순간에 뜻밖의 만남이 생기기도 하죠!",
    `${FLOOR_META[activeFloor]?.title || activeFloor}의 창밖 풍경이 참 멋지네요. 어떤 대화가 오가고 있을까요~`,
  ], [activeFloor]);
  const [casterIdx, setCasterIdx] = useState(0);
  const [showAmbient, setShowAmbient] = useState(false);
  useEffect(() => {
    const iv = setInterval(() => {
      setShowAmbient(prev => {
        if (!prev) { setCasterIdx(i => (i + 1) % CASTER_AMBIENT.length); return true; }
        return false;
      });
    }, 8000);
    return () => clearInterval(iv);
  }, [CASTER_AMBIENT.length]);
  const displayDialogue = showAmbient ? CASTER_AMBIENT[casterIdx] : casterDialogue;

  // Caster mic animation state
  const [micActive, setMicActive] = useState(true);
  useEffect(() => {
    const t = setInterval(() => setMicActive(p => !p), 2000 + Math.random() * 1500);
    return () => clearInterval(t);
  }, []);

  // Time/weather helper
  const gt = state.simulation.gameTime || 0;
  const gx = ((gt % 1440) + 1440) % 1440;
  const timeEmoji = gx < 300 ? "🌙" : gx < 420 ? "🌅" : gx < 720 ? "☀️" : gx < 1020 ? "🌤️" : gx < 1200 ? "🌇" : "🌙";
  const timeLabel = gx < 300 ? "심야" : gx < 420 ? "새벽" : gx < 720 ? "오전" : gx < 1020 ? "오후" : gx < 1200 ? "저녁" : "밤";
  const weatherEmoji = gx < 360 ? "🌙" : gx < 720 ? "☀️" : gx < 1020 ? "⛅" : "🌤️";
  const weatherLabel = gx < 360 ? "맑은 밤" : gx < 720 ? "맑음" : gx < 1020 ? "구름 조금" : "저녁 노을";

  const renderPanes = () => {
    if (splitMode === 1) {
      const pW = mapW - 8, pH = Math.floor(pW * (GH / GW));
      const fH = Math.min(pH, mapH - 8), fW = Math.min(pW, Math.floor(fH * (GW / GH)));
      return (<div className="flex items-center justify-center w-full h-full"><FloorMapPane floorId={activeFloor} state={state} width={fW} height={fH} onNpcClick={(id) => dispatch({ type: ACTION.SET_RELATION_FOCUS, payload: id })} /></div>);
    }
    const cols = 2, rows = splitMode === 4 ? 2 : 3;
    const gap = 4;
    const maxPW = Math.floor((mapW - 40 - gap * (cols - 1)) / cols);
    const maxPH = Math.floor((mapH - 20 - gap * (rows - 1)) / rows);
    const pH = Math.min(maxPH, Math.floor(maxPW * (GH / GW)));
    const pW = Math.floor(pH * (GW / GH));
    const floors = splitMode === 4 ? ALL_FLOORS.slice(0, 4) : ALL_FLOORS;
    return (
      <div className="w-full h-full flex items-center justify-center relative">
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, ${pW}px)`, gridTemplateRows: `repeat(${rows}, ${pH}px)`, gap, position: "relative", zIndex: 2 }}>
          {floors.map(fl => (<FloorMapPane key={fl} floorId={fl} state={state} width={pW} height={pH} mini={true} onClickFloor={f => { setFloor(f); setSplit(1); }} />))}
        </div>
      </div>
    );
  };

  return (
    <div ref={containerRef} className="flex flex-col flex-1 min-h-0" style={{ background: "#0f0f1a", borderRadius: 12, overflow: "hidden" }}>
      {/* Map area */}
      <div className="flex-1 flex items-center justify-center overflow-hidden relative" style={{ background: "#0f0f1a" }}>
        {/* Time-of-day tint overlay */}
        {(() => {
          let tintColor, tintOpacity;
          if (gx < 300) { tintColor = "20,30,80"; tintOpacity = 0.22; }
          else if (gx < 420) { tintColor = "80,60,20"; tintOpacity = 0.12 * (1 - (gx-300)/120); }
          else if (gx < 720) { tintColor = "255,200,100"; tintOpacity = 0.03; }
          else if (gx < 1020) { tintColor = "0,0,0"; tintOpacity = 0; }
          else if (gx < 1140) { tintColor = "200,100,50"; tintOpacity = 0.1 * ((gx-1020)/120); }
          else if (gx < 1260) { tintColor = "60,30,100"; tintOpacity = 0.14; }
          else { tintColor = "20,25,70"; tintOpacity = 0.2; }
          return tintOpacity > 0 ? <div className="absolute inset-0 z-20 pointer-events-none" style={{ background: `rgba(${tintColor},${tintOpacity})`, transition: "background 3s ease", mixBlendMode: "multiply" }} /> : null;
        })()}
        {/* Decorative grid background */}
        <div className="absolute inset-0" style={{ backgroundImage: "linear-gradient(rgba(78,205,196,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(78,205,196,0.02) 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
        <div className="absolute inset-0" style={{ backgroundImage: "linear-gradient(rgba(78,205,196,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(78,205,196,0.04) 1px, transparent 1px)", backgroundSize: "96px 96px" }} />
        {/* Corner decorations */}
        <div className="absolute top-2 left-2 w-8 h-8" style={{ borderTop: "2px solid rgba(233,69,96,0.15)", borderLeft: "2px solid rgba(233,69,96,0.15)" }} />
        <div className="absolute top-2 right-2 w-8 h-8" style={{ borderTop: "2px solid rgba(233,69,96,0.15)", borderRight: "2px solid rgba(233,69,96,0.15)" }} />
        <div className="absolute bottom-2 left-2 w-8 h-8" style={{ borderBottom: "2px solid rgba(233,69,96,0.15)", borderLeft: "2px solid rgba(233,69,96,0.15)" }} />
        <div className="absolute bottom-2 right-2 w-8 h-8" style={{ borderBottom: "2px solid rgba(233,69,96,0.15)", borderRight: "2px solid rgba(233,69,96,0.15)" }} />
        {/* Time indicator — top-left inside map */}
        {(() => {
          const gt2 = state.simulation.gameTime || 0;
          const x2 = ((gt2 % 1440) + 1440) % 1440;
          let em, lb;
          if (x2 < 300) { em = "🌙"; lb = "심야"; }
          else if (x2 < 420) { em = "🌅"; lb = "새벽"; }
          else if (x2 < 720) { em = "☀️"; lb = "오전"; }
          else if (x2 < 1020) { em = "🌤️"; lb = "오후"; }
          else if (x2 < 1200) { em = "🌇"; lb = "저녁"; }
          else { em = "🌙"; lb = "밤"; }
          return (
            <div className="absolute top-3 left-3 z-30 flex items-center gap-1.5" style={{ background: "rgba(10,10,20,0.7)", borderRadius: 8, padding: "3px 8px", border: `1px solid ${COLORS.border}`, backdropFilter: "blur(6px)" }}>
              <span style={{ color: "#4ecdc4", fontSize: 10, fontWeight: 900, fontFamily: "'JetBrains Mono', monospace" }}>DAY{state.simulation.gameDay}</span>
              <span style={{ color: COLORS.subtext, fontSize: 9, opacity: 0.5 }}>·</span>
              <span style={{ fontSize: 11 }}>{em}</span>
              <span style={{ color: COLORS.subtext, fontSize: 10, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>{formatGameTime(gt2)}</span>
              <span style={{ color: COLORS.subtext, fontSize: 9, opacity: 0.7 }}>{lb}</span>
              <span style={{ color: COLORS.subtext, fontSize: 9, opacity: 0.5 }}>·</span>
              <span style={{ color: COLORS.subtext, fontSize: 9, opacity: 0.7 }}>{weatherLabel}</span>
              <span style={{ fontSize: 11 }}>{weatherEmoji}</span>
            </div>
          );
        })()}
        <div className="relative z-10 flex items-center justify-center w-full h-full">{renderPanes()}</div>
      </div>

      {/* ═══ Bottom Panel: Caster (left) + Controls (right) ═══ */}
      <div className="shrink-0 flex" style={{ height: bottomH, borderTop: `1px solid ${COLORS.border}`, background: COLORS.bgElevated }}>
        {/* ── LEFT: Caster / Floor Info ── */}
        <div className="flex items-stretch gap-3 px-4 py-2" style={{ flex: "1 1 45%", borderRight: `1px solid ${COLORS.border}`, minWidth: 0 }}>
          {/* Animated Caster avatar */}
          <div className="shrink-0 flex flex-col items-center justify-center" style={{ width: 60 }}>
            <div style={{ width: 50, height: 50, borderRadius: "50%", background: "linear-gradient(135deg, rgba(233,69,96,0.18), rgba(78,205,196,0.12))", border: `2px solid ${micActive ? COLORS.accent : COLORS.border}`, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", transition: "border-color 0.5s" }}>
              {/* Face */}
              <div style={{ position: "relative", width: 36, height: 36 }}>
                {/* Hair */}
                <div style={{ position: "absolute", top: 0, left: 2, right: 2, height: 12, background: "#5B3A8C", borderRadius: "12px 12px 0 0" }} />
                {/* Skin */}
                <div style={{ position: "absolute", top: 6, left: 6, right: 6, height: 20, background: "#FFD5B0", borderRadius: "40%" }} />
                {/* Eyes */}
                <div style={{ position: "absolute", top: 14, left: 10, width: 4, height: 4, background: "#333", borderRadius: "50%" }} />
                <div style={{ position: "absolute", top: 14, right: 10, width: 4, height: 4, background: "#333", borderRadius: "50%" }} />
                {/* Mouth - animated */}
                <div className="caster-mouth" style={{ position: "absolute", bottom: 10, left: "50%", transform: "translateX(-50%)", width: micActive ? 6 : 4, height: micActive ? 5 : 2, background: micActive ? "#e94560" : "#c9a58a", borderRadius: micActive ? "2px 2px 4px 4px" : "4px", transition: "all 0.3s ease" }} />
                {/* Body */}
                <div style={{ position: "absolute", bottom: 0, left: 4, right: 4, height: 10, background: "#5B3A8C", borderRadius: "6px 6px 0 0" }} />
              </div>
              {/* Mic indicator */}
              <div style={{ position: "absolute", bottom: -3, right: -3, width: 18, height: 18, borderRadius: "50%", background: micActive ? COLORS.accent : COLORS.border, border: `2px solid ${COLORS.bgElevated}`, display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.5s", boxShadow: micActive ? `0 0 8px ${COLORS.accent}66` : "none" }}>
                <span style={{ fontSize: 10 }}>{micActive ? "🎙️" : "🔇"}</span>
              </div>
            </div>
            <span style={{ color: micActive ? COLORS.accent : COLORS.subtext, fontSize: 8, fontWeight: 800, marginTop: 3, fontFamily: "'JetBrains Mono', monospace", transition: "color 0.5s" }}>CASTER</span>
          </div>
          {/* Floor info + broadcast */}
          <div className="flex-1 flex flex-col justify-center min-w-0 gap-1.5">
            {/* Floor name */}
            <div className="flex items-center gap-2">
              <span style={{ fontSize: 16 }}>{FLOOR_EMOJI[activeFloor]}</span>
              <span style={{ color: COLORS.text, fontWeight: 800, fontSize: 14, fontFamily: "'JetBrains Mono', monospace" }}>
                {FLOOR_META[activeFloor]?.title || activeFloor}
              </span>
            </div>
            {/* Broadcast speech bubble - longer dialogue */}
            <div className="relative" style={{ background: COLORS.card, borderRadius: 10, padding: "6px 12px", border: `1px solid ${micActive ? COLORS.accent + "30" : COLORS.border}`, maxWidth: "100%", transition: "border-color 0.5s" }}>
              <div style={{ position: "absolute", left: -6, top: "50%", transform: "translateY(-50%)", width: 0, height: 0, borderTop: "5px solid transparent", borderBottom: "5px solid transparent", borderRight: `6px solid ${COLORS.card}` }} />
              <p style={{ color: COLORS.text, fontSize: 11, lineHeight: 1.5, fontStyle: "italic", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                &ldquo;{displayDialogue}&rdquo;
              </p>
            </div>
          </div>
        </div>

        {/* ── RIGHT: Controls ── */}
        <div className="flex flex-col justify-center gap-1.5 px-3 py-2" style={{ flex: "1 1 55%", minWidth: 0 }}>
          {/* Speed controls row */}
          <div className="flex items-center gap-1.5">
            <span style={{ color: COLORS.subtext, fontSize: 9, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", width: 28, flexShrink: 0 }}>속도</span>
            <div className="flex gap-1 flex-1">
              {[{ l: "×1", v: 1 }, { l: "×2", v: 2 }, { l: "×5", v: 5 }, { l: "⏸", v: 0 }].map(s => (
                <button key={s.v} onClick={() => dispatch({ type: ACTION.SET_SPEED, payload: s.v })}
                  className="flex-1 py-0.5 rounded font-bold transition-all"
                  style={{ background: state.simulation.speed === s.v ? COLORS.accent : COLORS.card, color: state.simulation.speed === s.v ? "#fff" : COLORS.subtext, border: `1px solid ${state.simulation.speed === s.v ? COLORS.accent : COLORS.border}`, fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }}>
                  {s.l}
                </button>
              ))}
            </div>
          </div>
          {/* Split mode row — separate from speed */}
          <div className="flex items-center gap-1.5">
            <span style={{ color: COLORS.subtext, fontSize: 9, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", width: 28, flexShrink: 0 }}>뷰</span>
            <div className="flex gap-1 flex-1">
              {[{ mode: 1, label: "1×1", desc: "단일" }, { mode: 4, label: "2×2", desc: "4층" }, { mode: 6, label: "2×3", desc: "전체" }, { mode: "myNpc", label: "내NPC", desc: "추적" }].map(({ mode, label, desc }) => (
                <button key={mode} onClick={() => {
                  if (mode === "myNpc") {
                    // Focus on custom NPC's floor, zoom in
                    const cn = state.npcs.custom;
                    if (cn) {
                      const npcLoc = state.npcStates[cn.id]?.currentLocation || "lobby";
                      const npcFloor = LOC_TO_FLOOR[npcLoc] || "1F";
                      setFloor(npcFloor);
                      setSplit(1);
                      dispatch({ type: ACTION.SET_RELATION_FOCUS, payload: cn.id });
                    }
                  } else { setSplit(mode); }
                }}
                  className="flex-1 py-0.5 rounded font-bold transition-all"
                  style={{ background: (mode === "myNpc" && splitMode === 1 && state.ui.relationFocusNpc === state.npcs.custom?.id) ? "#7B61FF" : splitMode === mode ? "#e94560" : COLORS.card, color: (mode === "myNpc" && splitMode === 1 && state.ui.relationFocusNpc === state.npcs.custom?.id) ? "#fff" : splitMode === mode ? "#fff" : COLORS.subtext, fontSize: 10, fontFamily: "'JetBrains Mono', monospace", border: `1px solid ${(mode === "myNpc" && splitMode === 1 && state.ui.relationFocusNpc === state.npcs.custom?.id) ? "#7B61FF" : splitMode === mode ? "#e94560" : COLORS.border}` }}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          {/* Floor selection row */}
          <div className="flex items-center gap-1">
            <span style={{ color: COLORS.subtext, fontSize: 9, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", width: 28, flexShrink: 0 }}>층</span>
            <div className="flex gap-1 flex-1">
              {ALL_FLOORS.map(fl => {
                const isActive = activeFloor === fl;
                const flLoc = state.locations.find(l => l.floor === fl);
                const flLocked = flLoc?.isLocked;
                const allN = getAllNpcs(state); const fMeta = FLOOR_META[fl]; let cnt = 0;
                (fMeta?.locs || []).forEach(lid => { allN.forEach(n => { if (state.npcStates[n.id]?.currentLocation === lid) cnt++; }); });
                return (
                  <button key={fl} onClick={() => !flLocked && (setFloor(fl), splitMode !== 1 && setSplit(1))}
                    className="flex items-center justify-center gap-1 py-2 rounded-lg transition-all relative"
                    style={{
                      flex: 1,
                      background: isActive ? COLORS.accent + "20" : "transparent",
                      border: `1.5px solid ${isActive ? COLORS.accent : COLORS.border}`,
                      opacity: flLocked ? 0.3 : 1, cursor: flLocked ? "not-allowed" : "pointer",
                    }}>
                    <span style={{ fontSize: 18 }}>{flLocked ? "🔒" : FLOOR_EMOJI[fl]}</span>
                    <span style={{ fontSize: 10, fontWeight: 800, color: isActive ? COLORS.accent : COLORS.subtext, fontFamily: "'JetBrains Mono', monospace" }}>{fl}</span>
                    {cnt > 0 && (
                      <span style={{
                        position: "absolute", top: -5, right: -3, minWidth: 16, height: 16,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        background: isActive ? COLORS.accent : "#4ecdc4", color: "#fff",
                        fontSize: 9, fontWeight: 900, borderRadius: 8,
                        padding: "0 4px", border: `2px solid ${COLORS.bgElevated}`,
                        boxShadow: `0 1px 4px ${isActive ? COLORS.accent : "#4ecdc4"}44`,
                        lineHeight: 1, fontFamily: "'JetBrains Mono', monospace",
                      }}>{cnt}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
          {/* Amenities row — bigger buttons */}
          <div className="flex items-center gap-1 overflow-x-auto">
            <span style={{ color: COLORS.subtext, fontSize: 9, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", width: 28, flexShrink: 0 }}>시설</span>
            {!isLocked && amenities.length > 0 ? (
              <div className="flex gap-1 flex-1">
                {amenities.map(a => (
                  <button key={a.id} onClick={() => a.app && dispatch({ type: ACTION.OPEN_MODAL, payload: { modal: "miniApp", data: { appId: a.app, amenity: a } } })}
                    className="flex items-center gap-0.5 px-1.5 py-0.5 rounded transition-all"
                    style={{ background: a.app ? COLORS.bgSurface : "transparent", border: `1px solid ${a.app ? COLORS.accent + "30" : COLORS.border}`, cursor: a.app ? "pointer" : "default", opacity: a.app ? 1 : 0.5 }}
                    onMouseEnter={e => { if (a.app) e.currentTarget.style.background = COLORS.accent + "15"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = a.app ? COLORS.bgSurface : "transparent"; }}>
                    <span style={{ fontSize: 11 }}>{a.emoji}</span>
                    <span style={{ color: a.app ? COLORS.text : COLORS.subtext, fontSize: 9, fontWeight: 700 }}>{a.name}</span>
                  </button>
                ))}
              </div>
            ) : (
              <span style={{ color: COLORS.subtext, fontSize: 10, opacity: 0.5 }}>{isLocked ? "🔒 잠김" : "—"}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── MINI APP MODAL — themed single-page mini-apps ──
const MINI_APP_CONFIGS = {
  coffee: {
    title: "Tamaverse BREW", subtitle: "오늘의 커피를 내려보세요",
    accent: "#8B5E3C", bg: "linear-gradient(135deg, rgba(139,94,60,0.1), rgba(78,205,196,0.04))",
    steps: [
      { label: "원두 선택", options: ["🇪🇹 에티오피아 예가체프", "🇨🇴 콜롬비아 수프리모", "🇧🇷 브라질 산토스", "🇬🇹 과테말라 안티구아"] },
      { label: "추출 방식", options: ["☕ 핸드드립", "🫖 에어로프레스", "🔧 모카포트", "💧 콜드브루"] },
    ],
    resultTexts: { perfect: "바리스타급 에스프레소 완성! ☕✨", good: "향긋한 커피가 완성됐어요", miss: "조금 쓰지만... 괜찮아요 😅" },
    lore: "타마버스 브루는 1층 로비 한쪽에 위치한 셀프 커피 바입니다.\n로스팅된 원두의 향이 로비 전체를 감싸고 있어요.",
  },
  reading: {
    title: "BOOK CORNER", subtitle: "오늘의 추천 도서",
    accent: "#6B8E6B", bg: "linear-gradient(135deg, rgba(107,142,107,0.08), rgba(78,205,196,0.04))",
    books: [
      { emoji: "📕", title: "여행은 도착이 아닌 과정이다", author: "김다마고치", genre: "에세이", quote: "우리는 모두 어딘가를 향해 걷고 있지만, 정작 중요한 건 지금 이 걸음이다." },
      { emoji: "📗", title: "타마버스에서 보낸 여름", author: "박소라", genre: "소설", quote: "창밖의 비가 그치면 우리는 다시 낯선 사람이 될까." },
      { emoji: "📘", title: "작은 세계의 큰 이야기", author: "이하루", genre: "판타지", quote: "80명이 만드는 세계는 80억의 세계만큼이나 복잡하다." },
    ],
    lore: "북 코너는 로비 소파 옆에 마련된 아늑한 독서 공간입니다.\n투숙객들이 기증한 책들이 가득 차 있어요.",
  },
  plant: {
    title: "LOBBY GARDEN", subtitle: "로비 화분 돌보기",
    accent: "#4CAF50", bg: "linear-gradient(135deg, rgba(76,175,80,0.08), rgba(78,205,196,0.04))",
    plants: [
      { emoji: "🌱", name: "몬스테라", condition: "목마름", need: "물주기" },
      { emoji: "🌿", name: "스킨답서스", condition: "건강함", need: "영양제" },
      { emoji: "🪴", name: "산세베리아", condition: "햇빛 부족", need: "위치 변경" },
    ],
    resultTexts: { perfect: "화분이 반짝반짝 빛난다! 🌟", good: "화분에 물을 줬어요 🌿", miss: "물을 너무 많이... 😅" },
    lore: "로비 정원은 투숙객들이 함께 가꾸는 작은 초록 공간이에요.\n매일 아침 누군가 물을 주고, 저녁에는 함께 구경해요.",
  },
  guestbook: {
    title: "GUEST BOOK", subtitle: "타마버스에서의 기억을 남겨주세요",
    accent: "#D4956B", bg: "linear-gradient(135deg, rgba(212,149,107,0.08), rgba(233,69,96,0.04))",
    prevEntries: [
      { name: "익명의 투숙객", msg: "이 타마버스에서 시간이 천천히 흐르는 걸 느꼈어요 🌙", day: 3 },
      { name: "여행자 K", msg: "다시 올 때까지, 안녕 타마버스 👋", day: 5 },
      { name: "하루", msg: "여기서 만난 사람들을 오래 기억할 것 같아요 ✨", day: 2 },
    ],
    messages: ["이 타마버스 최고! 🏨", "멋진 하루였어요 ✨", "또 올게요 💕", "여기서의 시간이 특별했어요 🌟", "모두에게 감사해요 💛"],
    lore: "프론트 데스크 옆에 놓인 가죽 표지 방명록입니다.\n떠나는 투숙객들이 하나씩 메시지를 남기고 갑니다.",
  },
  roomservice: {
    title: "ROOM SERVICE", subtitle: "객실로 배달해드립니다",
    accent: "#E8B96B", bg: "linear-gradient(135deg, rgba(232,185,107,0.08), rgba(78,205,196,0.04))",
    menu: [
      { emoji: "🍝", name: "트러플 크림 파스타", desc: "블랙 트러플과 파르메산 치즈", price: "★★" },
      { emoji: "🥗", name: "가든 샐러드", desc: "유기농 채소와 발사믹 드레싱", price: "★" },
      { emoji: "🍜", name: "특제 라멘", desc: "48시간 우린 돈코츠 육수", price: "★★" },
      { emoji: "🥪", name: "클럽 샌드위치", desc: "그릴드 치킨과 아보카도", price: "★" },
    ],
    lore: "24시간 운영되는 룸 서비스입니다.\n셰프가 직접 조리하여 따뜻하게 배달해드립니다.",
  },
  minibar: {
    title: "MINI BAR", subtitle: "객실 미니바에서 골라보세요",
    accent: "#5B9BD5", bg: "linear-gradient(135deg, rgba(91,155,213,0.08), rgba(78,205,196,0.04))",
    menu: [
      { emoji: "🧃", name: "제주 감귤 주스", desc: "신선한 감귤 100%", price: "★" },
      { emoji: "🥤", name: "수제 레모네이드", desc: "레몬과 라벤더", price: "★" },
      { emoji: "🍺", name: "크래프트 맥주", desc: "타마버스 브루어리 IPA", price: "★★" },
      { emoji: "🫧", name: "스파클링 워터", desc: "프리미엄 탄산수", price: "★" },
    ],
    lore: "객실마다 비치된 미니바에는 엄선된 음료가 준비되어 있습니다.\n매일 아침 새롭게 보충됩니다.",
  },
  chef: {
    title: "CHEF'S SPECIAL", subtitle: "오늘의 셰프 스페셜 코스",
    accent: "#C0392B", bg: "linear-gradient(135deg, rgba(192,57,43,0.06), rgba(255,159,67,0.04))",
    courses: [
      { emoji: "🥂", type: "AMUSE", name: "아뮤즈 부쉬", desc: "미니 카프레제와 바질 오일" },
      { emoji: "🍵", type: "APPETIZER", name: "트러플 수프", desc: "블랙 트러플과 버섯 크림 수프" },
      { emoji: "🥩", type: "MAIN", name: "한우 안심 스테이크", desc: "1++ 한우와 레드와인 소스, 계절 채소" },
      { emoji: "🍰", type: "DESSERT", name: "얼그레이 크림브륄레", desc: "얼그레이 향의 부드러운 크림브륄레" },
    ],
    lore: "더 테이블의 헤드 셰프가 매일 달라지는 코스 메뉴를 선보입니다.\n제철 식재료만을 사용하여 특별한 한 끼를 완성합니다.",
  },
  wine: {
    title: "WINE CELLAR", subtitle: "와인 테이스팅 체험",
    accent: "#722F37", bg: "linear-gradient(135deg, rgba(114,47,55,0.1), rgba(233,69,96,0.04))",
    wines: [
      { emoji: "🍷", name: "샤또 다마고치 2019", type: "레드", note: "체리와 오크향, 부드러운 타닌", pair: "스테이크" },
      { emoji: "🥂", name: "다마고치 스파클링", type: "스파클링", note: "청사과와 시트러스, 섬세한 버블", pair: "해산물" },
      { emoji: "🍾", name: "다마고치 로제", type: "로제", note: "딸기와 장미향, 상큼한 마무리", pair: "샐러드" },
    ],
    resultTexts: { perfect: "소믈리에급 테이스팅! 🍷✨", good: "와인을 한 모금 음미했다", miss: "조금 취했나... 🥴" },
    lore: "3층 레스토랑 안쪽에 위치한 와인 셀러에는\n50여 종의 와인이 보관되어 있습니다.",
  },
  dessert: {
    title: "DESSERT BAR", subtitle: "달콤한 선택의 시간",
    accent: "#E8A0BF", bg: "linear-gradient(135deg, rgba(232,160,191,0.08), rgba(255,159,67,0.04))",
    menu: [
      { emoji: "🍰", name: "딸기 쇼트케이크", desc: "생크림과 제철 딸기", price: "★★" },
      { emoji: "🍮", name: "바닐라 푸딩", desc: "마다가스카르 바닐라", price: "★" },
      { emoji: "🧁", name: "레드벨벳 머핀", desc: "크림치즈 프로스팅", price: "★" },
      { emoji: "🍫", name: "가나슈 트러플", desc: "벨기에 다크 초콜릿", price: "★★" },
    ],
    lore: "더 테이블의 파티시에가 매일 아침 신선하게 만드는 디저트입니다.\n선택 장애가 올 수도 있어요.",
  },
  karaoke: {
    title: "OPEN MIC", subtitle: "오늘 밤의 스타는 바로 당신",
    accent: "#E94560", bg: "linear-gradient(135deg, rgba(233,69,96,0.08), rgba(123,97,255,0.04))",
    songs: [
      { emoji: "🎵", title: "다마고치의 밤", artist: "Tamaverse Band", difficulty: "★★" },
      { emoji: "🎶", title: "별이 빛나는 밤에", artist: "Tamaverse OST", difficulty: "★★★" },
      { emoji: "🎤", title: "안녕, 다마고치", artist: "투숙객 합창단", difficulty: "★" },
    ],
    resultTexts: { perfect: "관객들의 환호가 터진다! 🎉🎊", good: "꽤 괜찮은 무대였어요 👏", miss: "다음엔 더 잘할 수 있어요 😅" },
    lore: "4층 공연장의 오픈마이크는 매일 저녁 열립니다.\n누구나 무대에 설 수 있어요. 용기만 있다면!",
  },
  stargazing: {
    title: "OBSERVATORY", subtitle: "오늘 밤 하늘의 이야기",
    accent: "#3A3A6B", bg: "linear-gradient(135deg, rgba(58,58,107,0.15), rgba(78,205,196,0.04))",
    constellations: [
      { emoji: "⭐", name: "오리온자리", desc: "겨울 밤하늘의 사냥꾼", story: "세 개의 별이 나란히 빛나는 허리띠가 특징이에요" },
      { emoji: "🌟", name: "카시오페이아", desc: "W자 형태의 여왕", story: "북극성을 찾는 길잡이 별자리입니다" },
      { emoji: "💫", name: "북두칠성", desc: "큰곰자리의 국자", story: "옛날 사람들은 이 별로 방향을 찾았어요" },
    ],
    lore: "루프탑에 설치된 천체 망원경으로 별을 관측할 수 있습니다.\n맑은 날에는 은하수까지 보인다고 해요.",
  },
  cocktail: {
    title: "SUNSET HOUR", subtitle: "선셋 칵테일을 만들어보세요",
    accent: "#FF6B35", bg: "linear-gradient(135deg, rgba(255,107,53,0.1), rgba(233,69,96,0.04))",
    recipes: [
      { emoji: "🍹", name: "다마고치 선셋", base: "럼", mixer: "오렌지 주스 + 그레나딘", color: "#FF6B35" },
      { emoji: "🍸", name: "스카이라인 토닉", base: "진", mixer: "토닉워터 + 라임", color: "#4ecdc4" },
      { emoji: "🥃", name: "루프탑 올드패션드", base: "버번", mixer: "앙고스투라 비터 + 오렌지", color: "#D4956B" },
    ],
    resultTexts: { perfect: "완벽한 선셋 칵테일! 🌅✨", good: "칵테일이 완성됐어요 🍹", miss: "좀 세게 만든 것 같아요... 🥴" },
    lore: "해질 무렵 루프탑은 가장 아름다운 빛으로 물듭니다.\n바텐더의 특별 레시피로 칵테일을 만들어보세요.",
  },
  gacha: {
    title: "GACHA MACHINE", subtitle: "오늘의 운을 시험해보세요!",
    accent: "#FFD700", bg: "linear-gradient(135deg, rgba(255,215,0,0.08), rgba(233,69,96,0.04))",
    lore: "B1F 자판기 코너의 명물, 가챠 머신입니다.\n무엇이 나올지는 아무도 모릅니다... 🎰",
  },
  arcade: {
    title: "ARCADE ZONE", subtitle: "반응속도를 테스트해보세요",
    accent: "#7B61FF", bg: "linear-gradient(135deg, rgba(123,97,255,0.1), rgba(78,205,196,0.04))",
    resultTexts: { perfect: "하이스코어 달성! 🕹️🏆", good: "좋은 점수예요! 👾", miss: "다시 도전! 🎮" },
    lore: "B1F 아케이드에는 레트로 게임기가 줄지어 있습니다.\n최고 점수를 기록하면 벽에 이름이 새겨져요.",
  },
  lounge: {
    title: "LOBBY LOUNGE", subtitle: "편안한 소파에서 쉬어가세요",
    accent: "#A29BFE", bg: "linear-gradient(135deg, rgba(162,155,254,0.08), rgba(78,205,196,0.04))",
    activities: [
      { emoji: "😴", name: "잠깐 눈 감기", desc: "5분만 눈을 감아볼까요" },
      { emoji: "📱", name: "핸드폰 보기", desc: "SNS를 둘러보는 중" },
      { emoji: "👀", name: "사람 구경", desc: "로비를 오가는 사람들을 바라봐요" },
    ],
    lore: "로비 중앙의 넓은 소파는 모든 투숙객에게 열린 공간입니다.\n여기서 우연한 대화가 시작되기도 해요.",
  },
  sleep: {
    title: "SWEET DREAMS", subtitle: "편안한 잠자리로 초대합니다",
    accent: "#6C5CE7", bg: "linear-gradient(135deg, rgba(108,92,231,0.1), rgba(78,205,196,0.04))",
    options: [
      { emoji: "🌙", name: "낮잠 모드", desc: "30분 파워 낮잠", duration: "30분" },
      { emoji: "💤", name: "숙면 모드", desc: "푹 자고 일어나기", duration: "8시간" },
      { emoji: "🧘", name: "명상 모드", desc: "눈 감고 호흡에 집중", duration: "15분" },
    ],
    lore: "다마고치의 객실 침대는 특별 주문 매트리스를 사용합니다.\n베개는 3종류 중에 고를 수 있어요.",
  },
  closet: {
    title: "WARDROBE", subtitle: "오늘의 코디를 골라보세요",
    accent: "#E8A0BF", bg: "linear-gradient(135deg, rgba(232,160,191,0.08), rgba(123,97,255,0.04))",
    outfits: [
      { emoji: "👔", name: "포멀 룩", desc: "셔츠 + 슬랙스", mood: "단정한" },
      { emoji: "👕", name: "캐주얼 룩", desc: "맨투맨 + 데님", mood: "편안한" },
      { emoji: "🧥", name: "시크 룩", desc: "트렌치코트 + 올블랙", mood: "세련된" },
      { emoji: "👘", name: "감성 룩", desc: "린넨 셔츠 + 면바지", mood: "여유로운" },
    ],
    lore: "객실 옷장에는 투숙객을 위한 기본 의류가 준비되어 있습니다.\n무드에 따라 코디를 바꿔보세요.",
  },
  dining: {
    title: "THE TABLE", subtitle: "오늘의 식사 자리를 잡아보세요",
    accent: "#E8B96B", bg: "linear-gradient(135deg, rgba(232,185,107,0.08), rgba(233,69,96,0.04))",
    seats: [
      { emoji: "🪟", name: "창가 자리", desc: "타마버스 정원이 보이는 자리" },
      { emoji: "🕯️", name: "캔들 테이블", desc: "은은한 조명의 2인석" },
      { emoji: "👥", name: "라운드 테이블", desc: "투숙객들과 함께하는 공동석" },
    ],
    lore: "더 테이블은 타마버스의 메인 다이닝 공간입니다.\n아침·점심·저녁 식사가 제공됩니다.",
  },
  show: {
    title: "STAGE Tamaverse", subtitle: "오늘의 공연을 감상하세요",
    accent: "#E94560", bg: "linear-gradient(135deg, rgba(233,69,96,0.08), rgba(123,97,255,0.04))",
    shows: [
      { emoji: "🎭", name: "즉흥 연극", desc: "투숙객 참여형 연극", time: "19:00" },
      { emoji: "🎵", name: "재즈 라이브", desc: "타마버스 전속 밴드 공연", time: "20:30" },
      { emoji: "🎪", name: "마술 쇼", desc: "타마버스 마술사의 특별 공연", time: "21:00" },
    ],
    lore: "4층 스테이지는 타마버스의 문화 공간입니다.\n매일 저녁 다양한 공연이 펼쳐집니다.",
  },
  instruments: {
    title: "MUSIC CORNER", subtitle: "악기를 연주해보세요",
    accent: "#FF9F43", bg: "linear-gradient(135deg, rgba(255,159,67,0.08), rgba(78,205,196,0.04))",
    instruments: [
      { emoji: "🎸", name: "어쿠스틱 기타", desc: "통기타로 감성 연주" },
      { emoji: "🎹", name: "미니 피아노", desc: "디지털 피아노" },
      { emoji: "🥁", name: "카혼", desc: "타악기 체험" },
    ],
    resultTexts: { perfect: "아름다운 선율이 울려퍼진다! 🎶", good: "나쁘지 않은 연주! 🎵", miss: "연습이 좀 더 필요해요 😅" },
    lore: "공연장 한쪽에 마련된 악기 코너입니다.\n자유롭게 연주하고, 영감을 나눠보세요.",
  },
  fashion: {
    title: "FASHION POPUP", subtitle: "스타일리스트의 코디 추천",
    accent: "#FF6B6B", bg: "linear-gradient(135deg, rgba(255,107,107,0.08), rgba(232,160,191,0.04))",
    styles: [
      { emoji: "✨", name: "오늘의 추천", desc: "스타일리스트가 고른 베스트 코디", tip: "파스텔톤 니트 + 와이드 팬츠" },
      { emoji: "🌊", name: "바캉스 무드", desc: "리조트 감성 코디", tip: "하와이안 셔츠 + 쇼츠" },
      { emoji: "🌙", name: "나이트 룩", desc: "저녁 공연용 스타일", tip: "슬림 재킷 + 모노톤 셋업" },
    ],
    lore: "루프탑에서 운영되는 팝업 스토어입니다.\n시즌 한정 스타일을 만나보세요.",
  },
  laundry: {
    title: "LAUNDRY ROOM", subtitle: "빨래를 돌려보세요",
    accent: "#74B9FF", bg: "linear-gradient(135deg, rgba(116,185,255,0.08), rgba(78,205,196,0.04))",
    cycles: [
      { emoji: "💨", name: "빠른 세탁", desc: "15분 급속 코스", duration: "15분" },
      { emoji: "🫧", name: "표준 세탁", desc: "일반 세탁 코스", duration: "45분" },
      { emoji: "🧼", name: "딥클린", desc: "특수 세탁 코스", duration: "90분" },
    ],
    resultTexts: { perfect: "빨래가 뽀송뽀송! 🧺✨", good: "세탁 완료! 👕", miss: "색이 좀 빠졌나... 😅" },
    lore: "B1F 세탁실에는 드럼세탁기 4대가 있습니다.\n세제와 섬유유연제는 비치되어 있어요.",
  },
  storage: {
    title: "STORAGE", subtitle: "보관함을 확인해보세요",
    accent: "#A0A0A0", bg: "linear-gradient(135deg, rgba(160,160,160,0.06), rgba(78,205,196,0.04))",
    items: [
      { emoji: "🧳", name: "여행 가방", desc: "체크인 시 맡긴 캐리어" },
      { emoji: "📦", name: "택배 보관함", desc: "도착한 물품 1건" },
      { emoji: "🔐", name: "개인 사물함", desc: "귀중품 보관 가능" },
    ],
    lore: "B1F 창고는 투숙객 전용 보관 공간입니다.\n체크아웃 전까지 자유롭게 이용하세요.",
  },
};

function MiniAppModal({ state, dispatch }) {
  const data = state.ui.modalData;
  if (!data?.appId) return null;
  const appId = data.appId;
  const amenity = data.amenity;
  const config = MINI_APP_CONFIGS[appId] || {};
  const [phase, setPhase] = useState("ready");
  const [result, setResult] = useState(null);
  const [gauge, setGauge] = useState(0);
  const [gaugeDir, setGaugeDir] = useState(1);
  const [selection, setSelection] = useState({});
  const [picked, setPicked] = useState(null);

  useEffect(() => {
    if (phase !== "playing") return;
    if (appId === "gacha") return;
    const iv = setInterval(() => {
      setGauge(g => {
        const next = g + gaugeDir * 2;
        if (next >= 100) { setGaugeDir(-1); return 100; }
        if (next <= 0) { setGaugeDir(1); return 0; }
        return next;
      });
    }, 30);
    return () => clearInterval(iv);
  }, [phase, gaugeDir, appId]);

  const addFeed = (text) => dispatch({ type: ACTION.ADD_FEED_ITEM, payload: { id: `f-app-${Date.now()}`, type: "event", text, time: formatGameTime(state.simulation.gameTime), day: state.simulation.gameDay } });
  const close = () => dispatch({ type: ACTION.CLOSE_MODAL });

  const startGame = () => {
    if (appId === "gacha") {
      setPhase("result");
      const r = Math.random();
      const item = r < 0.1 ? GACHA_ITEMS.filter(i => i.rarity === "epic")[0] : r < 0.4 ? GACHA_ITEMS.filter(i => i.rarity === "rare")[Math.floor(Math.random() * GACHA_ITEMS.filter(i => i.rarity === "rare").length)] : GACHA_ITEMS.filter(i => i.rarity === "common")[Math.floor(Math.random() * GACHA_ITEMS.filter(i => i.rarity === "common").length)];
      setResult(item);
      addFeed(`🎰 가챠에서 ${item.emoji} ${item.name}(${item.rarity})을(를) 뽑았다!`);
    } else {
      setPhase("playing"); setGauge(0); setGaugeDir(1);
    }
  };

  const stopGauge = () => {
    setPhase("result");
    const score = gauge >= 40 && gauge <= 70 ? "perfect" : gauge >= 25 && gauge <= 85 ? "good" : "miss";
    const labels = { perfect: "퍼펙트! ⭐", good: "좋아요! 👍", miss: "아쉬워요 😅" };
    setResult({ score, label: labels[score], gauge });
    const rt = config.resultTexts || {};
    addFeed(`${amenity.emoji} ${rt[score] || "미니앱을 즐겼다."}`);
  };

  const rarityColors = { common: "#8a8a8a", rare: "#5B9BD5", epic: "#FFD700" };
  const rarityLabels = { common: "일반", rare: "레어", epic: "에픽" };
  const accentColor = config.accent || COLORS.accent;

  // ── Shared header ──
  const Header = () => (
    <div className="px-5 pt-5 pb-4" style={{ background: config.bg || "transparent", borderBottom: `1px solid ${COLORS.border}` }}>
      <div className="flex items-center gap-2 mb-2">
        <span style={{ fontSize: 14 }}>{amenity.emoji}</span>
        <span style={{ color: accentColor, fontSize: 10, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase", fontFamily: "'JetBrains Mono', monospace" }}>{config.title || amenity.name}</span>
      </div>
      <h2 style={{ color: COLORS.text, fontWeight: 800, fontSize: 20, fontFamily: "'Playfair Display', serif" }}>{amenity.name}</h2>
      <p style={{ color: COLORS.subtext, fontSize: 12, marginTop: 4 }}>{config.subtitle || amenity.desc}</p>
    </div>
  );

  // ── Lore section ──
  const Lore = () => config.lore ? (
    <div className="px-5 py-3" style={{ borderTop: `1px dashed ${COLORS.border}` }}>
      <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, lineHeight: 1.6, fontStyle: "italic", whiteSpace: "pre-line" }}>{config.lore}</p>
    </div>
  ) : null;

  // ── Gauge game UI ──
  const GaugeGame = () => (
    <div className="px-5 py-4">
      {phase === "playing" && (
        <div>
          <p className="text-center mb-3" style={{ color: COLORS.text, fontSize: 14, fontWeight: 600 }}>타이밍에 맞춰 버튼을 누르세요!</p>
          <div className="relative h-8 rounded-full overflow-hidden mb-3" style={{ background: COLORS.border + "44" }}>
            <div className="absolute top-0 left-[35%] w-[30%] h-full" style={{ background: COLORS.positive + "25", borderLeft: `2px dashed ${COLORS.positive}`, borderRight: `2px dashed ${COLORS.positive}` }} />
            <div className="absolute top-0 h-full rounded-full transition-none" style={{ left: `${gauge}%`, width: 8, marginLeft: -4, background: accentColor }} />
          </div>
          <button onClick={stopGauge} className="w-full py-3.5 rounded-xl text-white font-bold text-lg transition-all hover:scale-[1.02] active:scale-95" style={{ background: accentColor }}>STOP!</button>
        </div>
      )}
      {phase === "result" && result && result.score && (
        <div className="text-center py-3">
          <span style={{ fontSize: 48 }}>{result.score === "perfect" ? "⭐" : result.score === "good" ? "👍" : "😅"}</span>
          <p style={{ color: COLORS.text, fontWeight: 800, fontSize: 20, marginTop: 8 }}>{result.label}</p>
          <p style={{ color: COLORS.subtext, fontSize: 13, marginTop: 4 }}>{config.resultTexts?.[result.score] || ""}</p>
          <div className="flex gap-2 mt-4">
            <button onClick={() => { setPhase("ready"); setResult(null); setGauge(0); }} className="flex-1 py-3 rounded-xl font-bold" style={{ background: accentColor, color: "#fff" }}>🔄 다시</button>
            <button onClick={close} className="flex-1 py-3 rounded-xl font-medium" style={{ background: COLORS.border + "44", color: COLORS.subtext }}>닫기</button>
          </div>
        </div>
      )}
    </div>
  );

  // ── APP-SPECIFIC CONTENT ──
  const renderContent = () => {
    // === COFFEE ===
    if (appId === "coffee") {
      const steps = config.steps || [];
      return (
        <div className="px-5 py-4">
          {phase === "ready" && (
            <div>
              {steps.map((step, si) => (
                <div key={si} className="mb-4">
                  <p style={{ color: accentColor, fontSize: 11, fontWeight: 700, letterSpacing: 1, fontFamily: "'JetBrains Mono', monospace", marginBottom: 6 }}>{`STEP ${si + 1}. ${step.label}`}</p>
                  <div className="flex flex-col gap-1.5">
                    {step.options.map((opt, oi) => (
                      <button key={oi} onClick={() => setSelection(s => ({ ...s, [si]: oi }))}
                        className="px-3 py-2.5 rounded-lg text-left transition-all" style={{ background: selection[si] === oi ? accentColor + "22" : COLORS.bgElevated, border: `1px solid ${selection[si] === oi ? accentColor : COLORS.border}`, color: COLORS.text, fontSize: 13 }}>
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <button onClick={startGame} className="w-full py-3.5 rounded-xl text-white font-bold transition-all hover:scale-[1.02]" style={{ background: accentColor }}>☕ 추출 시작</button>
            </div>
          )}
          <GaugeGame />
        </div>
      );
    }

    // === READING ===
    if (appId === "reading") {
      const books = config.books || [];
      return (
        <div className="px-5 py-4">
          {!picked ? (
            <div>
              <p style={{ color: COLORS.subtext, fontSize: 12, marginBottom: 12 }}>오늘의 추천 도서를 골라보세요</p>
              {books.map((b, i) => (
                <button key={i} onClick={() => setPicked(b)} className="w-full text-left px-4 py-3 rounded-xl mb-2 transition-all hover:scale-[1.01]"
                  style={{ background: COLORS.bgElevated, border: `1px solid ${COLORS.border}` }}>
                  <div className="flex items-center gap-3">
                    <span style={{ fontSize: 28 }}>{b.emoji}</span>
                    <div>
                      <p style={{ color: COLORS.text, fontSize: 14, fontWeight: 700 }}>{b.title}</p>
                      <p style={{ color: COLORS.subtext, fontSize: 11 }}>{b.author} · {b.genre}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center">
              <span style={{ fontSize: 48 }}>{picked.emoji}</span>
              <h3 style={{ color: COLORS.text, fontWeight: 800, fontSize: 18, marginTop: 8 }}>{picked.title}</h3>
              <p style={{ color: COLORS.subtext, fontSize: 12, marginTop: 2 }}>{picked.author}</p>
              <div className="mt-4 px-4 py-3 rounded-xl" style={{ background: COLORS.bgElevated, border: `1px solid ${COLORS.border}` }}>
                <p style={{ color: "#d4cfe8", fontSize: 14, lineHeight: 1.8, fontStyle: "italic" }}>"{picked.quote}"</p>
              </div>
              <button onClick={() => { addFeed(`📚 "${picked.title}"을(를) 읽었다.`); close(); }}
                className="w-full py-3 rounded-xl text-white font-bold mt-4 transition-all" style={{ background: accentColor }}>📖 독서 완료</button>
            </div>
          )}
        </div>
      );
    }

    // === PLANT ===
    if (appId === "plant") {
      const plants = config.plants || [];
      return (
        <div className="px-5 py-4">
          {phase === "ready" && (
            <div>
              <p style={{ color: COLORS.subtext, fontSize: 12, marginBottom: 12 }}>화분 상태를 확인하고 돌봐주세요</p>
              {plants.map((p, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-3 rounded-xl mb-2" style={{ background: COLORS.bgElevated, border: `1px solid ${COLORS.border}` }}>
                  <span style={{ fontSize: 28 }}>{p.emoji}</span>
                  <div className="flex-1">
                    <p style={{ color: COLORS.text, fontSize: 14, fontWeight: 700 }}>{p.name}</p>
                    <p style={{ color: COLORS.subtext, fontSize: 11 }}>상태: {p.condition} · 필요: {p.need}</p>
                  </div>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: p.condition === "건강함" ? "rgba(78,205,196,0.15)" : "rgba(233,69,96,0.15)" }}>
                    <span style={{ fontSize: 12 }}>{p.condition === "건강함" ? "✅" : "💧"}</span>
                  </div>
                </div>
              ))}
              <button onClick={startGame} className="w-full py-3.5 rounded-xl text-white font-bold mt-2 transition-all hover:scale-[1.02]" style={{ background: accentColor }}>🌱 물 주기 시작</button>
            </div>
          )}
          <GaugeGame />
        </div>
      );
    }

    // === GUESTBOOK ===
    if (appId === "guestbook") {
      const entries = config.prevEntries || [];
      const msgs = config.messages || [];
      return (
        <div className="px-5 py-4">
          <p style={{ color: COLORS.subtext, fontSize: 11, marginBottom: 8, fontFamily: "'JetBrains Mono', monospace" }}>PREVIOUS ENTRIES</p>
          {entries.map((e, i) => (
            <div key={i} className="px-3 py-2.5 rounded-lg mb-2" style={{ background: COLORS.bgElevated, borderLeft: `3px solid ${accentColor}33` }}>
              <p style={{ color: "#d4cfe8", fontSize: 13, lineHeight: 1.6 }}>"{e.msg}"</p>
              <p style={{ color: COLORS.subtext, fontSize: 10, marginTop: 2 }}>— {e.name} · Day {e.day}</p>
            </div>
          ))}
          <div className="mt-4 pt-3" style={{ borderTop: `1px dashed ${COLORS.border}` }}>
            <p style={{ color: COLORS.subtext, fontSize: 12, marginBottom: 8 }}>메시지를 남겨주세요 ✍️</p>
            <div className="flex flex-col gap-1.5">
              {msgs.map(msg => (
                <button key={msg} onClick={() => { addFeed(`📝 방명록에 "${msg}" 남김`); close(); }}
                  className="px-3 py-2.5 rounded-lg text-left transition-all hover:scale-[1.01]" style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, color: COLORS.text, fontSize: 13 }}>
                  {msg}
                </button>
              ))}
            </div>
          </div>
        </div>
      );
    }

    // === MENU-TYPE APPS (roomservice, minibar, dessert) ===
    if (appId === "roomservice" || appId === "minibar" || appId === "dessert") {
      const menu = config.menu || [];
      return (
        <div className="px-5 py-4">
          <p style={{ color: COLORS.subtext, fontSize: 11, marginBottom: 10, fontFamily: "'JetBrains Mono', monospace" }}>MENU</p>
          {menu.map((item, i) => (
            <button key={i} onClick={() => { addFeed(`${amenity.emoji} ${item.name}을(를) 주문했다!`); close(); }}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl mb-2 text-left transition-all hover:scale-[1.01]"
              style={{ background: COLORS.bgElevated, border: `1px solid ${COLORS.border}` }}>
              <span style={{ fontSize: 28 }}>{item.emoji}</span>
              <div className="flex-1">
                <p style={{ color: COLORS.text, fontSize: 14, fontWeight: 700 }}>{item.name}</p>
                <p style={{ color: COLORS.subtext, fontSize: 11 }}>{item.desc}</p>
              </div>
              <span style={{ color: accentColor, fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }}>{item.price}</span>
            </button>
          ))}
        </div>
      );
    }

    // === CHEF ===
    if (appId === "chef") {
      const courses = config.courses || [];
      return (
        <div className="px-5 py-4">
          <p style={{ color: COLORS.subtext, fontSize: 11, marginBottom: 12, fontFamily: "'JetBrains Mono', monospace" }}>TODAY'S COURSE</p>
          {courses.map((c, i) => (
            <div key={i} className="flex items-start gap-3 mb-3 relative" style={{ paddingLeft: 12, borderLeft: `2px solid ${i === courses.length - 1 ? "transparent" : accentColor + "33"}` }}>
              <div className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full" style={{ background: accentColor, border: `2px solid ${COLORS.card}` }} />
              <div className="flex-1">
                <span style={{ color: accentColor, fontSize: 9, fontWeight: 800, letterSpacing: 1.5, fontFamily: "'JetBrains Mono', monospace" }}>{c.type}</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span style={{ fontSize: 18 }}>{c.emoji}</span>
                  <div>
                    <p style={{ color: COLORS.text, fontSize: 14, fontWeight: 700 }}>{c.name}</p>
                    <p style={{ color: COLORS.subtext, fontSize: 11 }}>{c.desc}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
          <button onClick={() => { addFeed(`👨‍🍳 셰프 스페셜 코스를 즐겼다!`); close(); }}
            className="w-full py-3 rounded-xl text-white font-bold mt-2 transition-all hover:scale-[1.02]" style={{ background: accentColor }}>🍽️ 식사 시작</button>
        </div>
      );
    }

    // === WINE ===
    if (appId === "wine") {
      const wines = config.wines || [];
      return (
        <div className="px-5 py-4">
          {phase === "ready" && (
            <div>
              <p style={{ color: COLORS.subtext, fontSize: 12, marginBottom: 10 }}>테이스팅할 와인을 선택하세요</p>
              {wines.map((w, i) => (
                <button key={i} onClick={() => { setSelection({ wine: i }); startGame(); }}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl mb-2 text-left transition-all hover:scale-[1.01]"
                  style={{ background: COLORS.bgElevated, border: `1px solid ${COLORS.border}` }}>
                  <span style={{ fontSize: 28 }}>{w.emoji}</span>
                  <div className="flex-1">
                    <p style={{ color: COLORS.text, fontSize: 14, fontWeight: 700 }}>{w.name}</p>
                    <p style={{ color: COLORS.subtext, fontSize: 11 }}>{w.type} · {w.note}</p>
                    <p style={{ color: accentColor, fontSize: 10, marginTop: 2 }}>페어링: {w.pair}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
          <GaugeGame />
        </div>
      );
    }

    // === STARGAZING ===
    if (appId === "stargazing") {
      const cs = config.constellations || [];
      return (
        <div className="px-5 py-4">
          {!picked ? (
            <div>
              <p style={{ color: COLORS.subtext, fontSize: 12, marginBottom: 10 }}>관측할 별자리를 선택하세요</p>
              {cs.map((c, i) => (
                <button key={i} onClick={() => setPicked(c)}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl mb-2 text-left transition-all hover:scale-[1.01]"
                  style={{ background: COLORS.bgElevated, border: `1px solid ${COLORS.border}` }}>
                  <span style={{ fontSize: 28 }}>{c.emoji}</span>
                  <div className="flex-1">
                    <p style={{ color: COLORS.text, fontSize: 14, fontWeight: 700 }}>{c.name}</p>
                    <p style={{ color: COLORS.subtext, fontSize: 11 }}>{c.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-3">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-3" style={{ background: "rgba(58,58,107,0.3)", border: `2px solid rgba(78,205,196,0.3)` }}>
                <span style={{ fontSize: 40 }}>{picked.emoji}</span>
              </div>
              <h3 style={{ color: COLORS.text, fontWeight: 800, fontSize: 18 }}>{picked.name}</h3>
              <p style={{ color: COLORS.subtext, fontSize: 12, marginTop: 2 }}>{picked.desc}</p>
              <div className="mt-3 px-4 py-3 rounded-xl text-left" style={{ background: COLORS.bgElevated, border: `1px solid ${COLORS.border}` }}>
                <p style={{ color: "#d4cfe8", fontSize: 13, lineHeight: 1.7 }}>🔭 {picked.story}</p>
              </div>
              <button onClick={() => { addFeed(`🔭 ${picked.name}을(를) 관측했다! ⭐`); close(); }}
                className="w-full py-3 rounded-xl text-white font-bold mt-4 transition-all" style={{ background: accentColor }}>✨ 관측 완료</button>
            </div>
          )}
        </div>
      );
    }

    // === COCKTAIL ===
    if (appId === "cocktail") {
      const recipes = config.recipes || [];
      return (
        <div className="px-5 py-4">
          {phase === "ready" && (
            <div>
              <p style={{ color: COLORS.subtext, fontSize: 12, marginBottom: 10 }}>칵테일 레시피를 선택하세요</p>
              {recipes.map((r, i) => (
                <button key={i} onClick={() => { setSelection({ cocktail: i }); startGame(); }}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl mb-2 text-left transition-all hover:scale-[1.01]"
                  style={{ background: COLORS.bgElevated, border: `1px solid ${COLORS.border}` }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: r.color + "22", border: `2px solid ${r.color}44` }}>
                    <span style={{ fontSize: 20 }}>{r.emoji}</span>
                  </div>
                  <div className="flex-1">
                    <p style={{ color: COLORS.text, fontSize: 14, fontWeight: 700 }}>{r.name}</p>
                    <p style={{ color: COLORS.subtext, fontSize: 11 }}>{r.base} + {r.mixer}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
          <GaugeGame />
        </div>
      );
    }

    // === KARAOKE ===
    if (appId === "karaoke") {
      const songs = config.songs || [];
      return (
        <div className="px-5 py-4">
          {phase === "ready" && (
            <div>
              <p style={{ color: COLORS.subtext, fontSize: 12, marginBottom: 10 }}>오늘 부를 노래를 선택하세요</p>
              {songs.map((s, i) => (
                <button key={i} onClick={() => { setSelection({ song: i }); startGame(); }}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl mb-2 text-left transition-all hover:scale-[1.01]"
                  style={{ background: COLORS.bgElevated, border: `1px solid ${COLORS.border}` }}>
                  <span style={{ fontSize: 24 }}>{s.emoji}</span>
                  <div className="flex-1">
                    <p style={{ color: COLORS.text, fontSize: 14, fontWeight: 700 }}>{s.title}</p>
                    <p style={{ color: COLORS.subtext, fontSize: 11 }}>{s.artist}</p>
                  </div>
                  <span style={{ color: accentColor, fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}>{s.difficulty}</span>
                </button>
              ))}
            </div>
          )}
          <GaugeGame />
        </div>
      );
    }

    // === GACHA ===
    if (appId === "gacha") {
      return (
        <div className="px-5 py-4">
          {phase === "ready" && (
            <div className="text-center py-2">
              <div className="relative inline-block mb-3">
                <span style={{ fontSize: 72 }}>🎰</span>
              </div>
              <div className="flex justify-center gap-3 mb-4">
                {[{ label: "일반", color: "#8a8a8a", pct: "60%" }, { label: "레어", color: "#5B9BD5", pct: "30%" }, { label: "에픽", color: "#FFD700", pct: "10%" }].map(r => (
                  <div key={r.label} className="px-2 py-1 rounded" style={{ background: r.color + "15", border: `1px solid ${r.color}33` }}>
                    <p style={{ color: r.color, fontSize: 10, fontWeight: 700 }}>{r.label}</p>
                    <p style={{ color: COLORS.subtext, fontSize: 9 }}>{r.pct}</p>
                  </div>
                ))}
              </div>
              <button onClick={startGame} className="w-full py-4 rounded-xl text-black font-bold text-lg transition-all hover:scale-[1.02] active:scale-95" style={{ background: "linear-gradient(135deg, #FFD700, #FFA500)" }}>🎰 뽑기!</button>
            </div>
          )}
          {phase === "result" && result && (
            <div className="text-center py-3">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full mb-3" style={{ background: rarityColors[result.rarity] + "22", border: `3px solid ${rarityColors[result.rarity]}`, boxShadow: `0 0 20px ${rarityColors[result.rarity]}33` }}>
                <span style={{ fontSize: 48 }}>{result.emoji}</span>
              </div>
              <p style={{ color: COLORS.text, fontWeight: 800, fontSize: 20 }}>{result.name}</p>
              <span className="inline-block px-3 py-1 rounded-full mt-1 mb-2" style={{ background: rarityColors[result.rarity] + "22", color: rarityColors[result.rarity], fontSize: 13, fontWeight: 700 }}>{rarityLabels[result.rarity]}</span>
              <p style={{ color: COLORS.subtext, fontSize: 14 }}>{result.desc}</p>
              <div className="flex gap-2 mt-4">
                <button onClick={() => { setPhase("ready"); setResult(null); }} className="flex-1 py-3 rounded-xl font-bold" style={{ background: "linear-gradient(135deg, #FFD700, #FFA500)", color: "#000" }}>🎰 한번 더!</button>
                <button onClick={close} className="flex-1 py-3 rounded-xl font-medium" style={{ background: COLORS.border + "44", color: COLORS.subtext }}>닫기</button>
              </div>
            </div>
          )}
        </div>
      );
    }

    // === ARCADE ===
    if (appId === "arcade") {
      return (
        <div className="px-5 py-4">
          {phase === "ready" && (
            <div className="text-center py-2">
              <span style={{ fontSize: 56 }}>🕹️</span>
              <p style={{ color: COLORS.text, fontSize: 15, fontWeight: 700, marginTop: 8 }}>반응속도 테스트</p>
              <p style={{ color: COLORS.subtext, fontSize: 12, marginTop: 4, marginBottom: 12 }}>초록 영역에서 정확하게 멈추세요!</p>
              <button onClick={startGame} className="w-full py-4 rounded-xl text-white font-bold text-lg transition-all hover:scale-[1.02] active:scale-95" style={{ background: accentColor }}>▶ 게임 시작</button>
            </div>
          )}
          <GaugeGame />
        </div>
      );
    }

    // === LOUNGE (로비 소파) ===
    if (appId === "lounge") {
      const acts = config.activities || [];
      return (
        <div className="px-5 py-4">
          <p style={{ color: COLORS.subtext, fontSize: 12, marginBottom: 10 }}>소파에 앉아서 무엇을 할까요?</p>
          {acts.map((a, i) => (
            <button key={i} onClick={() => { addFeed(`🛋️ 로비 소파에서 ${a.name}...`); close(); }}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl mb-2 text-left transition-all hover:scale-[1.01]"
              style={{ background: COLORS.bgElevated, border: `1px solid ${COLORS.border}` }}>
              <span style={{ fontSize: 24 }}>{a.emoji}</span>
              <div><p style={{ color: COLORS.text, fontSize: 14, fontWeight: 700 }}>{a.name}</p><p style={{ color: COLORS.subtext, fontSize: 11 }}>{a.desc}</p></div>
            </button>
          ))}
        </div>
      );
    }

    // === SLEEP (침대) ===
    if (appId === "sleep") {
      const opts = config.options || [];
      return (
        <div className="px-5 py-4">
          <p style={{ color: COLORS.subtext, fontSize: 12, marginBottom: 10 }}>어떤 모드로 쉬어볼까요?</p>
          {opts.map((o, i) => (
            <button key={i} onClick={() => { addFeed(`🛏️ ${o.name}으로 휴식 (${o.duration})`); close(); }}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl mb-2 text-left transition-all hover:scale-[1.01]"
              style={{ background: COLORS.bgElevated, border: `1px solid ${COLORS.border}` }}>
              <span style={{ fontSize: 24 }}>{o.emoji}</span>
              <div className="flex-1"><p style={{ color: COLORS.text, fontSize: 14, fontWeight: 700 }}>{o.name}</p><p style={{ color: COLORS.subtext, fontSize: 11 }}>{o.desc}</p></div>
              <span style={{ color: accentColor, fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}>{o.duration}</span>
            </button>
          ))}
        </div>
      );
    }

    // === CLOSET (옷장) ===
    if (appId === "closet") {
      const outfits = config.outfits || [];
      return (
        <div className="px-5 py-4">
          <p style={{ color: COLORS.subtext, fontSize: 12, marginBottom: 10 }}>오늘의 기분에 맞는 코디는?</p>
          {outfits.map((o, i) => (
            <button key={i} onClick={() => { addFeed(`👔 ${o.name}(${o.mood})으로 코디 변경!`); close(); }}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl mb-2 text-left transition-all hover:scale-[1.01]"
              style={{ background: COLORS.bgElevated, border: `1px solid ${COLORS.border}` }}>
              <span style={{ fontSize: 24 }}>{o.emoji}</span>
              <div className="flex-1"><p style={{ color: COLORS.text, fontSize: 14, fontWeight: 700 }}>{o.name}</p><p style={{ color: COLORS.subtext, fontSize: 11 }}>{o.desc}</p></div>
              <span className="px-2 py-0.5 rounded-full" style={{ background: accentColor + "15", color: accentColor, fontSize: 10 }}>{o.mood}</span>
            </button>
          ))}
        </div>
      );
    }

    // === DINING (테이블) ===
    if (appId === "dining") {
      const seats = config.seats || [];
      return (
        <div className="px-5 py-4">
          <p style={{ color: COLORS.subtext, fontSize: 12, marginBottom: 10 }}>어디에 앉으시겠어요?</p>
          {seats.map((s, i) => (
            <button key={i} onClick={() => { addFeed(`🍽️ ${s.name}에 자리를 잡았다.`); close(); }}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl mb-2 text-left transition-all hover:scale-[1.01]"
              style={{ background: COLORS.bgElevated, border: `1px solid ${COLORS.border}` }}>
              <span style={{ fontSize: 24 }}>{s.emoji}</span>
              <div><p style={{ color: COLORS.text, fontSize: 14, fontWeight: 700 }}>{s.name}</p><p style={{ color: COLORS.subtext, fontSize: 11 }}>{s.desc}</p></div>
            </button>
          ))}
        </div>
      );
    }

    // === SHOW (스테이지 공연) ===
    if (appId === "show") {
      const shows = config.shows || [];
      return (
        <div className="px-5 py-4">
          <p style={{ color: COLORS.subtext, fontSize: 11, marginBottom: 10, fontFamily: "'JetBrains Mono', monospace" }}>TODAY'S LINEUP</p>
          {shows.map((s, i) => (
            <button key={i} onClick={() => { addFeed(`🎭 "${s.name}" 공연을 관람했다!`); close(); }}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl mb-2 text-left transition-all hover:scale-[1.01]"
              style={{ background: COLORS.bgElevated, border: `1px solid ${COLORS.border}` }}>
              <span style={{ fontSize: 24 }}>{s.emoji}</span>
              <div className="flex-1"><p style={{ color: COLORS.text, fontSize: 14, fontWeight: 700 }}>{s.name}</p><p style={{ color: COLORS.subtext, fontSize: 11 }}>{s.desc}</p></div>
              <span style={{ color: accentColor, fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}>{s.time}</span>
            </button>
          ))}
        </div>
      );
    }

    // === INSTRUMENTS (악기 코너) ===
    if (appId === "instruments") {
      const inst = config.instruments || [];
      return (
        <div className="px-5 py-4">
          {phase === "ready" && (
            <div>
              <p style={{ color: COLORS.subtext, fontSize: 12, marginBottom: 10 }}>연주할 악기를 선택하세요</p>
              {inst.map((ins, i) => (
                <button key={i} onClick={() => { setSelection({ inst: i }); startGame(); }}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl mb-2 text-left transition-all hover:scale-[1.01]"
                  style={{ background: COLORS.bgElevated, border: `1px solid ${COLORS.border}` }}>
                  <span style={{ fontSize: 24 }}>{ins.emoji}</span>
                  <div><p style={{ color: COLORS.text, fontSize: 14, fontWeight: 700 }}>{ins.name}</p><p style={{ color: COLORS.subtext, fontSize: 11 }}>{ins.desc}</p></div>
                </button>
              ))}
            </div>
          )}
          <GaugeGame />
        </div>
      );
    }

    // === FASHION (패션 팝업) ===
    if (appId === "fashion") {
      const styles = config.styles || [];
      return (
        <div className="px-5 py-4">
          <p style={{ color: COLORS.subtext, fontSize: 11, marginBottom: 10, fontFamily: "'JetBrains Mono', monospace" }}>STYLIST'S PICK</p>
          {styles.map((s, i) => (
            <button key={i} onClick={() => { addFeed(`👗 패션 팝업에서 "${s.name}" 스타일 추천받음!`); close(); }}
              className="w-full text-left px-3 py-3 rounded-xl mb-2 transition-all hover:scale-[1.01]"
              style={{ background: COLORS.bgElevated, border: `1px solid ${COLORS.border}` }}>
              <div className="flex items-center gap-2 mb-1">
                <span style={{ fontSize: 18 }}>{s.emoji}</span>
                <p style={{ color: COLORS.text, fontSize: 14, fontWeight: 700 }}>{s.name}</p>
              </div>
              <p style={{ color: COLORS.subtext, fontSize: 11 }}>{s.desc}</p>
              <p className="mt-1.5 px-2 py-1 rounded" style={{ background: accentColor + "12", color: accentColor, fontSize: 12, display: "inline-block" }}>💡 {s.tip}</p>
            </button>
          ))}
        </div>
      );
    }

    // === LAUNDRY (세탁실) ===
    if (appId === "laundry") {
      const cycles = config.cycles || [];
      return (
        <div className="px-5 py-4">
          {phase === "ready" && (
            <div>
              <p style={{ color: COLORS.subtext, fontSize: 12, marginBottom: 10 }}>세탁 코스를 선택하세요</p>
              {cycles.map((c, i) => (
                <button key={i} onClick={() => { setSelection({ cycle: i }); startGame(); }}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl mb-2 text-left transition-all hover:scale-[1.01]"
                  style={{ background: COLORS.bgElevated, border: `1px solid ${COLORS.border}` }}>
                  <span style={{ fontSize: 24 }}>{c.emoji}</span>
                  <div className="flex-1"><p style={{ color: COLORS.text, fontSize: 14, fontWeight: 700 }}>{c.name}</p><p style={{ color: COLORS.subtext, fontSize: 11 }}>{c.desc}</p></div>
                  <span style={{ color: accentColor, fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}>{c.duration}</span>
                </button>
              ))}
            </div>
          )}
          <GaugeGame />
        </div>
      );
    }

    // === STORAGE (창고) ===
    if (appId === "storage") {
      const items = config.items || [];
      return (
        <div className="px-5 py-4">
          <p style={{ color: COLORS.subtext, fontSize: 11, marginBottom: 10, fontFamily: "'JetBrains Mono', monospace" }}>MY STORAGE</p>
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-3 rounded-xl mb-2" style={{ background: COLORS.bgElevated, border: `1px solid ${COLORS.border}` }}>
              <span style={{ fontSize: 24 }}>{item.emoji}</span>
              <div className="flex-1"><p style={{ color: COLORS.text, fontSize: 14, fontWeight: 700 }}>{item.name}</p><p style={{ color: COLORS.subtext, fontSize: 11 }}>{item.desc}</p></div>
            </div>
          ))}
          <button onClick={() => { addFeed("📦 보관함을 확인했다."); close(); }}
            className="w-full py-3 rounded-xl text-white font-bold mt-2 transition-all" style={{ background: accentColor }}>확인 ✓</button>
        </div>
      );
    }

    // Default fallback
    return (
      <div className="px-5 py-4 text-center">
        <button onClick={() => { addFeed(`${amenity.emoji} ${amenity.name}을(를) 이용했다.`); close(); }}
          className="w-full py-3.5 rounded-xl text-white font-bold transition-all hover:scale-[1.02]" style={{ background: accentColor }}>✓ 이용하기</button>
      </div>
    );
  };

  return (
    <ModalOverlay width={520} onClose={close}>
      <div className="rounded-2xl overflow-hidden" style={{ ...MODAL_W, background: COLORS.card, border: `1px solid ${accentColor}33`, boxShadow: "0 8px 40px rgba(0,0,0,0.6)", maxHeight: "85vh", overflowY: "auto" }}>
        <Header />
        {renderContent()}
        <Lore />
        {phase === "ready" && !["gacha", "reading", "stargazing", "guestbook", "roomservice", "minibar", "dessert", "chef", "lounge", "sleep", "closet", "dining", "show", "fashion", "storage"].includes(appId) && phase !== "playing" && (
          <div className="px-5 pb-4"><button onClick={close} className="w-full py-2.5 rounded-lg font-medium" style={{ color: COLORS.subtext, fontSize: 13 }}>닫기</button></div>
        )}
      </div>
    </ModalOverlay>
  );
}

// ── NPC PANEL — design system: InfoRow (읽기전용) vs ActionZone (인터랙션) ──
const INFO_ROW = { display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", background: COLORS.card };
const INFO_LABEL = { color: COLORS.subtext, fontSize: 9, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase", minWidth: 28, fontFamily: "'JetBrains Mono', monospace" };
const INFO_VALUE = { color: COLORS.text, fontSize: 12, fontWeight: 600 };
const ACTION_ZONE = { padding: "6px 10px", background: COLORS.bgElevated, borderTop: `1px dashed ${COLORS.border}` };

function NpcPanel({ state, dispatch }) {
  const cn = state.npcs.custom; const ns = cn ? state.npcStates[cn.id] : null;
  const loc = cn ? state.locations.find(l => l.id === ns?.currentLocation) : null;
  const items = cn ? (cn.suitcaseItems || []).map(id => SUITCASE_ITEMS.find(x => x.id === id)).filter(Boolean) : [];

  if (!cn) return (<div className="flex flex-col items-center justify-center flex-1"><span style={{ fontSize: 28 }}>👤</span><p style={{ color: COLORS.subtext, fontSize: 13, marginTop: 6 }}>캐스팅 완료 후 표시됩니다</p></div>);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* ── 내 NPC 패널 헤더 ── */}
      <div className="flex items-center gap-2 px-3 py-1.5 shrink-0" style={{ background: "rgba(233,69,96,0.06)", borderBottom: `1px solid ${COLORS.border}`, borderRadius: "12px 12px 0 0" }}>
        <span style={{ fontSize: 14 }}>👤</span><h3 style={{ color: COLORS.text, fontWeight: 800, fontSize: 13 }}>내 NPC</h3>
      </div>
      <div className="flex-1 overflow-y-auto flex flex-col">
        {/* ── 프로필 정보 영역 ── */}
        <div style={{ borderBottom: `1px solid ${COLORS.border}` }}>
          <div className="flex items-center gap-2.5 px-3 py-2">
            <div className="shrink-0 flex items-center justify-center" style={{ width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(135deg, rgba(233,69,96,0.12), rgba(78,205,196,0.12))", border: `2px solid ${COLORS.accent}33` }}>
              <span style={{ fontSize: 28 }}>{cn.emoji}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p style={{ color: COLORS.text, fontWeight: 800, fontSize: 15 }}>{cn.name}</p>
              <div className="flex gap-1 mt-0.5 flex-wrap">
                {personalityTags(cn.personality).map(t => <span key={t} className="px-1.5 rounded-full" style={{ background: COLORS.accent + "15", color: COLORS.accent, fontSize: 9, fontWeight: 600, lineHeight: "18px" }}>{t}</span>)}
              </div>
            </div>
            <div style={{ textAlign: "center" }}><span style={{ fontSize: 20, display: "block" }}>{ns?.mood || "😊"}</span><span style={{ ...INFO_LABEL, minWidth: 0 }}>기분</span></div>
          </div>
          <div style={{ ...INFO_ROW, borderTop: `1px solid ${COLORS.border}` }}>
            <span style={INFO_LABEL}>위치</span><span style={INFO_VALUE}>{loc ? `${loc.emoji} ${loc.name}` : "—"}</span>
          </div>
          <div style={{ ...INFO_ROW, borderTop: `1px solid ${COLORS.border}` }}>
            <span style={INFO_LABEL}>활동</span><span className="truncate" style={{ ...INFO_VALUE, fontWeight: 500, fontSize: 11 }}>{ns?.currentActivity || "—"}</span>
          </div>
          <div style={{ ...INFO_ROW, borderTop: `1px solid ${COLORS.border}` }}>
            <span style={INFO_LABEL}>보관함</span>
            {items.length === 0 ? <span style={{ color: COLORS.subtext, fontSize: 11, fontStyle: "italic" }}>비어 있음</span> : (
              <div className="flex gap-1 flex-wrap">{items.map(it => (<span key={it.id} style={{ fontSize: 12 }} title={it.name}>{it.emoji}</span>))}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── DIRECTIVE PANEL — independent panel ──
function DirectivePanel({ state, dispatch }) {
  const cn = state.npcs.custom;
  if (!cn) return (<div className="flex items-center justify-center flex-1" style={{ padding: 12 }}><p style={{ color: COLORS.subtext, fontSize: 11 }}>캐스팅 완료 후 이용 가능</p></div>);
  const ns = state.npcStates[cn.id];
  const dirQueue = ns?.directiveQueue || [];
  const facilityOpts = [];
  const seenIds = new Set();
  Object.entries(FLOOR_AMENITIES).forEach(([floor, amenities]) => {
    amenities.forEach(a => {
      if (!seenIds.has(a.id) && a.app) {
        seenIds.add(a.id);
        facilityOpts.push({ id: a.id, emoji: a.emoji, label: a.name });
      }
    });
  });
  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex items-center gap-2 px-3 py-1 shrink-0" style={{ background: "rgba(123,97,255,0.06)", borderBottom: `1px solid ${COLORS.border}`, borderRadius: "12px 12px 0 0" }}>
        <span style={{ fontSize: 14 }}>🎯</span>
        <h3 style={{ color: COLORS.text, fontWeight: 800, fontSize: 13 }}>활동 예약</h3>
        <span className="ml-auto" style={{ color: COLORS.subtext, fontSize: 10, background: COLORS.bg, padding: "1px 6px", borderRadius: 4, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>{dirQueue.length}/6</span>
      </div>
      <div className="flex-1 flex flex-col items-center" style={{ padding: "8px 10px", background: COLORS.bgElevated }}>
        {/* 6 slots — square icon cards */}
        <div className="flex gap-1.5 mb-2.5 justify-center">
          {[0,1,2,3,4,5].map(i => {
            const dir = dirQueue[i];
            const opt = dir ? facilityOpts.find(o => o.id === dir) : null;
            return (
              <button key={i} className="flex flex-col items-center justify-center gap-0.5 rounded-lg transition-all"
                style={{ width: 52, height: 52, border: `1.5px ${dir ? "solid" : "dashed"} ${dir ? COLORS.accent : COLORS.border}`, background: dir ? COLORS.accent + "18" : "transparent", cursor: dir ? "pointer" : "default", flexShrink: 0 }}
                onClick={() => dir && dispatch({ type: ACTION.TOGGLE_DIRECTIVE_QUEUE, payload: { npcId: cn.id, directive: dir } })}
                title={opt ? `${opt.emoji} ${opt.label} (클릭하여 제거)` : `슬롯 ${i + 1} (비어있음)`}>
                {opt ? (
                  <>
                    <span style={{ fontSize: 18 }}>{opt.emoji}</span>
                    <span style={{ fontSize: 8, color: COLORS.text, fontWeight: 700, lineHeight: 1, textAlign: "center" }}>{opt.label}</span>
                  </>
                ) : (
                  <span style={{ color: COLORS.border, fontSize: 13, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>{i + 1}</span>
                )}
              </button>
            );
          })}
        </div>
        {/* Facility options — text-only compact tags */}
        <div className="dir-scroll flex-1 w-full" style={{ overflowY: "auto", scrollbarWidth: "none", msOverflowStyle: "none" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, justifyContent: "center" }}>
            {facilityOpts.map(o => {
              const inQueue = dirQueue.includes(o.id);
              const queueFull = dirQueue.length >= 6;
              return (
                <button key={String(o.id)} onClick={() => dispatch({ type: ACTION.TOGGLE_DIRECTIVE_QUEUE, payload: { npcId: cn.id, directive: o.id } })}
                  className="rounded-md transition-all"
                  style={{ padding: "3px 8px", background: inQueue ? COLORS.accent + "22" : COLORS.card, border: `1px solid ${inQueue ? COLORS.accent : COLORS.border}`, color: inQueue ? COLORS.accent : COLORS.text, fontSize: 10, fontWeight: inQueue ? 700 : 500, opacity: !inQueue && queueFull ? 0.35 : 1 }}>
                  {o.label}{inQueue ? " ✓" : ""}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── RELATIONSHIPS PANEL — SVG lines + HTML labels for reliable rendering ──
function NpcBustIcon({ npc, size, isCenter, score }) {
  const colors = NPC_COLORS[npc.id] || NPC_COLORS.custom;
  const sz = size || 36;
  const borderColor = score === undefined ? COLORS.border : score > 0 ? COLORS.positive : score < 0 ? COLORS.negative : COLORS.border;
  const borderW = isCenter ? 2.5 : score !== undefined && Math.abs(score) >= 1 ? 2 : 1.5;
  return (
    <div className="flex flex-col items-center" style={{ width: sz + 6 }}>
      <div style={{ width: sz, height: sz, borderRadius: "50%", border: `${borderW}px solid ${borderColor}`, overflow: "hidden", background: colors.body + "33", position: "relative" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "40%", background: colors.hair, borderRadius: `${sz/2}px ${sz/2}px 0 0` }} />
        <div style={{ position: "absolute", top: "18%", left: "20%", right: "20%", height: "45%", background: "#FFD5B0", borderRadius: "40%" }} />
        <div style={{ position: "absolute", top: "35%", left: "30%", width: sz * 0.1, height: sz * 0.1, background: "#333", borderRadius: "50%" }} />
        <div style={{ position: "absolute", top: "35%", right: "30%", width: sz * 0.1, height: sz * 0.1, background: "#333", borderRadius: "50%" }} />
        <div style={{ position: "absolute", bottom: 0, left: "5%", right: "5%", height: "30%", background: colors.body, borderRadius: `${sz * 0.4}px ${sz * 0.4}px 0 0` }} />
        <div style={{ position: "absolute", top: -2, right: -2, fontSize: isCenter ? 12 : 10 }}>{npc.emoji}</div>
      </div>
      <span style={{ color: isCenter ? COLORS.text : COLORS.subtext, fontSize: isCenter ? 10 : 8, fontWeight: isCenter ? 800 : 600, marginTop: 1, textAlign: "center", lineHeight: 1.1, maxWidth: sz + 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{npc.name}</span>
    </div>
  );
}

function RelationshipsPanel({ state, dispatch }) {
  const [focusNpc, setFocusNpc] = useState(null);
  const containerRef = useRef(null);
  const [dims, setDims] = useState({ w: 300, h: 180 });
  const allNpcs = getAllNpcs(state); const cn = state.npcs.custom;
  const mapFocus = state.ui.relationFocusNpc;
  const activeFocus = mapFocus || focusNpc;
  const centerId = activeFocus || cn?.id;
  const centerNpc = allNpcs.find(n => n.id === centerId);

  // Physics state for ALL nodes (including center)
  const [nodePositions, setNodePositions] = useState({});
  const targetRef = useRef({});
  const velocityRef = useRef({});
  const animRef = useRef(null);
  const prevCenterRef = useRef(centerId);

  useEffect(() => { if (mapFocus) { const t = setTimeout(() => dispatch({ type: ACTION.SET_RELATION_FOCUS, payload: null }), 5000); return () => clearTimeout(t); } }, [mapFocus]);
  useEffect(() => { if (focusNpc && focusNpc !== cn?.id) { const t = setTimeout(() => setFocusNpc(null), 3000); return () => clearTimeout(t); } }, [focusNpc, cn?.id]);

  useEffect(() => {
    const measure = () => {
      if (containerRef.current) {
        const r = containerRef.current.getBoundingClientRect();
        if (r.width > 10 && r.height > 10) setDims({ w: Math.floor(r.width), h: Math.floor(r.height) });
      }
    };
    measure();
    const timer = setTimeout(measure, 100);
    window.addEventListener("resize", measure);
    return () => { window.removeEventListener("resize", measure); clearTimeout(timer); };
  }, []);

  // Calculate target positions for ALL nodes — center goes to 50,50, others orbit
  useEffect(() => {
    const targets = {};
    const cxPct = 50, cyPct = 50;
    const otherNpcs = allNpcs.filter(n => n.id !== centerId);

    // Center node target
    targets[centerId] = { x: cxPct, y: cyPct };

    // Orbiting nodes
    otherNpcs.forEach((npc, i) => {
      const rel = state.relationships.find(r => (r.npcA === centerId && r.npcB === npc.id) || (r.npcA === npc.id && r.npcB === centerId));
      const score = rel ? rel.score : 0;
      const baseAngle = (i / Math.max(otherNpcs.length, 1)) * Math.PI * 2 - Math.PI / 2;
      const baseRadius = 32;
      const radiusMod = score > 0 ? Math.max(18, baseRadius - score * 1.5) : Math.min(42, baseRadius + Math.abs(score) * 1.2);
      const angleOffset = (score * 0.04) + (Math.sin(i * 2.1) * 0.15);
      targets[npc.id] = {
        x: cxPct + radiusMod * Math.cos(baseAngle + angleOffset),
        y: cyPct + radiusMod * Math.sin(baseAngle + angleOffset),
      };
    });
    targetRef.current = targets;

    // Initialize positions for new nodes
    setNodePositions(prev => {
      const next = { ...prev };
      let needsInit = false;
      Object.keys(targets).forEach(id => {
        if (!next[id]) {
          // New node: start from center scatter
          next[id] = { x: cxPct + (Math.random() - 0.5) * 15, y: cyPct + (Math.random() - 0.5) * 15 };
          needsInit = true;
        }
      });
      return needsInit ? next : prev;
    });

    // When center changes, give the old center a velocity kick outward
    if (prevCenterRef.current !== centerId) {
      const oldCenter = prevCenterRef.current;
      if (oldCenter && velocityRef.current[oldCenter]) {
        const ot = targets[oldCenter];
        if (ot) {
          const dx = ot.x - 50, dy = ot.y - 50;
          const len = Math.sqrt(dx * dx + dy * dy) || 1;
          velocityRef.current[oldCenter] = { vx: (dx / len) * 3, vy: (dy / len) * 3 };
        }
      }
      prevCenterRef.current = centerId;
    }

    // Initialize velocities
    Object.keys(targets).forEach(id => {
      if (!velocityRef.current[id]) velocityRef.current[id] = { vx: 0, vy: 0 };
    });
  }, [centerId, allNpcs.length, state.relationships]);

  // Spring physics animation loop with inter-node repulsion
  useEffect(() => {
    const spring = 0.06, damping = 0.78, repulse = 2.5, minDist = 12;
    const animate = () => {
      setNodePositions(prev => {
        const ids = Object.keys(targetRef.current);
        if (ids.length === 0) return prev;
        const next = {};
        let anyMoving = false;

        // Calculate spring forces toward targets
        const forces = {};
        ids.forEach(id => {
          const target = targetRef.current[id];
          const current = prev[id] || { x: 50, y: 50 };
          const dx = target.x - current.x, dy = target.y - current.y;
          forces[id] = { fx: dx * spring, fy: dy * spring };
        });

        // Add inter-node repulsion (except center pushes harder)
        for (let i = 0; i < ids.length; i++) {
          for (let j = i + 1; j < ids.length; j++) {
            const a = prev[ids[i]] || { x: 50, y: 50 };
            const b = prev[ids[j]] || { x: 50, y: 50 };
            const dx = a.x - b.x, dy = a.y - b.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 0.1;
            if (dist < minDist) {
              const force = repulse * (1 - dist / minDist) / dist;
              const fx = dx * force, fy = dy * force;
              forces[ids[i]].fx += fx; forces[ids[i]].fy += fy;
              forces[ids[j]].fx -= fx; forces[ids[j]].fy -= fy;
            }
          }
        }

        ids.forEach(id => {
          const current = prev[id] || { x: 50, y: 50 };
          const vel = velocityRef.current[id] || { vx: 0, vy: 0 };
          const f = forces[id] || { fx: 0, fy: 0 };

          vel.vx = (vel.vx + f.fx) * damping;
          vel.vy = (vel.vy + f.fy) * damping;
          velocityRef.current[id] = vel;

          // Clamp to bounds
          const nx = Math.max(5, Math.min(95, current.x + vel.vx));
          const ny = Math.max(5, Math.min(95, current.y + vel.vy));
          next[id] = { x: nx, y: ny };
          if (Math.abs(vel.vx) > 0.005 || Math.abs(vel.vy) > 0.005) anyMoving = true;
        });
        if (!anyMoving) return prev;
        return next;
      });
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, []);

  if (allNpcs.length === 0) return (
    <div className="flex flex-col items-center justify-center flex-1">
      <span style={{ fontSize: 22 }}>💕</span>
      <p style={{ color: COLORS.subtext, fontSize: 12 }}>NPC가 없습니다</p>
    </div>
  );

  const otherNpcs = allNpcs.filter(n => n.id !== centerId);
  const centerPos = nodePositions[centerId] || { x: 50, y: 50 };

  const nodeData = otherNpcs.map((npc) => {
    const pos = nodePositions[npc.id] || { x: 50, y: 50 };
    const rel = state.relationships.find(r => (r.npcA === centerId && r.npcB === npc.id) || (r.npcA === npc.id && r.npcB === centerId));
    const score = rel ? rel.score : 0;
    const mx = centerPos.x * 0.4 + pos.x * 0.6, my = centerPos.y * 0.4 + pos.y * 0.6;
    const dx = pos.x - centerPos.x, dy = pos.y - centerPos.y, len = Math.sqrt(dx * dx + dy * dy) || 1;
    const labelX = mx + (-dy / len * 6), labelY = my + (dx / len * 6);
    return { npc, pctX: pos.x, pctY: pos.y, score, labelX, labelY };
  });

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex items-center gap-2 px-3 py-1 shrink-0" style={{ background: "rgba(78,205,196,0.06)", borderBottom: `1px solid ${COLORS.border}`, borderRadius: "12px 12px 0 0" }}>
        <span style={{ fontSize: 14 }}>💕</span>
        <h3 style={{ color: COLORS.text, fontWeight: 800, fontSize: 13 }}>관계도</h3>
        {activeFocus && activeFocus !== cn?.id && (
          <span className="ml-auto px-2 py-0.5 rounded-full" style={{ background: mapFocus ? COLORS.positive + "22" : COLORS.accent + "22", color: mapFocus ? COLORS.positive : COLORS.accent, fontSize: 10, fontWeight: 700, animation: "fadeInUp 0.3s ease" }}>
            {mapFocus ? "🗺️ " : ""}{allNpcs.find(n => n.id === activeFocus)?.name} 중심
          </span>
        )}
      </div>
      <div ref={containerRef} className="relative flex-1" style={{ background: COLORS.bgElevated, overflow: "hidden" }}>
        {/* SVG lines only */}
        <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} preserveAspectRatio="none" viewBox="0 0 100 100">
          <defs>
            <filter id="relGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="0.6" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          {nodeData.map(({ npc, pctX, pctY, score }) => {
            if (Math.abs(score) < 0.3) return null;
            const isPos = score > 0;
            const strength = Math.min(Math.abs(score) / 10, 1);
            const useGlow = Math.abs(score) >= 3;
            return (
              <line key={npc.id}
                x1={centerPos.x} y1={centerPos.y} x2={pctX} y2={pctY}
                stroke={isPos ? COLORS.positive : COLORS.negative}
                strokeWidth={Math.max(0.3, Math.min(strength * 1.2, 1.2))}
                opacity={0.25 + strength * 0.35}
                strokeDasharray={isPos ? undefined : "1.5,1"}
                strokeLinecap="round"
                filter={useGlow ? "url(#relGlow)" : undefined}
              />
            );
          })}
        </svg>
        {/* Score labels as HTML divs */}
        {nodeData.map(({ npc, score, labelX, labelY }) => {
          if (Math.abs(score) < 0.3) return null;
          const isPos = score > 0;
          const scoreText = (score >= 0 ? "+" : "") + score.toFixed(1);
          const icon = Math.abs(score) >= 5 ? (isPos ? "💕" : "💔") : Math.abs(score) >= 2 ? (isPos ? "💗" : "💢") : "";
          return (
            <div key={"lbl-" + npc.id} style={{
              position: "absolute", left: `${labelX}%`, top: `${labelY}%`, transform: "translate(-50%, -50%)",
              background: COLORS.card, border: `1px solid ${isPos ? COLORS.positive + "55" : COLORS.negative + "55"}`,
              borderRadius: 6, padding: "1px 5px", zIndex: 3, pointerEvents: "none",
              fontSize: 9, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace",
              color: isPos ? COLORS.positive : COLORS.negative, whiteSpace: "nowrap",
              boxShadow: Math.abs(score) >= 3 ? `0 0 6px ${isPos ? COLORS.positive : COLORS.negative}22` : "none"
            }}>{icon && <span style={{ fontSize: 7, marginRight: 2 }}>{icon}</span>}{scoreText}</div>
          );
        })}
        {/* Center NPC — animated position */}
        {centerNpc && (
          <div style={{ position: "absolute", left: `${centerPos.x}%`, top: `${centerPos.y}%`, transform: "translate(-50%, -50%)", zIndex: 5 }}>
            <NpcBustIcon npc={centerNpc} size={34} isCenter={true} />
          </div>
        )}
        {/* Surrounding NPCs */}
        {nodeData.map(({ npc, pctX, pctY, score }) => (
          <button key={npc.id}
            onClick={() => { setFocusNpc(npc.id); dispatch({ type: ACTION.OPEN_MODAL, payload: { modal: "relationHistory", data: { npcA: centerId, npcB: npc.id } } }); }}
            className="absolute transition-all hover:scale-110"
            style={{ left: `${pctX}%`, top: `${pctY}%`, transform: "translate(-50%, -50%)", zIndex: 4, cursor: "pointer", background: "none", border: "none", padding: 0 }}>
            <NpcBustIcon npc={npc} size={28} score={score} />
          </button>
        ))}
      </div>
    </div>
  );
}

// ── CONTROLLER PANEL — two zones: 현황(info) + 조작(actions) ──
function ControllerPanel({ state, dispatch }) {
  const vi = VERSION_ORDER.indexOf(state.currentVersion);
  const prevVi = VERSION_ORDER.indexOf(state.previousVersion || state.currentVersion);
  const canUp = vi < VERSION_ORDER.length - 1, canDown = vi > 0;
  const activeF = [], lockedF = [];
  VERSION_ORDER.forEach((v, idx) => {
    (VERSION_FEATURES[v] || []).forEach(f => {
      if (idx <= vi) activeF.push({ ...f, ver: v, isNew: idx > prevVi && idx <= vi });
      else lockedF.push({ ...f, ver: v });
    });
  });

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex items-center gap-2 px-3 py-1 shrink-0" style={{ background: "rgba(78,205,196,0.06)", borderBottom: `1px solid ${COLORS.border}`, borderRadius: "12px 12px 0 0" }}>
        <span style={{ fontSize: 13 }}>🔄</span><h3 style={{ color: COLORS.text, fontWeight: 800, fontSize: 12 }}>버전 업데이트</h3>
      </div>
      {/* ── 현황 영역 ── */}
      <div className="shrink-0" style={{ borderBottom: `1px solid ${COLORS.border}` }}>
        {/* 시간 + 버전 combined row */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 10px", background: COLORS.card }}>
          <span className="font-mono font-bold" style={{ color: COLORS.accent, fontSize: 12 }}>v{state.currentVersion}</span>
          <div className="flex gap-0.5 ml-0.5">{VERSION_ORDER.map((v, i) => (<div key={v} style={{ width: 5, height: 5, borderRadius: "50%", background: i <= vi ? COLORS.accent : COLORS.border }} />))}</div>
          {versionGte(state.currentVersion, "1.2") && <span className="ml-auto" style={{ color: COLORS.accent, fontWeight: 700, fontSize: 10 }}>💰{state.credits}</span>}
        </div>
        {/* 기능 그리드 */}
        <div className="px-2 py-1.5">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 3 }}>
            {activeF.map((f, i) => (<div key={i} className="flex flex-col items-center py-1 rounded-md relative" style={{ background: f.isNew ? COLORS.accent + "22" : COLORS.accent + "10", border: f.isNew ? `1px solid ${COLORS.accent}` : "1px solid transparent", animation: f.isNew ? "fadeInUp 0.5s ease" : "none" }}><span style={{ fontSize: 14 }}>{f.emoji}</span><span style={{ color: COLORS.text, fontSize: 10, fontWeight: 600, textAlign: "center", lineHeight: 1.2 }}>{f.label}</span>{f.isNew && <span style={{ position: "absolute", top: -3, right: -2, background: "#e74c3c", color: "#fff", fontSize: 6, fontWeight: 900, padding: "0px 3px", borderRadius: 3, lineHeight: 1.2, animation: "pulse 1.5s infinite" }}>N</span>}</div>))}
            {lockedF.map((f, i) => (<div key={`l${i}`} className="flex flex-col items-center py-1 rounded-md" style={{ background: COLORS.border + "22", opacity: 0.3 }}><span style={{ fontSize: 14 }}>🔒</span><span style={{ color: COLORS.subtext, fontSize: 10, textAlign: "center", lineHeight: 1.2 }}>{f.label}</span></div>))}
          </div>
        </div>
      </div>
      {/* ── 버전 이동 ── */}
      <div className="shrink-0" style={{ background: COLORS.bgElevated }}>
        <div className="flex gap-1.5 px-2.5 py-1.5">
          <button onClick={() => dispatch({ type: ACTION.OPEN_MODAL, payload: { modal: "versionDown" } })} disabled={!canDown}
            className="flex-1 py-1 rounded-lg font-bold disabled:opacity-25 transition-all" style={{ background: COLORS.card, color: COLORS.subtext, border: `1px solid ${COLORS.border}`, fontSize: 10 }}>◀ 버전 다운</button>
          <button onClick={() => dispatch({ type: ACTION.OPEN_MODAL, payload: { modal: "versionUp" } })} disabled={!canUp}
            className="flex-1 py-1 rounded-lg font-bold disabled:opacity-25 transition-all" style={{ background: canUp ? COLORS.accent : COLORS.border, color: canUp ? "#fff" : COLORS.subtext, border: `1px solid ${canUp ? COLORS.accent : COLORS.border}`, fontSize: 10 }}>버전 업 ▶</button>
        </div>
      </div>
    </div>
  );
}

// ── UNIFIED FEED ──
function UnifiedFeed({ state, dispatch }) {
  const ref = useRef(null);
  const isPaused = state.ui.feedPaused;
  const [filter, setFilter] = useState("all");
  const feedItems = [...state.liveFeed].reverse();
  const filtered = filter === "all" ? feedItems : filter === "events" ? feedItems.filter(it => it.type === "event" || it.type === "relationship") : filter === "dialogue" ? feedItems.filter(it => it.type === "dialogue") : feedItems.filter(it => it.type === "action");
  const ts = { action: { color: COLORS.subtext, icon: "·", bg: "transparent" }, dialogue: { color: COLORS.text, icon: "💬", bg: COLORS.card }, event: { color: COLORS.text, icon: "⚡", bg: "rgba(78,205,196,0.06)" }, relationship: { color: COLORS.positive, icon: "💕", bg: "transparent" } };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="px-3 py-1.5 shrink-0 flex items-center gap-2" style={{ borderBottom: `1px solid ${COLORS.border}`, background: "rgba(233,69,96,0.04)", borderRadius: "12px 12px 0 0" }}>
        <span style={{ fontSize: 14 }}>📡</span><h3 style={{ color: COLORS.text, fontWeight: 800, fontSize: 13 }}>라이브 로그</h3>
        <span className="font-mono" style={{ color: COLORS.subtext, fontSize: 11 }}>{state.liveFeed.length}</span>
        <div className="flex gap-1 ml-auto">
          <button onClick={() => dispatch({ type: ACTION.TOGGLE_FEED_PAUSE })} className="px-2 py-0.5 rounded-md font-bold transition-all"
            style={{ background: isPaused ? COLORS.negative + "22" : COLORS.positive + "22", color: isPaused ? COLORS.negative : COLORS.positive, border: `1px solid ${isPaused ? COLORS.negative + "44" : COLORS.positive + "44"}`, fontSize: 10 }}>
            {isPaused ? "▶ 재개" : "⏸ 정지"}
          </button>
          <button onClick={() => dispatch({ type: ACTION.CLEAR_FEED })} className="px-2 py-0.5 rounded-md transition-all" style={{ color: COLORS.subtext, border: `1px solid ${COLORS.border}`, fontSize: 10 }}>↺</button>
        </div>
      </div>
      <div className="flex shrink-0" style={{ borderBottom: `1px solid ${COLORS.border}` }}>
        {[{ id: "all", label: "전체", e: "📋" }, { id: "events", label: "이벤트", e: "⚡" }, { id: "dialogue", label: "대화", e: "💬" }, { id: "action", label: "행동", e: "🚶" }].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)} className="flex-1 flex items-center justify-center gap-1 py-2 font-bold transition-all"
            style={{ background: filter === f.id ? COLORS.accent + "12" : "transparent", color: filter === f.id ? COLORS.accent : COLORS.subtext, borderBottom: filter === f.id ? `2.5px solid ${COLORS.accent}` : "2.5px solid transparent", fontSize: 12 }}>
            <span>{f.e}</span> {f.label}
          </button>
        ))}
      </div>
      {filtered.length > 0 && (<div className="px-3 py-1 shrink-0 flex items-center" style={{ background: COLORS.accent + "08" }}>
        <span style={{ fontSize: 10, color: COLORS.accent, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>▼ 최신순</span>
        {isPaused && <span style={{ fontSize: 10, color: COLORS.negative, fontWeight: 700, marginLeft: "auto" }}>⏸ 일시정지</span>}
      </div>)}
      <div ref={ref} className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5">
        {filtered.length === 0 ? (<div className="flex flex-col items-center justify-center h-full opacity-40"><span style={{ fontSize: 28 }}>📡</span><p style={{ color: COLORS.subtext, fontSize: 13 }}>활동을 기다리는 중…</p></div>
        ) : filtered.map((it, idx) => {
          const s = ts[it.type] || ts.action;
          return (<div key={it.id} className="flex items-start gap-1.5 px-2.5 py-2 rounded-lg leading-snug"
            style={{ color: s.color, background: idx === 0 && !isPaused ? COLORS.accent + "0A" : s.bg, fontWeight: 400, fontSize: 13, borderLeft: idx === 0 && !isPaused ? `3px solid ${COLORS.accent}` : "3px solid transparent" }}>
            <span className="shrink-0 opacity-70" style={{ fontSize: 12 }}>{s.icon}</span>
            <span className="flex-1">{it.text}</span>
            {it.time && <span className="shrink-0 font-mono" style={{ fontSize: 10, color: COLORS.subtext }}>{it.time}</span>}
          </div>);
        })}
      </div>
    </div>
  );
}

// ── CONTENTS PANEL — distinct card-based layout ──
function ContentsPanel({ state, dispatch }) {
  const contents = [...state.contents].reverse();
  const [seenIds, setSeenIds] = useState(new Set());

  useEffect(() => {
    if (contents.length > 0) {
      const timer = setTimeout(() => {
        setSeenIds(prev => {
          const next = new Set(prev);
          contents.forEach(c => next.add(c.id));
          return next;
        });
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [contents.length]);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex items-center gap-2 px-3 py-1.5 shrink-0" style={{ borderBottom: `1px solid ${COLORS.border}`, background: "linear-gradient(135deg, rgba(123,97,255,0.08), rgba(233,69,96,0.04))", borderRadius: "12px 12px 0 0" }}>
        <span style={{ fontSize: 14 }}>📖</span><h3 style={{ color: COLORS.text, fontWeight: 800, fontSize: 13 }}>콘텐츠</h3>
        <span className="font-mono" style={{ color: "#7B61FF", fontSize: 11, fontWeight: 700 }}>{contents.length}</span>
        <div className="ml-auto flex items-center gap-1.5">
          {versionGte(state.currentVersion, "1.3") && (
            <button onClick={() => dispatch({ type: ACTION.OPEN_MODAL, payload: { modal: "storyExport" } })} className="flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-all hover:scale-105" style={{ background: COLORS.positive, color: "#fff", fontSize: 11 }}>
              <span style={{ fontSize: 15 }}>📥</span> 다운로드
            </button>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-2 py-2" style={{ background: "rgba(123,97,255,0.02)" }}>
        {contents.length === 0 ? (<div className="flex flex-col items-center justify-center py-6 opacity-50"><span style={{ fontSize: 22 }}>📖</span><p style={{ color: COLORS.subtext, fontSize: 12 }}>NPC 일기·SNS — Day 전환시 자동 생성</p></div>
        ) : (
          <div className="flex flex-col gap-2">
            {contents.map(c => {
              const author = getNpc(state, c.authorId); const isSns = c.type === "sns";
              const isNew = !seenIds.has(c.id);
              return (<button key={c.id} onClick={() => dispatch({ type: ACTION.OPEN_MODAL, payload: { modal: "contentDetail", data: c } })}
                className="w-full text-left rounded-xl transition-all hover:scale-[1.01]"
                style={{
                  background: isNew ? "linear-gradient(135deg, rgba(123,97,255,0.08), rgba(233,69,96,0.05))" : COLORS.card,
                  border: `1px solid ${isNew ? "rgba(123,97,255,0.3)" : COLORS.border}`,
                  padding: "10px 12px",
                  animation: isNew ? "contentSlideIn 0.6s ease forwards" : "none",
                  boxShadow: isNew ? "0 2px 12px rgba(123,97,255,0.1)" : "none",
                }}>
                <div className="flex items-center gap-2 mb-1.5">
                  <span style={{ fontSize: 20, animation: isNew ? "newGlow 1.5s ease" : "none" }}>{author?.emoji || "👤"}</span>
                  <div className="flex-1 min-w-0"><p style={{ color: COLORS.text, fontWeight: 700, fontSize: 13 }}>{author?.name || "?"}</p></div>
                  <span className="px-2 py-0.5 rounded-full" style={{ background: isSns ? "rgba(78,205,196,0.12)" : "rgba(123,97,255,0.12)", color: isSns ? "#4ecdc4" : "#7B61FF", fontSize: 10, fontWeight: 700 }}>{isSns ? "📱 SNS" : "📔 일기"}</span>
                  {isNew && <span style={{ background: "#7B61FF", color: "#fff", fontSize: 7, fontWeight: 900, padding: "1px 4px", borderRadius: 3, animation: "pulse 1.5s infinite" }}>NEW</span>}
                </div>
                <p className="line-clamp-2" style={{ color: COLORS.subtext, fontSize: 12, lineHeight: 1.5 }}>{c.text}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span style={{ color: COLORS.muted, fontSize: 9, fontFamily: "'JetBrains Mono', monospace" }}>Day {c.day}</span>
                </div>
              </button>);
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── MODALS ──
function VersionUpModal({ state, dispatch }) {
  const i = VERSION_ORDER.indexOf(state.currentVersion); const nextV = VERSION_ORDER[i + 1]; if (!nextV) return null;
  const info = VERSION_UPDATES[nextV];
  const handleApply = () => {
    dispatch({ type: ACTION.VERSION_UP });
    if (nextV === "1.2" && !(state.npcs.branded || []).find(n => n.id === "luna")) {
      dispatch({ type: ACTION.ADD_BRANDED_NPC, payload: BRANDED_NPC_LUNA });
      dispatch({ type: ACTION.ADD_FEED_ITEM, payload: { id: `f-luna-${Date.now()}`, type: "event", text: "🧥 루나(LUNA Fashion)가 Tamaverse에 체크인했습니다!", time: formatGameTime(state.simulation.gameTime), day: state.simulation.gameDay } });
      dispatch({ type: ACTION.ADD_EVENT_LOG, payload: { type: "special", title: "루나 입주", description: "LUNA Fashion 크리에이티브 디렉터 루나가 타마버스에 입주했습니다.", day: state.simulation.gameDay, time: formatGameTime(state.simulation.gameTime), npcsInvolved: ["luna"] } });
    }
    if (nextV === "1.1") dispatch({ type: ACTION.ADD_FEED_ITEM, payload: { id: `f-v11-${Date.now()}`, type: "event", text: "🎭 4F 공연장 'Stage Tamaverse'이 오픈!", time: formatGameTime(state.simulation.gameTime), day: state.simulation.gameDay } });
    // Schedule version NPCs for staggered arrival
    const vNpcs = VERSION_NPCS[nextV];
    if (vNpcs && vNpcs.length > 0) {
      const existing = [...(state.npcs.presets || []), state.npcs.custom, ...(state.npcs.branded || [])].filter(Boolean).map(n => n.id);
      const toAdd = vNpcs.filter(n => !existing.includes(n.id));
      if (toAdd.length > 0) {
        dispatch({ type: ACTION.SCHEDULE_NPC_ARRIVALS, payload: { npcs: toAdd, baseTime: state.simulation.gameTime, baseDay: state.simulation.gameDay } });
        dispatch({ type: ACTION.ADD_FEED_ITEM, payload: { id: `f-vnpc-${Date.now()}`, type: "event", text: `🏨 새로운 투숙객 ${toAdd.length}명이 체크인 예정입니다...`, time: formatGameTime(state.simulation.gameTime), day: state.simulation.gameDay } });
      }
    }
    dispatch({ type: ACTION.CLOSE_MODAL });
  };
  return (<ModalOverlay width={520} onClose={() => dispatch({ type: ACTION.CLOSE_MODAL })}><div className="rounded-2xl p-7" style={{ ...MODAL_W, background: COLORS.card, border: `2px solid ${COLORS.border}` }}>
    <p className="text-center mb-3" style={{ fontSize: 44 }}>🎉</p>
    <h3 className="font-bold text-center mb-1" style={{ color: COLORS.text, fontSize: 22 }}>{info.title}</h3>
    <p className="text-center mb-5" style={{ color: COLORS.subtext, fontSize: 14 }}>Tamaverse 업데이트</p>
    <div className="space-y-2.5 mb-6">{info.features.map((f, i) => (<div key={i} className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}` }}><span style={{ fontSize: 24, flexShrink: 0 }}>{f.emoji}</span><p style={{ color: COLORS.text, fontSize: 15 }}>{f.text}</p></div>))}</div>
    <button onClick={handleApply} className="w-full py-3.5 rounded-xl text-white font-bold transition-all hover:scale-[1.02]" style={{ background: COLORS.accent, fontSize: 16 }}>업데이트 적용 ✨</button>
    <button onClick={() => dispatch({ type: ACTION.CLOSE_MODAL })} className="w-full py-3 rounded-lg mt-2" style={{ color: COLORS.subtext, fontSize: 14 }}>취소</button>
  </div></ModalOverlay>);
}

function VersionDownModal({ state, dispatch }) {
  const i = VERSION_ORDER.indexOf(state.currentVersion); const prevV = VERSION_ORDER[i - 1]; if (!prevV) return null;
  const handleDown = () => { dispatch({ type: ACTION.VERSION_DOWN }); dispatch({ type: ACTION.ADD_FEED_ITEM, payload: { id: `f-vd-${Date.now()}`, type: "event", text: `⚙️ v${prevV}(으)로 이전버전 전환 완료`, time: formatGameTime(state.simulation.gameTime), day: state.simulation.gameDay } }); dispatch({ type: ACTION.CLOSE_MODAL }); };
  return (<ModalOverlay width={520} onClose={() => dispatch({ type: ACTION.CLOSE_MODAL })}><div className="rounded-2xl p-7" style={{ ...MODAL_W, background: COLORS.card, border: `2px solid ${COLORS.border}` }}>
    <p className="text-center mb-3" style={{ fontSize: 44 }}>⚠️</p>
    <h3 className="font-bold text-center mb-2" style={{ color: COLORS.text, fontSize: 20 }}>이전 버전으로 되돌리기</h3>
    <p className="text-center mb-2" style={{ color: COLORS.subtext, fontSize: 15 }}>v{state.currentVersion} → v{prevV}</p>
    <p className="text-center mb-5 px-4 py-3 rounded-lg" style={{ background: COLORS.eventHighlight, color: COLORS.text, fontSize: 13 }}>데이터는 보존되며, v{prevV} 이후 기능이 숨겨집니다.{parseFloat(state.currentVersion) >= 1.2 && parseFloat(prevV) < 1.2 && " 루나가 외출로 표시됩니다."}</p>
    <div className="flex gap-3"><button onClick={() => dispatch({ type: ACTION.CLOSE_MODAL })} className="flex-1 py-3 rounded-lg" style={{ background: COLORS.border + "66", color: COLORS.subtext, fontSize: 14 }}>취소</button><button onClick={handleDown} className="flex-1 py-3 rounded-lg font-bold text-white" style={{ background: COLORS.negative, fontSize: 14 }}>되돌리기</button></div>
  </div></ModalOverlay>);
}

function StoryExportModal({ state, dispatch }) {
  const [selected, setSelected] = useState([]); const [preview, setPreview] = useState("");
  const opts = [{ id: "timeline", label: "📋 전체 타임라인", desc: "Day 1부터 시간순" }, { id: "npcArc", label: "👤 NPC별 아크", desc: "개인 여정" }, { id: "relationship", label: "💕 관계 스토리라인", desc: "관계 발전사" }, { id: "highlight", label: "✨ 콘텐츠 하이라이트", desc: "인기 SNS·일기 모음" }, { id: "ipExtend", label: "🎬 IP 확장 추천", desc: "TOP 3 + 포맷" }];
  const toggle = id => setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const gen = () => { let md = `# 🏨 Tamaverse 스토리북\n> ${state.simulation.gameDay}일 | v${state.currentVersion} | ${getAllNpcs(state).length}명\n---\n`;
    if (selected.includes("timeline")) { md += "## 📋 타임라인\n"; state.eventLog.forEach(ev => { md += `- [D${ev.day} ${ev.time}] ${ev.title}: ${ev.description}\n`; }); md += "\n"; }
    if (selected.includes("npcArc")) { md += "## 👤 NPC 아크\n"; getAllNpcs(state).forEach(n => { md += `### ${n.emoji} ${n.name}\n`; const c = state.contents.filter(x => x.authorId === n.id); c.forEach(x => { md += `- ${x.type === "diary" ? "일기" : "SNS"} Day ${x.day}\n`; }); md += "\n"; }); }
    if (selected.includes("relationship")) { md += "## 💕 관계\n"; state.relationships.filter(r => r.history.length > 0).forEach(r => { const a = getNpc(state, r.npcA), b = getNpc(state, r.npcB); if (a && b) { md += `### ${a.name} ↔ ${b.name} (${r.score.toFixed(1)})\n`; r.history.forEach(h => { md += `- ${h.event} (${h.change >= 0 ? "+" : ""}${h.change})\n`; }); md += "\n"; } }); }
    if (selected.includes("highlight")) {
      md += "## ✨ 콘텐츠 하이라이트\n";
      const sorted = [...state.contents].sort((a, b) => (b.likes || 0) - (a.likes || 0));
      const top = sorted.slice(0, 10);
      if (top.length === 0) { md += "_아직 생성된 콘텐츠가 없습니다._\n\n"; }
      else {
        top.forEach((c, i) => {
          const npc = getNpc(state, c.authorId);
          const icon = c.type === "diary" ? "📔" : "📱";
          md += `### ${i + 1}. ${icon} ${npc ? npc.emoji + " " + npc.name : "?"} — Day ${c.day}\n`;
          md += `> ${(c.text || "").slice(0, 120)}${(c.text || "").length > 120 ? "..." : ""}\n`;
          if (c.likes) md += `❤️ ${c.likes}`;
          if (c.richData?.mood) md += ` | 기분: ${c.richData.mood}`;
          md += "\n\n";
        });
      }
    }
    if (selected.includes("ipExtend")) { md += "## 🎬 IP 확장 추천\n"; md += "- 웹드라마: Tamaverse 시즌 1\n- 캐릭터 굿즈: 아크릴 스탠드\n- OST 앨범: Tamaverse Sound Collection\n\n"; }
    setPreview(md);
  };
  return (<ModalOverlay width={520} onClose={() => dispatch({ type: ACTION.CLOSE_MODAL })}><div className="rounded-2xl p-7" style={{ ...MODAL_W, maxHeight: "85vh", overflowY: "auto", background: COLORS.card, border: `2px solid ${COLORS.border}` }}>
    <h3 className="font-bold text-center mb-5" style={{ color: COLORS.text, fontSize: 22 }}>📤 스토리 내보내기</h3>
    <div className="space-y-2 mb-5">{opts.map(o => (<button key={o.id} onClick={() => toggle(o.id)} className="w-full flex items-start gap-3 px-4 py-3 rounded-xl text-left" style={{ background: selected.includes(o.id) ? COLORS.accent + "15" : COLORS.bg, border: `2px solid ${selected.includes(o.id) ? COLORS.accent : COLORS.border}` }}><span style={{ fontSize: 20 }}>{o.label.split(" ")[0]}</span><div><p style={{ color: COLORS.text, fontSize: 15, fontWeight: 600 }}>{o.label.substring(o.label.indexOf(" ") + 1)}</p><p style={{ color: COLORS.subtext, fontSize: 13 }}>{o.desc}</p></div></button>))}</div>
    {!preview ? (<button onClick={gen} disabled={selected.length === 0} className="w-full py-3.5 rounded-xl text-white font-bold disabled:opacity-40" style={{ background: COLORS.accent, fontSize: 16 }}>미리보기 생성</button>
    ) : (<div><div className="rounded-xl p-4 mb-4 overflow-y-auto" style={{ maxHeight: 300, background: COLORS.bg, border: `1px solid ${COLORS.border}`, whiteSpace: "pre-wrap", fontSize: 12, color: COLORS.text, fontFamily: "monospace" }}>{preview}</div><button onClick={() => navigator.clipboard?.writeText(preview)} className="w-full py-3.5 rounded-xl text-white font-bold" style={{ background: COLORS.positive, fontSize: 16 }}>📋 복사</button></div>)}
    <button onClick={() => dispatch({ type: ACTION.CLOSE_MODAL })} className="w-full py-3 rounded-lg mt-2" style={{ color: COLORS.subtext, fontSize: 14 }}>닫기</button>
  </div></ModalOverlay>);
}

function ExternalShareModal({ state, dispatch }) {
  const item = state.ui.modalData; if (!item) return null;
  const ch = [{ id: "tw", emoji: "🐦", name: "Twitter/X", p: `[Tamaverse] ${item.text}` }, { id: "ig", emoji: "📷", name: "Instagram", p: `🏨 Tamaverse\n${item.text}` }, { id: "yt", emoji: "▶️", name: "YouTube", p: item.text }];
  return (<ModalOverlay width={520} onClose={() => dispatch({ type: ACTION.CLOSE_MODAL })}><div className="rounded-2xl p-6" style={{ ...MODAL_W, background: COLORS.card, border: `2px solid ${COLORS.border}` }}>
    <h3 className="font-bold mb-4" style={{ color: COLORS.text, fontSize: 18 }}>📤 외부 송출</h3>
    <div className="space-y-2 mb-4">{ch.map(c => (<div key={c.id} className="flex items-start gap-3 px-3 py-3 rounded-xl" style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}` }}><span style={{ fontSize: 22 }}>{c.emoji}</span><div className="flex-1 min-w-0"><p style={{ color: COLORS.text, fontSize: 14, fontWeight: 600 }}>{c.name}</p><p className="truncate" style={{ color: COLORS.subtext, fontSize: 12 }}>{c.p}</p></div><button onClick={() => navigator.clipboard?.writeText(c.p)} className="shrink-0 px-3 py-1.5 rounded-lg" style={{ background: COLORS.accent, color: "#fff", fontSize: 13 }}>복사</button></div>))}</div>
    <button onClick={() => dispatch({ type: ACTION.CLOSE_MODAL })} className="w-full py-2.5 rounded-lg" style={{ color: COLORS.subtext, fontSize: 14 }}>닫기</button>
  </div></ModalOverlay>);
}

function EmptyState({ icon, title, sub }) {
  return (<div className="flex flex-col items-center justify-center h-full text-center py-10" style={{ color: COLORS.subtext }}><span style={{ fontSize: 40 }} className="mb-3">{icon}</span><p style={{ fontSize: 16, fontWeight: 600 }} className="mb-1">{title}</p><p style={{ fontSize: 13 }} className="opacity-70">{sub}</p></div>);
}

// ── SIM HEADER ──
function SimHeader({ state }) {
  return (
    <header className="flex items-center justify-between px-5 shrink-0" style={{ height: 48, background: COLORS.bgElevated, borderBottom: `1px solid ${COLORS.border}` }}>
      <div className="flex items-center gap-2"><span style={{ fontSize: 20 }}>🏨</span><span style={{ color: COLORS.text, fontWeight: 800, fontSize: 17, fontFamily: "'Playfair Display', serif", background: "linear-gradient(135deg, #e94560, #ff6b6b)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: 1 }}>Tamaverse</span></div>
      <div className="flex items-center gap-3">
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: COLORS.accent, fontSize: 13, padding: "2px 8px", background: "rgba(233,69,96,0.12)", borderRadius: 20, border: "1px solid rgba(233,69,96,0.25)" }}>v{state.currentVersion}</span>
        {versionGte(state.currentVersion, "1.2") && <span style={{ fontFamily: "'JetBrains Mono', monospace", color: COLORS.expansion, fontWeight: 700, fontSize: 13 }}>💰 {state.credits} 샤드</span>}
      </div>
    </header>
  );
}

// ── SIMULATION SCREEN ──
const PANEL_STYLE = { background: COLORS.card, borderRadius: 12, border: `1px solid ${COLORS.border}`, boxShadow: "none" };
const PANEL_HEADER = (color) => ({ background: color || "rgba(233,69,96,0.06)", borderBottom: `1px solid ${COLORS.border}`, borderRadius: "12px 12px 0 0" });

function SimulationScreen({ state, dispatch }) {
  useSimulationEngine(state, dispatch);
  const GAP = 6;
  return (
    <div className="flex flex-col h-screen" style={{ background: COLORS.bg }}>
      <SimHeader state={state} dispatch={dispatch} />
      <div className="flex flex-1 min-h-0" style={{ padding: GAP, gap: GAP }}>
        {/* LEFT — 4 panels: NPC / Directive / Relationships / Version Update */}
        <div className="shrink-0 flex flex-col" style={{ width: "24%", gap: GAP }}>
          <div className="flex flex-col overflow-hidden" style={{ ...PANEL_STYLE, flex: "1 1 30%" }}>
            <NpcPanel state={state} dispatch={dispatch} />
          </div>
          <div className="flex flex-col overflow-hidden" style={{ ...PANEL_STYLE, flex: "0 0 auto" }}>
            <DirectivePanel state={state} dispatch={dispatch} />
          </div>
          <div className="flex flex-col overflow-hidden" style={{ ...PANEL_STYLE, flex: "1 1 30%" }}>
            <RelationshipsPanel state={state} dispatch={dispatch} />
          </div>
          <div className="flex flex-col overflow-hidden" style={{ ...PANEL_STYLE, flex: "0 0 auto" }}>
            <ControllerPanel state={state} dispatch={dispatch} />
          </div>
        </div>
        {/* CENTER — Map (with integrated floor tabs + amenities) */}
        <div className="flex-1 flex flex-col" style={{ gap: GAP }}>
          <div className="flex-1 flex flex-col overflow-hidden" style={{ ...PANEL_STYLE }}>
            <MapViewer state={state} dispatch={dispatch} />
          </div>
        </div>
        {/* RIGHT — Contents + LiveFeed — fixed proportions */}
        <div className="shrink-0 flex flex-col" style={{ width: "26%", gap: GAP }}>
          <div className="flex flex-col overflow-hidden" style={{ ...PANEL_STYLE, flex: "2 0 0", minHeight: 0 }}>
            <ContentsPanel state={state} dispatch={dispatch} />
          </div>
          <div className="flex flex-col overflow-hidden" style={{ ...PANEL_STYLE, flex: "3 0 0", minHeight: 0 }}>
            <UnifiedFeed state={state} dispatch={dispatch} />
          </div>
        </div>
      </div>
      {state.ui.modalOpen === "behaviorDirective" && <BehaviorDirectiveModal state={state} dispatch={dispatch} />}
      {state.ui.modalOpen === "suitcase" && <SuitcaseModal state={state} dispatch={dispatch} />}
      {state.ui.modalOpen === "relationHistory" && <RelationHistoryModal state={state} dispatch={dispatch} />}
      {state.ui.modalOpen === "contentDetail" && <ContentDetailModal state={state} dispatch={dispatch} />}
      {state.ui.modalOpen === "versionUp" && <VersionUpModal state={state} dispatch={dispatch} />}
      {state.ui.modalOpen === "versionDown" && <VersionDownModal state={state} dispatch={dispatch} />}
      {state.ui.modalOpen === "storyExport" && <StoryExportModal state={state} dispatch={dispatch} />}
      {state.ui.modalOpen === "externalShare" && <ExternalShareModal state={state} dispatch={dispatch} />}
      {state.ui.modalOpen === "floorPlan" && <FloorPlanModal state={state} dispatch={dispatch} />}
      {state.ui.modalOpen === "miniApp" && <MiniAppModal state={state} dispatch={dispatch} />}
    </div>
  );
}

// ═══════════════════════════════════════════════
// 11. 루트 컴포넌트
// ═══════════════════════════════════════════════

export default function TamaverseApp() {
  const [state, dispatch] = useReducer(gameReducer, INITIAL_STATE);
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700;900&family=Playfair+Display:wght@700&family=JetBrains+Mono:wght@300;400;500;700&display=swap');
        @keyframes fadeInUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        @keyframes pulse { 0%,100% { opacity:0.15; } 50% { opacity:0.5; } }
        @keyframes pixelBounce { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-2px); } }
        @keyframes contentSlideIn { from { opacity:0; transform:translateX(-20px); max-height:0; } to { opacity:1; transform:translateX(0); max-height:200px; } }
        @keyframes newGlow { 0% { box-shadow: 0 0 0 0 rgba(233,69,96,0.4); } 70% { box-shadow: 0 0 0 8px rgba(233,69,96,0); } 100% { box-shadow: 0 0 0 0 rgba(233,69,96,0); } }
        @keyframes titleGlow { 0%,100% { filter: drop-shadow(0 0 8px rgba(233,69,96,0.3)); } 50% { filter: drop-shadow(0 0 20px rgba(233,69,96,0.6)); } }
        @keyframes bgRotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes gridPulse { 0%,100% { opacity:0.4; } 50% { opacity:0.7; } }
        * { box-sizing:border-box; }
        body { margin:0; padding:0; font-family:'Noto Sans KR',-apple-system,'Segoe UI',sans-serif; background:#1a1a2e; color:#f5f5f5; -webkit-font-smoothing:antialiased; }
        ::-webkit-scrollbar { width:5px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.12); border-radius:3px; }
        ::-webkit-scrollbar-thumb:hover { background:rgba(255,255,255,0.2); }
        .line-clamp-2 { display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
        .df-mono { font-family:'JetBrains Mono',monospace; }
        .df-display { font-family:'Playfair Display',serif; }
        .dir-grid::-webkit-scrollbar { display:none; }
        .dir-scroll::-webkit-scrollbar { display:none; }
        @keyframes casterMouth { 0%,40% { height:5px; width:6px; border-radius:2px 2px 4px 4px; } 50%,90% { height:2px; width:4px; border-radius:4px; } 100% { height:5px; width:6px; } }
      `}</style>
      {state.appPhase === "intro" && <IntroScreen dispatch={dispatch} />}
      {state.appPhase === "worldbuilding" && <WorldbuildingScreen dispatch={dispatch} />}
      {state.appPhase === "casting" && <CastingFlow state={state} dispatch={dispatch} />}
      {state.appPhase === "simulation" && <SimulationScreen state={state} dispatch={dispatch} />}
    </>
  );
}
