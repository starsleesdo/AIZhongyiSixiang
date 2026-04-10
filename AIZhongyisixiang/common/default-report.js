import { buildInquirySummary, getDefaultInquiryAnswers } from "./inquiry-schema";

const DEFAULT_INQUIRY_ANSWERS = getDefaultInquiryAnswers();

export function getDefaultReport() {
  return {
    id: "RPT-DEMO-20260315",
    userName: "用户3968",
    gender: "男",
    age: 26,
    createdAt: "2026-03-15",
    score: 72,
    status: {
      tongue: "已完成",
      pulse: "未检测",
      inquiry: "已完成",
      climate: "已完成"
    },
    constitution: {
      mainType: "阳虚质",
      secondType: "兼气虚质",
      conclusion:
        "元气不足，畏寒怕冷，手足不温，喜热饮食，精力不足，舌淡胖嫩，脉沉迟。",
      bars: [
        { label: "阳虚质", value: 85, highlight: true },
        { label: "气虚质", value: 75 },
        { label: "湿热质", value: 55 },
        { label: "阴虚质", value: 50 },
        { label: "痰湿质", value: 45 },
        { label: "血瘀质", value: 40 },
        { label: "气郁质", value: 35 },
        { label: "特禀质", value: 20 },
        { label: "平和质", value: 15 }
      ]
    },
    tongue: {
      summary: "舌色偏淡白，苔白稍厚，提示气血不足兼有脾胃运化偏弱。",
      faceImage: "",
      underImage: "",
      analysis: "",
      traits: {
        color: "",
        thickness: "",
        moisture: "",
        yellowGreasy: false,
        dryCracked: false,
        toothMarks: false,
        swollen: false
      },
      findings: [
        "舌色偏淡白，提示气血不足",
        "舌边轻齿痕，提示脾虚",
        "苔白稍厚，提示寒湿偏重"
      ]
    },
    inquiry: {
      answers: { ...DEFAULT_INQUIRY_ANSWERS },
      summary: buildInquirySummary(DEFAULT_INQUIRY_ANSWERS)
    },
    pulse: {
      summary: "暂未接入脉诊设备，可通过问诊和可穿戴设备做替代评估。",
      frequency: 72,
      pressureSignal: "",
      types: [],
      analysis: ""
    },
    climate: {
      birthYear: "",
      birthMonth: "",
      birthDay: "",
      birthHour: "",
      analysis: "",
      summary: "当前春季木旺，肝气偏升，建议调畅情志、早睡早起，避免寒凉。"
    },
    risk: {
      level: "中等风险",
      items: ["免疫力波动风险", "消化功能紊乱风险", "季节交替时疲劳加重风险"]
    },
    plan: {
      diet: "多用温补脾阳食材，如山药、红枣、生姜羊肉汤，少生冷。",
      routine: "建议 23:00 前入睡，每周 3 次中低强度运动，重在持续。",
      medicine: "可在中医师辨证后参考四君子汤类思路调理，不建议自行长期服药。"
    }
  };
}

