import { reviewedQuestions } from "./questions.js";
import { getPendingWrongCount, getState } from "./storage.js";

export function createElement(tagName, options = {}) {
  const element = document.createElement(tagName);
  if (options.className) element.className = options.className;
  if (options.text !== undefined) element.textContent = String(options.text);
  if (options.attributes) {
    Object.entries(options.attributes).forEach(([name, value]) => {
      if (value !== undefined && value !== null) element.setAttribute(name, String(value));
    });
  }
  return element;
}

export function formatDate(timestamp, includeTime = false) {
  if (!timestamp) return "-";
  const options = includeTime
    ? { month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" }
    : { year: "numeric", month: "long", day: "numeric" };
  return new Intl.DateTimeFormat("ko-KR", options).format(new Date(timestamp));
}

export function formatDuration(totalSeconds) {
  const minutes = Math.floor(Math.max(0, totalSeconds) / 60);
  const seconds = Math.max(0, totalSeconds) % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function gradeQuestion(question, selectedAnswers = []) {
  const expected = [...question.answer].sort((a, b) => a - b).join(",");
  const received = [...selectedAnswers].sort((a, b) => a - b).join(",");
  return expected === received;
}

export function validateQuestionBank(questionBank = reviewedQuestions) {
  const errors = [];
  const ids = new Set();
  const requiredTextFields = ["id", "level", "type", "topic", "difficulty", "stem", "explanation"];

  if (!Array.isArray(questionBank) || questionBank.length === 0) {
    return ["검수 완료된 문제 데이터가 없습니다."];
  }

  questionBank.forEach((question, index) => {
    const label = question?.id || `${index + 1}번 데이터`;
    if (!question || typeof question !== "object") {
      errors.push(`${index + 1}번 문제 데이터가 객체 형식이 아닙니다.`);
      return;
    }

    requiredTextFields.forEach((field) => {
      if (typeof question[field] !== "string" || !question[field].trim()) {
        errors.push(`${label}: ${field} 항목이 비어 있습니다.`);
      }
    });

    if (ids.has(question.id)) errors.push(`${label}: 문제 ID가 중복됩니다.`);
    ids.add(question.id);

    if (question.type !== "single") errors.push(`${label}: 1차 버전은 single 유형만 지원합니다.`);
    if (!Array.isArray(question.choices) || question.choices.length < 2) {
      errors.push(`${label}: 선택지는 두 개 이상이어야 합니다.`);
    } else if (question.choices.some((choice) => typeof choice !== "string" || !choice.trim())) {
      errors.push(`${label}: 비어 있는 선택지가 있습니다.`);
    }

    if (!Array.isArray(question.answer) || question.answer.length !== 1 || !Number.isInteger(question.answer[0])) {
      errors.push(`${label}: 단일 정답 번호가 올바르지 않습니다.`);
    } else if (question.answer[0] < 0 || question.answer[0] >= (question.choices?.length ?? 0)) {
      errors.push(`${label}: 정답 번호가 선택지 범위를 벗어났습니다.`);
    }
  });

  return errors;
}

export function renderAppError(root, errors) {
  root.replaceChildren();
  const card = createElement("section", { className: "error-card", attributes: { role: "alert" } });
  card.append(createElement("h2", { text: "문제 데이터를 확인해 주세요." }));
  const intro = createElement("p", { text: "오류를 수정하기 전에는 잘못된 채점이 발생하지 않도록 학습을 시작하지 않습니다." });
  card.append(intro);
  const list = createElement("ul");
  errors.forEach((error) => list.append(createElement("li", { text: error })));
  card.append(list);
  root.append(card);
}

export function initializeCommon() {
  const page = document.body.dataset.page;
  document.querySelector(`[data-nav="${page}"]`)?.classList.add("active");
  const count = getPendingWrongCount(getState());
  document.querySelectorAll("[data-wrong-count]").forEach((badge) => {
    badge.textContent = String(count);
    badge.setAttribute("aria-label", `복습이 필요한 오답 ${count}개`);
  });
}

export function preparePage(root, render) {
  initializeCommon();
  const errors = validateQuestionBank();
  if (errors.length) {
    renderAppError(root, errors);
    return false;
  }
  render();
  return true;
}

export function createChoiceList(question, selectedAnswers, options = {}) {
  const fieldset = createElement("fieldset", { className: "choice-list" });
  fieldset.setAttribute("aria-label", `${question.id} 선택지`);
  const selected = new Set(selectedAnswers ?? []);

  question.choices.forEach((choiceText, index) => {
    const label = createElement("label", { className: "choice" });
    const input = createElement("input", {
      attributes: {
        type: "radio",
        name: options.name ?? question.id,
        value: index,
        disabled: options.disabled ? "" : null
      }
    });
    input.checked = selected.has(index);
    if (options.correctAnswer === index) label.classList.add("is-correct");
    if (options.wrongAnswer === index) label.classList.add("is-wrong");
    input.addEventListener("change", () => options.onSelect?.([index]));

    label.append(
      input,
      createElement("span", { className: "choice-index", text: index + 1 }),
      createElement("span", { text: choiceText })
    );
    fieldset.append(label);
  });

  return fieldset;
}
