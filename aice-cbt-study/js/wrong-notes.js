import { createChoiceList, createElement, gradeQuestion, initializeCommon, preparePage } from "./common.js";
import { reviewedQuestions } from "./questions.js";
import { getState, saveRetryState, saveWrongNote, setWrongComplete } from "./storage.js";

const root = document.querySelector("[data-wrong-root]");
const filterRoot = document.querySelector("[data-wrong-filters]");
const summaryRoot = document.querySelector("[data-wrong-summary]");
const openRetries = new Set();
let selectedFilter = "pending";

const filterOptions = [
  ["pending", "복습 필요"],
  ["all", "전체"],
  ["completed", "완료"]
];

function renderFilters() {
  filterRoot.replaceChildren();
  filterOptions.forEach(([value, label]) => {
    const button = createElement("button", {
      className: `segment${selectedFilter === value ? " active" : ""}`,
      text: label,
      attributes: { type: "button", "aria-pressed": selectedFilter === value }
    });
    button.addEventListener("click", () => {
      selectedFilter = value;
      renderFilters();
      renderWrongNotes();
    });
    filterRoot.append(button);
  });
}

function getWrongEntries() {
  const state = getState();
  return reviewedQuestions
    .filter((question) => state.wrongNotes[question.id])
    .map((question) => ({ question, note: state.wrongNotes[question.id], retry: state.retryState[question.id] ?? {} }))
    .filter(({ note }) => {
      if (selectedFilter === "pending") return !note.completed;
      if (selectedFilter === "completed") return Boolean(note.completed);
      return true;
    });
}

function createRetryPanel(question, retry) {
  const panel = createElement("section", { className: "retry-panel" });
  panel.hidden = !openRetries.has(question.id);
  panel.append(createElement("h3", { text: "다시 풀기" }));

  let submitButton;
  const selected = Array.isArray(retry.selected) ? retry.selected : [];
  const choices = createChoiceList(question, selected, {
    name: `retry-${question.id}`,
    disabled: Boolean(retry.submitted),
    correctAnswer: retry.submitted ? question.answer[0] : undefined,
    wrongAnswer: retry.submitted && !retry.correct ? selected[0] : undefined,
    onSelect: (nextSelected) => {
      saveRetryState(question.id, { selected: nextSelected, submitted: false });
      if (submitButton) submitButton.disabled = false;
    }
  });
  panel.append(choices);

  if (retry.submitted) {
    const feedback = createElement("div", { className: `retry-feedback ${retry.correct ? "correct" : "incorrect"}` });
    feedback.append(
      createElement("strong", { text: retry.correct ? "정답이에요." : "다시 확인해 볼 개념이에요." }),
      createElement("p", { text: question.explanation })
    );
    panel.append(feedback);
  } else {
    submitButton = createElement("button", { className: "button primary small", text: "답안 제출", attributes: { type: "button" } });
    submitButton.disabled = selected.length === 0;
    submitButton.addEventListener("click", () => {
      const latest = getState().retryState[question.id] ?? {};
      const latestSelected = Array.isArray(latest.selected) ? latest.selected : [];
      if (!latestSelected.length) return;
      const correct = gradeQuestion(question, latestSelected);
      saveRetryState(question.id, {
        selected: latestSelected,
        submitted: true,
        correct,
        attempts: (latest.attempts ?? 0) + 1,
        lastAttemptAt: Date.now()
      });
      if (correct) saveWrongNote(question.id, { lastCorrectRetryAt: Date.now() });
      renderWrongNotes();
    });
    panel.append(createElement("div", { className: "button-row" }));
    panel.lastElementChild.append(submitButton);
  }
  return panel;
}

function createWrongCard({ question, note, retry }) {
  const card = createElement("article", { className: `wrong-card${note.completed ? " completed" : ""}` });
  const head = createElement("div", { className: "wrong-head" });
  const questionInfo = createElement("div");
  const meta = createElement("div", { className: "meta-group" });
  meta.append(createElement("span", { className: "tag", text: question.topic }), createElement("span", { className: "tag neutral", text: question.id }));
  questionInfo.append(meta, createElement("h2", { text: question.stem }));
  head.append(questionInfo, createElement("span", { className: "status-pill", text: note.completed ? "복습 완료" : "복습 필요" }));

  const content = createElement("div", { className: "wrong-content" });
  const memoArea = createElement("div");
  const label = createElement("label", { className: "memo-label", text: "내가 헷갈린 이유 메모" });
  const textarea = createElement("textarea", {
    className: "wrong-memo",
    attributes: { placeholder: "예: 결측치 처리 순서를 헷갈림", maxlength: 500, "aria-label": `${question.id} 오답 메모` }
  });
  textarea.value = typeof note.memo === "string" ? note.memo : "";
  textarea.addEventListener("change", () => saveWrongNote(question.id, { memo: textarea.value }));
  label.append(textarea);
  memoArea.append(label);

  const actions = createElement("div", { className: "wrong-actions" });
  const retryButton = createElement("button", { className: "button secondary small", text: "다시 풀기", attributes: { type: "button" } });
  retryButton.addEventListener("click", () => {
    saveRetryState(question.id, { selected: [], submitted: false, correct: false });
    openRetries.add(question.id);
    renderWrongNotes();
  });
  const completeButton = createElement("button", {
    className: "button ghost small",
    text: note.completed ? "완료 취소" : "복습 완료 표시",
    attributes: { type: "button" }
  });
  completeButton.addEventListener("click", () => {
    setWrongComplete(question.id, !note.completed);
    renderWrongNotes();
  });
  actions.append(retryButton, completeButton);
  content.append(memoArea, actions);

  card.append(head, content, createRetryPanel(question, retry));
  return card;
}

function renderEmpty() {
  const card = createElement("section", { className: "empty-state" });
  const isAllEmpty = Object.keys(getState().wrongNotes).length === 0;
  card.append(
    createElement("div", { className: "empty-icon", text: "✓", attributes: { "aria-hidden": "true" } }),
    createElement("h2", { text: isAllEmpty ? "아직 저장된 오답이 없어요." : "이 조건에 해당하는 오답이 없어요." }),
    createElement("p", { text: isAllEmpty ? "학습이나 모의고사에서 틀린 문제는 이곳에 자동으로 모입니다." : "다른 필터에서 저장된 오답을 확인해 보세요." })
  );
  if (isAllEmpty) card.append(createElement("a", { className: "button primary", text: "문제 풀기", attributes: { href: "learn.html" } }));
  root.replaceChildren(card);
}

function renderWrongNotes() {
  initializeCommon();
  const entries = getWrongEntries();
  const allNotes = Object.values(getState().wrongNotes);
  const pendingCount = allNotes.filter((note) => !note.completed).length;
  summaryRoot.textContent = `전체 ${allNotes.length}개 · 복습 필요 ${pendingCount}개`;
  if (!entries.length) {
    renderEmpty();
    return;
  }
  const list = createElement("div", { className: "wrong-list" });
  entries.forEach((entry) => list.append(createWrongCard(entry)));
  root.replaceChildren(list);
}

preparePage(root, () => {
  renderFilters();
  renderWrongNotes();
});
