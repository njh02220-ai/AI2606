class MemoryStorage {
  constructor() {
    this.store = new Map();
  }

  getItem(key) {
    return this.store.has(key) ? this.store.get(key) : null;
  }

  setItem(key, value) {
    this.store.set(key, String(value));
  }

  removeItem(key) {
    this.store.delete(key);
  }
}

globalThis.localStorage = new MemoryStorage();
globalThis.sessionStorage = new MemoryStorage();

localStorage.setItem("aice-cbt-study-state", JSON.stringify({
  attempts: [{ correctCount: 2, total: 5 }],
  wrongNotes: { "BAS-001": { memo: "legacy memo" } }
}));

const { reviewedQuestions } = await import("../js/questions.js");
const { gradeQuestion, validateQuestionBank } = await import("../js/common.js");
const storage = await import("../js/storage.js");

const errors = validateQuestionBank(reviewedQuestions);
if (errors.length) throw new Error(`문제 데이터 검증 실패: ${errors.join("; ")}`);
if (!gradeQuestion(reviewedQuestions[0], reviewedQuestions[0].answer)) throw new Error("정답 채점 실패");
if (gradeQuestion(reviewedQuestions[0], [0])) throw new Error("오답 채점 실패");

const migrated = storage.getState();
if (migrated.mockAttempts.length || migrated.learnAttempts.length || migrated.archivedAttempts.length !== 1) {
  throw new Error("기존 혼합 기록 분리 실패");
}

storage.saveLearnAttempt({ questionId: "BAS-001", correct: false, createdAt: 1 });
storage.saveMockAttempt({ id: "mock-1", correctCount: 1, total: 5, details: [], createdAt: 2 });
storage.saveWrongNote("BAS-001", { memo: "<img src=x onerror=alert(1)>", sources: ["learn"] });
storage.saveRetryState("BAS-001", { selected: [1], submitted: true, correct: true });

const state = storage.getState();
if (state.learnAttempts.length !== 1 || state.mockAttempts.length !== 1) throw new Error("기록 분리 저장 실패");
if (state.wrongNotes["BAS-001"].memo !== "<img src=x onerror=alert(1)>") throw new Error("메모 저장 실패");
if (!state.retryState["BAS-001"].correct) throw new Error("재풀이 상태 저장 실패");

console.log(JSON.stringify({
  questions: reviewedQuestions.length,
  validationErrors: errors.length,
  learnRecords: state.learnAttempts.length,
  mockRecords: state.mockAttempts.length,
  pendingWrong: storage.getPendingWrongCount(state),
  legacyArchived: state.archivedAttempts.length
}));
