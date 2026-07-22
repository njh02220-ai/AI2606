import { createElement, formatDate, preparePage } from "./common.js";
import { reviewedQuestions } from "./questions.js";
import { getPendingWrongCount, getState } from "./storage.js";

const main = document.querySelector("#main-content");

function isToday(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  return date.getFullYear() === now.getFullYear()
    && date.getMonth() === now.getMonth()
    && date.getDate() === now.getDate();
}

function createStatCard(label, value, description) {
  const card = createElement("article", { className: "stat-card" });
  card.append(
    createElement("span", { text: label }),
    createElement("strong", { text: value }),
    createElement("small", { text: description })
  );
  return card;
}

function renderHome() {
  const state = getState();
  const latestMock = state.mockAttempts.at(-1);
  const learnedToday = state.learnAttempts.filter((attempt) => isToday(attempt.createdAt)).length;
  const pendingWrong = getPendingWrongCount(state);
  const timestamps = [
    ...state.learnAttempts.map((attempt) => attempt.createdAt),
    ...state.mockAttempts.map((attempt) => attempt.createdAt)
  ].filter(Number.isFinite);
  const latestTimestamp = timestamps.length ? Math.max(...timestamps) : null;

  const statsRoot = document.querySelector("[data-home-stats]");
  statsRoot.replaceChildren(
    createStatCard("오늘 학습", `${learnedToday}문제`, learnedToday ? "오늘 제출한 주제별 문제" : "오늘 첫 문제를 풀어보세요"),
    createStatCard(
      "최근 모의고사",
      latestMock ? `${latestMock.correctCount}/${latestMock.total}` : "-",
      latestMock ? `${latestMock.scorePercent}점 · ${formatDate(latestMock.createdAt)}` : "아직 모의고사 기록이 없어요"
    ),
    createStatCard("복습할 오답", `${pendingWrong}문제`, pendingWrong ? "완료 전인 오답 문제" : "밀린 오답이 없어요"),
    createStatCard("등록 문제", `${reviewedQuestions.length}문제`, "검수 완료된 직접 제작 예시")
  );

  const updated = document.querySelector("[data-last-updated]");
  updated.textContent = latestTimestamp
    ? `최근 학습 ${formatDate(latestTimestamp, true)}`
    : "아직 저장된 학습 기록이 없어요.";
}

preparePage(main, renderHome);
