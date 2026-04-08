const STEMS = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
const BRANCHES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];

const STEM_WUYUN = {
  甲: { element: "土", state: "太过" },
  己: { element: "土", state: "不及" },
  乙: { element: "金", state: "不及" },
  庚: { element: "金", state: "太过" },
  丙: { element: "水", state: "太过" },
  辛: { element: "水", state: "不及" },
  丁: { element: "木", state: "不及" },
  壬: { element: "木", state: "太过" },
  戊: { element: "火", state: "太过" },
  癸: { element: "火", state: "不及" }
};

const BRANCH_SITIAN = {
  子: "少阴君火", 午: "少阴君火",
  丑: "太阴湿土", 未: "太阴湿土",
  寅: "少阳相火", 申: "少阳相火",
  卯: "阳明燥金", 酉: "阳明燥金",
  辰: "太阳寒水", 戌: "太阳寒水",
  巳: "厥阴风木", 亥: "厥阴风木"
};

const QI_OPPOSITE = {
  少阳相火: "厥阴风木",
  厥阴风木: "少阳相火",
  阳明燥金: "少阴君火",
  少阴君火: "阳明燥金",
  太阳寒水: "太阴湿土",
  太阴湿土: "太阳寒水"
};

const QI_RING = ["厥阴风木", "少阴君火", "太阴湿土", "少阳相火", "阳明燥金", "太阳寒水"];
const MAIN_QI = ["厥阴风木", "少阴君火", "少阳相火", "太阴湿土", "阳明燥金", "太阳寒水"];
const STEP_NAMES = ["初之气", "二之气", "三之气", "四之气", "五之气", "六之气"];
const STEP_RANGES = [
  "1月下旬-3月下旬",
  "3月下旬-5月下旬",
  "5月下旬-7月下旬",
  "7月下旬-9月下旬",
  "9月下旬-11月下旬",
  "11月下旬-次年1月下旬"
];

const ELEMENT_COUNTER = {
  木: "金",
  火: "水",
  土: "木",
  金: "火",
  水: "土"
};

const QI_HINT = {
  厥阴风木: {
    tendency: "风木偏动，肝胆疏泄与情志波动较敏感。",
    advice: "注意情绪管理，避免久郁与熬夜，重在疏肝理气。"
  },
  少阴君火: {
    tendency: "君火偏旺，心火易动。",
    advice: "少辛辣酒咖啡，规律睡眠，关注心烦失眠与口舌生疮。"
  },
  少阳相火: {
    tendency: "相火偏动，易见郁热。",
    advice: "保持作息规律，少酒少辣，关注口苦咽干与胁肋不舒。"
  },
  阳明燥金: {
    tendency: "燥金偏盛，津液易耗。",
    advice: "注意润燥护津，多温水与汤粥，少煎炸燥烈。"
  },
  太阳寒水: {
    tendency: "寒水偏盛，阳气易遏。",
    advice: "重视保暖，少生冷，防寒湿困表与关节冷痛。"
  },
  太阴湿土: {
    tendency: "湿土偏重，脾运易困。",
    advice: "饮食清淡，少甜腻与生冷，重在健脾祛湿。"
  }
};

function toInt(v) {
  const n = Number(v);
  return Number.isInteger(n) ? n : null;
}

function mod(n, m) {
  return ((n % m) + m) % m;
}

function validateBirthInput(payload) {
  const year = toInt(payload.birthYear);
  const month = toInt(payload.birthMonth);
  const day = toInt(payload.birthDay);
  const hour = toInt(payload.birthHour);

  if (year == null || year < 1900 || year > 2100) return { ok: false, message: "出生年份需在1900-2100" };
  if (month == null || month < 1 || month > 12) return { ok: false, message: "出生月份需在1-12" };
  if (day == null || day < 1 || day > 31) return { ok: false, message: "出生日需在1-31" };
  if (hour == null || hour < 0 || hour > 23) return { ok: false, message: "出生小时需在0-23" };

  return { ok: true, value: { year, month, day, hour } };
}

function getGanzhiYear(year) {
  const offset = mod(year - 1984, 60);
  const stem = STEMS[offset % 10];
  const branch = BRANCHES[offset % 12];
  return { stem, branch, name: stem + branch };
}

function getYearPattern(year) {
  const gz = getGanzhiYear(year);
  const middle = STEM_WUYUN[gz.stem];
  const sitian = BRANCH_SITIAN[gz.branch];
  const zaiquan = QI_OPPOSITE[sitian];
  const start = mod(QI_RING.indexOf(sitian) - 2, 6);
  const guestQi = Array.from({ length: 6 }).map((_, i) => QI_RING[(start + i) % 6]);
  const steps = STEP_NAMES.map((name, i) => ({
    name,
    range: STEP_RANGES[i],
    mainQi: MAIN_QI[i],
    guestQi: guestQi[i]
  }));
  return { year, ganzhi: gz.name, middle, sitian, zaiquan, steps };
}

function getStepIndexByMonthDay(month, day) {
  const md = month * 100 + day;
  if (md >= 120 && md < 320) return 0;
  if (md >= 320 && md < 520) return 1;
  if (md >= 520 && md < 720) return 2;
  if (md >= 720 && md < 920) return 3;
  if (md >= 920 && md < 1120) return 4;
  return 5;
}

function getHourBranch(hour) {
  if (hour >= 23 || hour < 1) return "子";
  if (hour < 3) return "丑";
  if (hour < 5) return "寅";
  if (hour < 7) return "卯";
  if (hour < 9) return "辰";
  if (hour < 11) return "巳";
  if (hour < 13) return "午";
  if (hour < 15) return "未";
  if (hour < 17) return "申";
  if (hour < 19) return "酉";
  if (hour < 21) return "戌";
  return "亥";
}

