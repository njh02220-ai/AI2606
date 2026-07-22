// 직접 제작한 학습 예시입니다. 실제 기출문제는 이용 허가와 재배포 범위를 확인한 뒤 등록하세요.
export const questions = [
  {
    id: "BAS-001",
    level: "Basic",
    type: "single",
    topic: "AI 기초",
    difficulty: "쉬움",
    stem: "다음 중 지도학습(supervised learning)에 가장 알맞은 설명은 무엇인가?",
    choices: [
      "정답이 없는 데이터에서 숨은 구조를 찾는다.",
      "입력 데이터와 정답(label)을 함께 사용해 예측 규칙을 학습한다.",
      "보상을 최대화하도록 행동을 반복한다.",
      "사람의 개입 없이 항상 완벽한 답을 만든다."
    ],
    answer: [1],
    explanation: "지도학습은 입력값과 정답(label)의 관계를 학습해 새 입력의 정답을 예측하는 방법입니다.",
    source: "직접 제작 학습 예시",
    status: "reviewed"
  },
  {
    id: "BAS-002",
    level: "Basic",
    type: "single",
    topic: "데이터 이해",
    difficulty: "쉬움",
    stem: "학습 데이터에 빈 값이 많은 열을 발견했을 때, 가장 먼저 할 일로 적절한 것은 무엇인가?",
    choices: [
      "바로 해당 열을 삭제한다.",
      "결측치의 양과 발생 이유, 업무상 의미를 먼저 확인한다.",
      "빈 값을 모두 0으로 바꾼다.",
      "데이터를 확인하지 않고 모델부터 학습한다."
    ],
    answer: [1],
    explanation: "결측치는 무조건 삭제하거나 치환하지 않습니다. 비율과 원인을 살펴본 뒤 목적에 맞는 처리 방법을 정해야 합니다.",
    source: "직접 제작 학습 예시",
    status: "reviewed"
  },
  {
    id: "BAS-003",
    level: "Basic",
    type: "single",
    topic: "AI 윤리",
    difficulty: "보통",
    stem: "채용 지원자 데이터를 활용하는 AI 서비스에서 공정성 위험을 줄이는 방법으로 가장 적절한 것은 무엇인가?",
    choices: [
      "성별·연령별 결과 차이를 점검하고 편향을 검토한다.",
      "정확도만 높으면 공정성 검토는 생략한다.",
      "서비스의 판단 근거를 어떤 경우에도 공개하지 않는다.",
      "개인정보 동의 없이 데이터를 최대한 많이 수집한다."
    ],
    answer: [0],
    explanation: "AI 성능뿐 아니라 집단별 불이익 여부, 개인정보 보호, 설명 가능성을 함께 검토해야 합니다.",
    source: "직접 제작 학습 예시",
    status: "reviewed"
  },
  {
    id: "BAS-004",
    level: "Basic",
    type: "single",
    topic: "생성형 AI",
    difficulty: "보통",
    stem: "생성형 AI에게 업무용 요약을 요청할 때 결과의 신뢰성을 높이는 방법은 무엇인가?",
    choices: [
      "출처 확인 없이 첫 결과를 바로 사용한다.",
      "목적·대상·분량·형식을 구체적으로 제시하고 사실을 검증한다.",
      "민감한 개인정보를 제한 없이 모두 입력한다.",
      "모호할수록 창의적인 결과가 나오므로 조건을 쓰지 않는다."
    ],
    answer: [1],
    explanation: "명확한 조건을 제시하고, 중요한 사실은 원문이나 공식 출처로 다시 확인해야 합니다.",
    source: "직접 제작 학습 예시",
    status: "reviewed"
  },
  {
    id: "BAS-005",
    level: "Basic",
    type: "single",
    topic: "모델 평가",
    difficulty: "보통",
    stem: "분류 모델의 성능을 평가하기 위해 학습에 사용하지 않은 데이터를 따로 두는 주된 이유는 무엇인가?",
    choices: [
      "데이터 양을 줄이기 위해서",
      "학습 데이터에만 맞춘 모델인지, 새로운 데이터에도 작동하는지 확인하기 위해서",
      "모델을 더 복잡하게 만들기 위해서",
      "정답을 숨기기 위해서"
    ],
    answer: [1],
    explanation: "검증·테스트 데이터는 모델이 학습에 보지 못한 데이터에서도 잘 작동하는지, 즉 일반화 성능을 확인하는 데 사용합니다.",
    source: "직접 제작 학습 예시",
    status: "reviewed"
  }
];

export const reviewedQuestions = questions.filter((question) => question.status === "reviewed");
