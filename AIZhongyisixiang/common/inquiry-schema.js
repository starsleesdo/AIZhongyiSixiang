export const INQUIRY_QUESTIONS = [
  {
    key: "spirit",
    title: "精神状态",
    options: [
      { code: "A", label: "易亢奋" },
      { code: "B", label: "易困倦" },
      { code: "C", label: "正常" }
    ],
    defaultValue: "正常"
  },
  {
    key: "stoolColor",
    title: "大便颜色",
    options: [
      { code: "A", label: "黄" },
      { code: "B", label: "黑" },
      { code: "C", label: "其他颜色" }
    ],
    defaultValue: "黄"
  },
  {
    key: "stoolDryness",
    title: "大便是否干结",
    options: [
      { code: "A", label: "溏稀" },
      { code: "B", label: "便结" },
      { code: "C", label: "正常" }
    ],
    defaultValue: "正常"
  },
  {
    key: "diet",
    title: "饮食是否正常",
    options: [
      { code: "A", label: "正常" },
      { code: "B", label: "饮食少" },
      { code: "C", label: "吃不下" }
    ],
    defaultValue: "正常"
  },
  {
    key: "sleep",
    title: "睡眠是否正常",
    options: [
      { code: "A", label: "睡少" },
      { code: "B", label: "多梦易醒" },
      { code: "C", label: "正常" }
    ],
    defaultValue: "正常"
  },
  {
    key: "dizzy",
    title: "是否有头晕",
    options: [
      { code: "A", label: "是" },
      { code: "B", label: "否" }
    ],
    defaultValue: "否"
  },
  {
    key: "palpitation",
    title: "是否有心慌心悸",
    options: [
      { code: "A", label: "是" },
      { code: "B", label: "否" }
    ],
    defaultValue: "否"
  },
  {
    key: "urination",
    title: "小便是否正常",
    options: [
      { code: "A", label: "清长" },
      { code: "B", label: "黄" },
      { code: "C", label: "起夜多" }
    ],
    defaultValue: "清长"
  },
  {
    key: "otherDiscomfort",
    title: "是否有其他不舒服",
    options: [
      { code: "A", label: "心" },
      { code: "B", label: "肝" },
      { code: "C", label: "脾" },
      { code: "D", label: "肺" },
      { code: "E", label: "肾" }
    ],
    defaultValue: "脾"
  }
];

export function getDefaultInquiryAnswers() {
  return INQUIRY_QUESTIONS.reduce((acc, item) => {
    acc[item.key] = item.defaultValue;
    return acc;
  }, {});
}

function getOptionLabel(question, value) {
  const hit = question.options.find((opt) => opt.label === value);
  return hit ? `${hit.code}. ${hit.label}` : String(value || "");
}

export function normalizeInquiryAnswers(answers) {
  const source = answers && typeof answers === "object" ? answers : {};
  return INQUIRY_QUESTIONS.reduce((acc, question) => {
    const candidate = String(source[question.key] || "").trim();
    const exists = question.options.some((item) => item.label === candidate);
    acc[question.key] = exists ? candidate : question.defaultValue;
    return acc;
  }, {});
}

export function buildInquirySummary(answers) {
  const safe = normalizeInquiryAnswers(answers);
  const parts = INQUIRY_QUESTIONS.map((question) => {
    const answer = safe[question.key];
    return `${question.title}：${getOptionLabel(question, answer)}`;
  });
  return parts.join("；");
}

export function buildInquiryDisplayItems(answers) {
  const safe = normalizeInquiryAnswers(answers);
  return INQUIRY_QUESTIONS.map((question) => ({
    key: question.key,
    title: question.title,
    answer: getOptionLabel(question, safe[question.key])
  }));
}
