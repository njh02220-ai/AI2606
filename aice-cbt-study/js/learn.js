import { createChoiceList, createElement, gradeQuestion, initializeCommon, preparePage } from "./common.js";
import { reviewedQuestions } from "./questions.js";
import { saveLearnAttempt, saveWrongNote } from "./storage.js";

const root = document.querySelector("[data-learn-root]");
const filterRoot = document.querySelector("[data-topic-filters]");
const topics = ["전체", ...new Set(reviewedQuestions.map((question) => question.topic))];
const sessionResponses = new Map();
let selectedTopic = "전체";
let currentIndex = 0;

function getFilteredQuestions() {
  return selectedTopic === "전체"
    ? reviewedQuestions
    : reviewedQuestions.filter((question) => question.topic === selectedTopic);
}

function getResponse(questionId) {
  if (!sessionResponses.has(questionId)) {
    sessionResponses.set(questionId, { selected: [], submitted: false, correct: false });
  }
  return sessionResponses.get(questionId);
}

function renderFilters() {
  filterRoot.replaceChildren();
  topics.forEach((topic) => {
    const button = createElement("button", {
      className: `topic-filter${topic === selectedTopic ? " active" : ""}`,
      text: topic,
      attributes: { type: "button", "aria-pressed": topic === selectedTopic }
    });
    button.addEventListener("click", () => {
      selectedTopic = topic;
      currentIndex = 0;
      renderFilters();
      renderQuestion();
    });
    filterRoot.append(button);
  });
}

function createFeedback(question, response) {
  const feedback = createElement("section", {
    className: `feedback ${response.correct ? "correct" : "incorrect"}`,
    attributes: { role: "status" }
  });
  feedback.append(
    createElement("h3", { text: response.correct ? "정답이에요." : "오답노트에 저장했어요." }),
    createElement("p", { text: question.explanation })
  );
  return feedback;
}

function renderCompletion(questions) {
  const submitted = questions.map((question) => getResponse(question.id)).filter((response) => response.submitted);
  const correct = submitted.filter((response) => response.correct).length;
  root.replaceChildren();
  const card = createElement("section", { className: "completion-card" });
  card.append(
    createElement("div", { className: "completion-icon", text: "✓", attributes: { "aria-hidden": "true" } }),
    createElement("p", { className: "eyebrow", text: "LEARN COMPLETE" }),
    createElement("h2", { text: `${selectedTopic} 학습을 마쳤어요.` }),
    createElement("p", { text: `${submitted.length}문제 중 ${correct}문제를 맞혔어요. 틀린 문제는 오답노트에서 다시 풀 수 있어요.` })
  );
  const actions = createElement("div", { className: "button-row" });
  const restart = createElement("button", { className: "button secondary", text: "처음부터 다시 풀기", attributes: { type: "button" } });
  restart.addEventListener("click", () => {
    questions.forEach((question) => sessionResponses.delete(question.id));
    currentIndex = 0;
    renderQuestion();
  });
  const wrongLink = createElement("a", { className: "button primary", text: "오답노트 보기", attributes: { href: "wrong-notes.html" } });
  actions.append(restart, wrongLink);
  card.append(actions);
  root.append(card);
}

function renderQuestion() {
  const questions = getFilteredQuestions();
  if (currentIndex >= questions.length) {
    renderCompletion(questions);
    return;
  }

  const question = questions[currentIndex];
  const response = getResponse(question.id);
  const card = createElement("article", { className: "question-card" });
  const topLine = createElement("div", { className: "question-topline" });
  const meta = createElement("div", { className: "meta-group" });
  meta.append(
    createElement("span", { className: "tag", text: question.topic }),
    createElement("span", { className: "tag neutral", text: question.difficulty })
  );
  topLine.append(meta, createElement("span", { className: "progress-text", text: `${currentIndex + 1} / ${questions.length}` }));
  card.append(
    topLine,
    createElement("h2", { text: `문제 ${currentIndex + 1}` }),
    createElement("p", { className: "question-stem", text: question.stem })
  );

  let checkButton;
  const choices = createChoiceList(question, response.selected, {
    name: `learn-${question.id}`,
    disabled: response.submitted,
    correctAnswer: response.submitted ? question.answer[0] : undefined,
    wrongAnswer: response.submitted && !response.correct ? response.selected[0] : undefined,
    onSelect: (selected) => {
      response.selected = selected;
      if (checkButton) checkButton.disabled = false;
    }
  });
  card.append(choices);

  if (response.submitted) card.append(createFeedback(question, response));

  const actions = createElement("div", { className: "question-actions" });
  const previous = createElement("button", { className: "button ghost", text: "이전 문제", attributes: { type: "button" } });
  previous.disabled = currentIndex === 0;
  previous.addEventListener("click", () => {
    currentIndex -= 1;
    renderQuestion();
  });

  const end = createElement("div", { className: "action-end" });
  if (!response.submitted) {
    checkButton = createElement("button", { className: "button primary", text: "정답 확인", attributes: { type: "button" } });
    checkButton.disabled = response.selected.length === 0;
    checkButton.addEventListener("click", () => {
      if (!response.selected.length || response.submitted) return;
      response.submitted = true;
      response.correct = gradeQuestion(question, response.selected);
      saveLearnAttempt({
        questionId: question.id,
        topic: question.topic,
        selected: response.selected,
        correct: response.correct,
        createdAt: Date.now()
      });
      if (!response.correct) {
        saveWrongNote(question.id, { lastWrongAt: Date.now(), completed: false, sources: ["learn"] });
        initializeCommon();
      }
      renderQuestion();
    });
    end.append(checkButton);
  } else {
    const next = createElement("button", {
      className: "button primary",
      text: currentIndex === questions.length - 1 ? "학습 마치기" : "다음 문제",
      attributes: { type: "button" }
    });
    next.addEventListener("click", () => {
      currentIndex += 1;
      renderQuestion();
    });
    end.append(next);
  }
  actions.append(previous, end);
  card.append(actions);
  root.replaceChildren(card);
}

preparePage(root, () => {
  renderFilters();
  renderQuestion();
});
