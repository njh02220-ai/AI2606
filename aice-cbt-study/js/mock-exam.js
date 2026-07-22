import { createChoiceList, createElement, formatDuration, gradeQuestion, preparePage } from "./common.js";
import { reviewedQuestions } from "./questions.js";
import {
  clearActiveMock,
  getActiveMock,
  saveActiveMock,
  saveCurrentResult,
  saveMockAttempt,
  saveWrongNote
} from "./storage.js";

const root = document.querySelector("[data-mock-root]");
const EXAM_DURATION_SECONDS = 10 * 60;
let activeMock = getActiveMock();
let timerId = null;

function createNewMock() {
  return {
    startedAt: Date.now(),
    currentIndex: 0,
    answers: {},
    questionIds: reviewedQuestions.map((question) => question.id)
  };
}

function isValidActiveMock(value) {
  return value
    && Number.isFinite(value.startedAt)
    && Number.isInteger(value.currentIndex)
    && value.answers
    && typeof value.answers === "object"
    && Array.isArray(value.questionIds)
    && value.questionIds.join("|") === reviewedQuestions.map((question) => question.id).join("|");
}

function remainingSeconds() {
  if (!activeMock) return EXAM_DURATION_SECONDS;
  const elapsed = Math.floor((Date.now() - activeMock.startedAt) / 1000);
  return Math.max(0, EXAM_DURATION_SECONDS - elapsed);
}

function persistActiveMock() {
  if (activeMock) saveActiveMock(activeMock);
}

function handleBeforeUnload(event) {
  if (!activeMock) return;
  event.preventDefault();
  event.returnValue = "";
}

window.addEventListener("beforeunload", handleBeforeUnload);

function startTimer() {
  clearInterval(timerId);
  timerId = window.setInterval(() => {
    const remaining = remainingSeconds();
    const timer = document.querySelector("[data-timer]");
    if (timer) timer.textContent = formatDuration(remaining);
    if (remaining <= 0) finishExam(true);
  }, 1000);
}

function renderStart() {
  clearInterval(timerId);
  root.replaceChildren();
  const card = createElement("section", { className: "start-card" });
  card.append(
    createElement("p", { className: "eyebrow", text: "READY" }),
    createElement("h2", { text: "모의고사를 시작할까요?" }),
    createElement("p", { text: "문제를 모두 푼 뒤 제출하면 점수와 문항별 해설을 확인할 수 있어요." })
  );
  const details = createElement("div", { className: "start-details" });
  [["문항 수", `${reviewedQuestions.length}문제`], ["제한 시간", "10분"], ["정답 공개", "제출 후"]].forEach(([label, value]) => {
    const item = createElement("div");
    item.append(createElement("strong", { text: value }), createElement("small", { text: label }));
    details.append(item);
  });
  const start = createElement("button", { className: "button primary", text: "모의고사 시작", attributes: { type: "button" } });
  start.addEventListener("click", () => {
    activeMock = createNewMock();
    persistActiveMock();
    startTimer();
    renderExam();
  });
  card.append(details, start);
  root.append(card);
}

function createQuestionMap() {
  const map = createElement("aside", { className: "question-map", attributes: { "aria-label": "문항 이동" } });
  map.append(createElement("h2", { text: "문항 바로가기" }));
  const grid = createElement("div", { className: "number-grid" });
  reviewedQuestions.forEach((question, index) => {
    const answered = Array.isArray(activeMock.answers[question.id]) && activeMock.answers[question.id].length > 0;
    const button = createElement("button", {
      className: `number-button${answered ? " answered" : ""}${index === activeMock.currentIndex ? " current" : ""}`,
      text: index + 1,
      attributes: { type: "button", "aria-label": `${index + 1}번 문제${answered ? ", 답변 완료" : ", 미응답"}` }
    });
    button.addEventListener("click", () => {
      activeMock.currentIndex = index;
      persistActiveMock();
      renderExam();
    });
    grid.append(button);
  });
  map.append(grid, createElement("p", { text: "파란 숫자는 답변한 문항이에요." }));
  return map;
}

function requestSubmit() {
  const unanswered = reviewedQuestions.filter((question) => !(activeMock.answers[question.id]?.length)).length;
  const message = unanswered
    ? `아직 답하지 않은 문제가 ${unanswered}개 있어요. 그대로 제출할까요?`
    : "모든 답안을 제출할까요? 제출 후에는 답을 바꿀 수 없어요.";
  if (window.confirm(message)) finishExam(false);
}

