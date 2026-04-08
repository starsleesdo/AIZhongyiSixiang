function normalizeText(v) {
  return String(v || "").toLowerCase();
}

function detectTraits(tongue) {
  const summary = normalizeText(tongue && tongue.summary);
  const findings = Array.isArray(tongue && tongue.findings)
    ? tongue.findings.map(normalizeText).join(" ")
    : "";
  const raw = `${summary} ${findings}`;

  const traits = {
    color: "淡红",
    thickness: "薄白苔",
    moisture: "润泽适中",
    yellowGreasy: false,
    dryCracked: false,
    toothMarks: false,
    swollen: false
  };

  if (/黄|yellow|greasy|huang|ni/.test(raw)) {
    traits.color = "偏黄";
    traits.yellowGreasy = true;
  }
  if (/厚|thick|coated|hou/.test(raw)) {
    traits.thickness = "苔偏厚";
  } else if (/薄|thin|bo/.test(raw)) {
    traits.thickness = "苔偏薄";
  }
  if (/淡白|苍白|pale|white|dan bai/.test(raw)) {
    traits.color = "淡白";
  }
  if (/红|绛|red|crimson|hong/.test(raw)) {
    traits.color = "偏红";
  }
  if (/紫|青紫|purple|cyan/.test(raw)) {
    traits.color = "暗紫";
  }

  if (/干|裂|dry|crack|less fluid/.test(raw)) {
    traits.moisture = "偏干";
    traits.dryCracked = true;
  }
  if (/湿|润|滑|wet|moist|slippery/.test(raw)) {
    traits.moisture = "偏润";
  }

  traits.toothMarks = /齿痕|tooth mark|chi hen/.test(raw);
  traits.swollen = /胖大|肿胀|swollen|puffy|pang da/.test(raw);

  return traits;
}

function buildOrganAssessment(traits) {
  const organs = {
    heart: "舌尖（心区）暂未见明显偏性。",
    liverGall: "舌边（肝胆区）暂未见明显偏性。",
    spleenStomach: "舌中（脾胃区）暂未见明显偏性。",
    kidney: "舌根（肾区）暂未见明显偏性。"
  };

  if (traits.color === "偏红" || traits.dryCracked) {
    organs.heart = "舌尖偏红或见干裂，提示心火偏旺或阴液不足倾向。";
  }
  if (traits.yellowGreasy || traits.color === "偏黄") {
    organs.liverGall = "舌边苔色偏黄腻，提示肝胆湿热倾向。";
  }
  if (traits.toothMarks || traits.swollen || traits.thickness === "苔偏厚") {
    organs.spleenStomach = "舌中见齿痕/胖大或苔厚，提示脾胃运化偏弱、湿困倾向。";
  }
  if ((traits.moisture === "偏润" && traits.color === "淡白") || traits.swollen) {
    organs.kidney = "舌根偏淡润或舌体胖大，提示肾阳不足、水湿偏盛倾向。";
  }
  if (traits.dryCracked && traits.moisture === "偏干") {
    organs.kidney = "舌根见干裂偏燥，提示肾阴津亏倾向。";
  }

  return organs;
}

function buildMainJudgement(traits) {
  if (traits.yellowGreasy) {
    return "黄腻苔较明显，偏湿热痰浊体征。";
  }
  if (traits.color === "淡白" && traits.thickness === "苔偏厚") {
    return "舌淡白且苔厚，偏寒湿或脾阳不足体征。";
  }
  if (traits.dryCracked) {
    return "舌面偏干或见裂纹，偏阴津不足体征。";
  }
  if (traits.toothMarks || traits.swollen) {
    return "齿痕或胖大舌较明显，偏脾虚夹湿体征。";
  }
  return "整体接近平和舌象表现。";
}

export function buildTongueAnalysis(tongue) {
  const traits = detectTraits(tongue || {});
  const organ = buildOrganAssessment(traits);
  const main = buildMainJudgement(traits);

  const lines = [
    "舌诊判读依据：",
    "1. 观察舌色、舌苔厚薄与润燥程度。",
    "2. 正常舌象多为淡红舌、薄白苔、润泽适中。",
    "3. 黄腻苔常见于湿热内蕴倾向。",
    "4. 白厚苔常见于寒湿偏重倾向。",
    "5. 干裂舌常见于津液不足倾向。",
    "",
    "本次识别特征：",
    `- 舌色：${traits.color}`,
    `- 苔象：${traits.thickness}`,
    `- 润燥：${traits.moisture}`,
    `- 黄腻苔：${traits.yellowGreasy ? "是" : "否"}`,
    `- 干裂：${traits.dryCracked ? "是" : "否"}`,
    `- 齿痕：${traits.toothMarks ? "是" : "否"}`,
    `- 胖大：${traits.swollen ? "是" : "否"}`,
    "",
    `综合判断：${main}`,
    "",
    "分区参考（舌尖=心，舌边=肝胆，舌中=脾胃，舌根=肾）：",
    `- ${organ.heart}`,
    `- ${organ.liverGall}`,
    `- ${organ.spleenStomach}`,
    `- ${organ.kidney}`,
    "",
    "说明：本结果仅用于健康管理参考，不替代医生面诊。"
  ];

  return {
    traits,
    text: lines.join("\n")
  };
}
