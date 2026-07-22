import { createElement, formatDate, formatDuration, preparePage } from "./common.js";
import { reviewedQuestions } from "./questions.js";
import { getCurrentResult, getState } from "./storage.js";

const root = document.querySelector("[data-result-root]");

function getResult() {
  return getCurrentResult() ?? getState().mockAttempts.at(-1) ?? null;
}

function renderEmpty() {
  const card = createElement("section", { className: "empty-state" });
  card.append(
    createElement("div", { className: "empty-icon", text: "?", attributes: { "aria-hidden": "true" } }),
    createElement("h2", { text: "확인할 모의고사 결과가 없어요." }),
    createElement("p", { text: "모의고사를 제출하면 점수와 문항별 해설이 이 화면에 표시됩니다." }),
    createElement("a", { className: "button primary", text: "모의고사 시작", attributes: { href: "mock-exam.html" } })
  );
  root.replaceChildren(card);
}

function createResultItem(detail, index) {
  const question = reviewedQuestions.find((item) => item.id === detail.questionId);
  if (!question) return null;

  const selectedIndex = Array.isArray(detail.selected) ? detail.selected[0] : undefined;
  const item = createElement("article", { className: "result-item" });
  const head = createElement("div", { className: "result-item-head" });
  const meta = createElement("div", { className: "meta-group" });
  meta.append(createElement("span", { className: "tag", text: question.topic }), createElement("span", { className: "tag neutral", text: `${index + 1}번` }));
  head.append(meta, createElement("strong", { className: `status-label ${detail.correct ? "correct" : "incorrect"}`, text: detail.correct ? "정답" : "오답" }));
  item.append(head, createElement("h3", { text: question.stem }));

  const answers = createElement("div", { className: "answer-lines" });
  answers.append(
    createElement("p", { text: `내 답: ${Number.isInteger(selectedIndex) ? question.choices[selectedIndex] : "미응답"}` }),
    createElement("p", { text: `정답: ${question.choices[question.answer[0]]}` })
  );
  const explanation = createElement("div", { className: "explanation-box" });
  explanation.append(createElement("strong", { text: "해설" }), createElement("p", { text: question.explanation }));
  item.append(answers, explanation);
  return item;
}

function renderResult() {
  const result = getResult();
  if (!result || !Array.isArray(result.details)) {
    renderEmpty();
    return;
  }

  const unanswered = result.details.filter((detail) => !Array.isArray(detail.selected) || detail.selected.length === 0).length;
  const incorrect = result.total - result.correctCount;
  const scoreCard = createElement("section", { className: "score-card" });
  const ring = createElement("div", { className: "score-ring", attributes: { "aria-label": `${result.scorePercent}점` } });
  const ringText = createElement("div");
  ringText.append(createElement("strong", { text: result.scorePercent }), createElement("small", { text: "점" }));
  ring.append(ringText);

  const copy = createElement("div", { className: "score-copy" });
  copy.append(
    createElement("p", { className: "eyebrow", text: "MOCK EXAM RESULT" }),
    createElement("h2", { text: `${result.correctCount}문제를 맞혔어요.` }),
    createElement("p", { text: `${formatDate(result.createdAt, true)}에 완료한 모의고사예요. 오답은 자동으로 오답노트에 저장했어요.` })
  );
  const miniStats = createElement("div", { className: "mini-stats" });
  [["정답", `${result.correctCount}개`], ["오답", `${incorrect}개`], ["미응답", `${unanswered}개`], ["풀이 시간", formatDuration(result.durationSeconds ?? 0)]].forEach(([label, value]) => {
    miniStats.append(createElement("span", { className: "mini-stat", text: `${label} ${value}` }));
  });
  copy.append(miniStats);
  const actions = createElement("div", { className: "button-row" });
  actions.append(
    createElement("a", { className: "button primary", text: "오답노트 보기", attributes: { href: "wrong-notes.html" } }),
    createElement("a", { className: "button secondary", text: "다시 응시하기", attributes: { href: "mock-exam.html" } })
  );
  copy.append(actions);
  scoreCard.append(ring, copy);

  const list = createElement("section", { className: "result-list", attributes: { "aria-label": "문항별 해설" } });
  result.details.forEach((detail, index) => {
    const item = createResultItem(detail, index);
    if (item) list.append(item);
  });
  root.replaceChildren(scoreCard, list);
}

preparePage(root, renderResult);
