const STORAGE_KEY = "aice-cbt-study-state-v2";
const LEGACY_KEY = "aice-cbt-study-state";
const ACTIVE_MOCK_KEY = "aice-cbt-active-mock-v1";
const CURRENT_RESULT_KEY = "aice-cbt-current-result-v1";

const createInitialState = () => ({
  version: 2,
  learnAttempts: [],
  mockAttempts: [],
  wrongNotes: {},
  retryState: {},
  archivedAttempts: []
});

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeState(raw) {
  const base = createInitialState();
  if (!isPlainObject(raw)) return base;
  return {
    version: 2,
    learnAttempts: Array.isArray(raw.learnAttempts) ? raw.learnAttempts : [],
    mockAttempts: Array.isArray(raw.mockAttempts) ? raw.mockAttempts : [],
    wrongNotes: isPlainObject(raw.wrongNotes) ? raw.wrongNotes : {},
    retryState: isPlainObject(raw.retryState) ? raw.retryState : {},
    archivedAttempts: Array.isArray(raw.archivedAttempts) ? raw.archivedAttempts : []
  };
}

function safelyParse(value) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function migrateLegacyState() {
  const legacy = safelyParse(localStorage.getItem(LEGACY_KEY));
  const migrated = createInitialState();
  if (!isPlainObject(legacy)) return migrated;

  // 초기 버전은 학습·모의고사 기록을 구분하지 않았으므로 통계에 섞지 않고 보관합니다.
  migrated.archivedAttempts = Array.isArray(legacy.attempts) ? legacy.attempts : [];
  migrated.wrongNotes = isPlainObject(legacy.wrongNotes) ? legacy.wrongNotes : {};
  return migrated;
}

export function getState() {
  const saved = safelyParse(localStorage.getItem(STORAGE_KEY));
  if (saved) return normalizeState(saved);

  const migrated = migrateLegacyState();
  saveState(migrated);
  return migrated;
}

export function saveState(nextState) {
  const normalized = normalizeState(nextState);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
}

function updateState(updater) {
  const state = getState();
  const nextState = updater(state) ?? state;
  return saveState(nextState);
}

function capRecords(records, maximum = 300) {
  return records.length > maximum ? records.slice(-maximum) : records;
}

export function saveLearnAttempt(attempt) {
  return updateState((state) => {
    state.learnAttempts = capRecords([...state.learnAttempts, attempt]);
    return state;
  });
}

export function saveMockAttempt(attempt) {
  return updateState((state) => {
    state.mockAttempts = capRecords([...state.mockAttempts, attempt], 100);
    return state;
  });
}

export function saveWrongNote(questionId, patch = {}) {
  return updateState((state) => {
    const previous = isPlainObject(state.wrongNotes[questionId]) ? state.wrongNotes[questionId] : {};
    const previousSources = Array.isArray(previous.sources) ? previous.sources : [];
    const patchSources = Array.isArray(patch.sources) ? patch.sources : [];
    state.wrongNotes[questionId] = {
      savedAt: previous.savedAt ?? Date.now(),
      memo: "",
      completed: false,
      ...previous,
      ...patch,
      sources: [...new Set([...previousSources, ...patchSources])]
    };
    return state;
  });
}

export function setWrongComplete(questionId, completed) {
  return saveWrongNote(questionId, { completed: Boolean(completed), completedAt: completed ? Date.now() : null });
}

export function saveRetryState(questionId, patch = {}) {
  return updateState((state) => {
    const previous = isPlainObject(state.retryState[questionId]) ? state.retryState[questionId] : {};
    state.retryState[questionId] = { ...previous, ...patch };
    return state;
  });
}

export function getPendingWrongCount(state = getState()) {
  return Object.values(state.wrongNotes).filter((note) => !note.completed).length;
}

export function saveActiveMock(activeMock) {
  sessionStorage.setItem(ACTIVE_MOCK_KEY, JSON.stringify(activeMock));
}

export function getActiveMock() {
  const value = safelyParse(sessionStorage.getItem(ACTIVE_MOCK_KEY));
  return isPlainObject(value) ? value : null;
}

export function clearActiveMock() {
  sessionStorage.removeItem(ACTIVE_MOCK_KEY);
}

export function saveCurrentResult(result) {
  sessionStorage.setItem(CURRENT_RESULT_KEY, JSON.stringify(result));
}

export function getCurrentResult() {
  const value = safelyParse(sessionStorage.getItem(CURRENT_RESULT_KEY));
  return isPlainObject(value) ? value : null;
}