function finishExam(autoSubmitted) {
  if (!activeMock) return;
  clearInterval(timerId);

  const finishedAt = Date.now();
  const details = reviewedQuestions.map((question) => {
    const selected = activeMock.answers[question.id] ?? [];
    return { questionId: question.id, selected, correct: gradeQuestion(question, selected) };
  });
  const correctCount = details.filter((detail) => detail.correct).length;
  const total = reviewedQuestions.length;
  const attempt = {
    id: `mock-${finishedAt}`,
    correctCount,
    total,
    scorePercent: Math.round((correctCount / total) * 100),
    durationSeconds: Math.min(EXAM_DURATION_SECONDS, Math.max(0, Math.floor((finishedAt - activeMock.startedAt) / 1000))),
    autoSubmitted,
    details,
    createdAt: finishedAt
  };

  details.filter((detail) => !detail.correct).forEach((detail) => {
    saveWrongNote(detail.questionId, { lastWrongAt: finishedAt, completed: false, sources: ["mock"] });
  });
  saveMockAttempt(attempt);
  saveCurrentResult(attempt);
  activeMock = null;
  clearActiveMock();
  window.location.href = "result.html";
}

function renderExam() {
  if (!activeMock) {
    renderStart();
    return;
  }
  if (remainingSeconds() <= 0) {
    finishExam(true);
    return;
  }

  activeMock.currentIndex = Math.min(Math.max(activeMock.currentIndex, 0), reviewedQuestions.length - 1);
  const question = reviewedQuestions[activeMock.currentIndex];
  const selected = activeMock.answers[question.id] ?? [];
  const answeredCount = reviewedQuestions.filter((item) => activeMock.answers[item.id]?.length).length;
  root.replaceChildren();

  const status = createElement("div", { className: "exam-status" });
  const statusGroup = createElement("div", { className: "exam-status-group" });
  const timerLabel = createElement("span", { className: "timer" });
  timerLabel.append("남은 시간 ", createElement("span", { text: formatDuration(remainingSeconds()), attributes: { "data-timer": "" } }));
  statusGroup.append(
    createElement("span", { className: "tag", text: "시험 진행 중" }),
    timerLabel,
    createElement("span", { className: "answered-count", text: `답변 ${answeredCount}/${reviewedQuestions.length}` })
  );
  const submit = createElement("button", { className: "button danger small", text: "시험 종료·제출", attributes: { type: "button" } });
  submit.addEventListener("click", requestSubmit);
  status.append(statusGroup, submit);

  const card = createElement("article", { className: "question-card" });
  const topLine = createElement("div", { className: "question-topline" });
  const meta = createElement("div", { className: "meta-group" });
  meta.append(createElement("span", { className: "tag", text: question.topic }), createElement("span", { className: "tag neutral", text: question.difficulty }));
  topLine.append(meta, createElement("span", { className: "progress-text", text: `${activeMock.currentIndex + 1} / ${reviewedQuestions.length}` }));
  card.append(topLine, createElement("h2", { text: `문제 ${activeMock.currentIndex + 1}` }), createElement("p", { className: "question-stem", text: question.stem }));

  card.append(createChoiceList(question, selected, {
    name: `mock-${question.id}`,
    onSelect: (nextSelected) => {
      activeMock.answers[question.id] = nextSelected;
      persistActiveMock();
      renderExam();
    }
  }));

  const actions = createElement("div", { className: "question-actions" });
  const previous = createElement("button", { className: "button ghost", text: "이전 문제", attributes: { type: "button" } });
  previous.disabled = activeMock.currentIndex === 0;
  previous.addEventListener("click", () => {
    activeMock.currentIndex -= 1;
    persistActiveMock();
    renderExam();
  });
  const end = createElement("div", { className: "action-end" });
  const next = createElement("button", {
    className: "button primary",
    text: activeMock.currentIndex === reviewedQuestions.length - 1 ? "제출 확인" : "다음 문제",
    attributes: { type: "button" }
  });
  next.addEventListener("click", () => {
    if (activeMock.currentIndex === reviewedQuestions.length - 1) requestSubmit();
    else {
      activeMock.currentIndex += 1;
      persistActiveMock();
      renderExam();
    }
  });
  end.append(next);
  actions.append(previous, end);
  card.append(actions);

  const layout = createElement("div", { className: "exam-layout" });
  layout.append(card, createQuestionMap());
  root.append(status, layout);
}

preparePage(root, () => {
  if (!isValidActiveMock(activeMock)) {
    activeMock = null;
    clearActiveMock();
  }
  if (activeMock) startTimer();
  renderExam();
});