function getResonanceText(birthPattern, currentPattern) {
  const hit = [];
  if (birthPattern.sitian === currentPattern.sitian) hit.push("司天同气");
  if (birthPattern.zaiquan === currentPattern.zaiquan) hit.push("在泉同气");
  if (birthPattern.middle.element === currentPattern.middle.element) hit.push("中运同五行");
  if (hit.length === 0) {
    return "今年与你出生年的五运六气共振度中等，重点按当年司天/在泉调养。";
  }
  return "今年与出生岁运存在" + hit.join("、") + "，共振偏强，需更重视应时调养。";
}

function buildCongenitalText(birth, birthPattern) {
  const middle = birthPattern.middle;
  const sitianHint = QI_HINT[birthPattern.sitian] || QI_HINT.厥阴风木;
  const zaiquanHint = QI_HINT[birthPattern.zaiquan] || QI_HINT.太阴湿土;
  const birthStep = birthPattern.steps[getStepIndexByMonthDay(birth.month, birth.day)];
  const hourBranch = getHourBranch(birth.hour);
  const hourQi = BRANCH_SITIAN[hourBranch];
  const hourHint = QI_HINT[hourQi] || QI_HINT.厥阴风木;
  const middleLine = middle.state === "太过"
    ? middle.element + "运太过，本气偏盛。"
    : middle.element + "运不及，易受" + ELEMENT_COUNTER[middle.element] + "气所制。";

  return [
    "【先天体质推断】",
    "- 出生时点：" + birth.year + "年" + birth.month + "月" + birth.day + "日 " + birth.hour + "时。",
    "- 出生年干支：" + birthPattern.ganzhi + "。",
    "- 中运：" + birthPattern.middle.element + "运" + birthPattern.middle.state + "。" + middleLine,
    "- 司天：" + birthPattern.sitian + "（" + sitianHint.tendency + "）",
    "- 在泉：" + birthPattern.zaiquan + "（" + zaiquanHint.tendency + "）",
    "- 出生节律对应：" + birthStep.name + "，主气" + birthStep.mainQi + "，客气" + birthStep.guestQi + "。",
    "- 出生时辰（" + hourBranch + "时）偏应：" + hourQi + "，提示" + hourHint.tendency,
    "- 先天调养要点：" + sitianHint.advice + zaiquanHint.advice
  ].join("\n");
}

function buildCurrentYearText(currentPattern, currentStepIdx) {
  const sitianHint = QI_HINT[currentPattern.sitian] || QI_HINT.厥阴风木;
  const zaiquanHint = QI_HINT[currentPattern.zaiquan] || QI_HINT.太阴湿土;
  const step = currentPattern.steps[currentStepIdx];
  const middle = currentPattern.middle;
  const middleLine = middle.state === "太过"
    ? middle.element + "运太过，全年本气偏盛。"
    : middle.element + "运不及，需防" + ELEMENT_COUNTER[middle.element] + "气偏胜。";

  return [
    "【当年岁运提醒】",
    "- 当前年份：" + currentPattern.year + "（" + currentPattern.ganzhi + "）。",
    "- 中运：" + middle.element + "运" + middle.state + "。" + middleLine,
    "- 司天（上半年）：" + currentPattern.sitian + "。" + sitianHint.advice,
    "- 在泉（下半年）：" + currentPattern.zaiquan + "。" + zaiquanHint.advice,
    "- 当前所处：" + step.name + "（" + step.range + "），主气" + step.mainQi + "，客气" + step.guestQi + "。"
  ].join("\n");
}

function buildStepText(steps) {
  return [
    "【本年六步主客气】",
    ...steps.map((s) => "- " + s.name + "（" + s.range + "）：主气" + s.mainQi + "，客气" + s.guestQi)
  ].join("\n");
}

export function buildWuYunLiuQiAnalysis(payload = {}) {
  const valid = validateBirthInput(payload);
  if (!valid.ok) {
    return { ok: false, message: valid.message };
  }
  const birth = valid.value;

  const now = payload.currentDate ? new Date(payload.currentDate) : new Date();
  const currentYear = now.getFullYear();
  const birthPattern = getYearPattern(birth.year);
  const currentPattern = getYearPattern(currentYear);
  const currentStepIdx = getStepIndexByMonthDay(now.getMonth() + 1, now.getDate());

  const congenital = buildCongenitalText(birth, birthPattern);
  const yearly = buildCurrentYearText(currentPattern, currentStepIdx);
  const stepText = buildStepText(currentPattern.steps);
  const resonance = getResonanceText(birthPattern, currentPattern);

  const text = [
    "【输入信息】",
    "- 出生年月日时：" + birth.year + "-" + String(birth.month).padStart(2, "0") + "-" + String(birth.day).padStart(2, "0") + " " + String(birth.hour).padStart(2, "0") + ":00",
    "- 分析基准日期：" + now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0") + "-" + String(now.getDate()).padStart(2, "0"),
    "",
    congenital,
    "",
    yearly,
    "",
    "【共振评估】",
    "- " + resonance,
    "",
    stepText,
    "",
    "【方法说明】",
    "- 本结果依据五运（中运）、司天在泉与六步主客气推演。",
    "- 五运六气强调整体观念，需与望闻问切四诊合参，不替代临床诊疗。"
  ].join("\n");

  return {
    ok: true,
    birth,
    currentYear,
    birthPattern,
    currentPattern,
    text
  };
}
