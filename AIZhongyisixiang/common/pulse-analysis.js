function toNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function mean(arr) {
  if (!arr || arr.length === 0) return 0;
  return arr.reduce((s, n) => s + n, 0) / arr.length;
}

function std(arr, avg) {
  if (!arr || arr.length === 0) return 0;
  const m = avg == null ? mean(arr) : avg;
  const v = arr.reduce((s, n) => s + (n - m) * (n - m), 0) / arr.length;
  return Math.sqrt(v);
}

export function parsePressureSignal(signalInput) {
  if (Array.isArray(signalInput)) {
    return signalInput.map(toNumber).filter((n) => n != null);
  }
  const text = String(signalInput || "").trim();
  if (!text) return [];
  return text
    .split(/[\s,;\uFF0C\u3001\uFF1B]+/)
    .map(toNumber)
    .filter((n) => n != null);
}

export function normalizePulsePayload(payload) {
  const src = payload && typeof payload === "object" ? payload : {};
  const frequency = toNumber(src.frequency || src.freq || src.bpm);
  const signal = parsePressureSignal(src.pressureSignal || src.pressure || src.signal || src.values);
  return {
    frequency,
    signal,
    signalText: signal.join(",")
  };
}

function detectPeaks(values) {
  const out = [];
  if (!values || values.length < 3) return out;
  const baseline = mean(values);
  for (let i = 1; i < values.length - 1; i += 1) {
    if (values[i] > values[i - 1] && values[i] >= values[i + 1] && values[i] > baseline) {
      out.push(i);
    }
  }
  return out;
}

function splitSegments(values) {
  const n = values.length;
  const oneThird = Math.max(1, Math.floor(n / 3));
  return {
    light: values.slice(0, oneThird),
    middle: values.slice(oneThird, oneThird * 2),
    heavy: values.slice(oneThird * 2)
  };
}

function detectPulseTypes(metrics) {
  const types = [];
  const reasons = [];

  if (metrics.frequency != null) {
    if (metrics.frequency < 60) {
      types.push("迟脉");
      reasons.push("脉率低于 60 次/分钟，偏迟。");
    } else if (metrics.frequency > 90) {
      types.push("数脉");
      reasons.push("脉率高于 90 次/分钟，偏数。");
    }
  }

  if (metrics.lightMean > metrics.heavyMean * 1.12) {
    types.push("浮脉");
    reasons.push("轻按振幅更明显，提示偏浮。");
  } else if (metrics.heavyMean > metrics.lightMean * 1.12) {
    types.push("沉脉");
    reasons.push("重按振幅更明显，提示偏沉。");
  }

  if (metrics.pauseRatio >= 0.18 || metrics.longPauseCount >= 1) {
    types.push("结代脉");
    reasons.push("节律中可见间歇，提示结代倾向。");
  }

  if (metrics.roughness <= 0.55 && metrics.variation <= 0.45) {
    types.push("滑脉");
    reasons.push("波形较圆滑，节律相对匀整。");
  } else if (metrics.roughness >= 0.95 || metrics.variation >= 0.95) {
    types.push("涩脉");
    reasons.push("波形偏涩滞，节律不够匀整。");
  }

  if (types.length === 0) {
    reasons.push("当前信号未见明显偏性，整体偏平和。");
  }

  return { types, reasons };
}

function unique(list) {
  return Array.from(new Set(list));
}

export function buildPulseAnalysis(input) {
  const frequency = toNumber(input && input.frequency);
  const signal = parsePressureSignal(input && input.pressureSignal);

  const segments = splitSegments(signal);
  const lightMean = mean(segments.light);
  const heavyMean = mean(segments.heavy);

  const deltas = [];
  for (let i = 1; i < signal.length; i += 1) deltas.push(Math.abs(signal[i] - signal[i - 1]));
  const deltaAvg = mean(deltas);
  const deltaStd = std(deltas, deltaAvg);
  const roughness = deltaAvg > 0 ? deltaStd / deltaAvg : 0;
  const signalAvg = mean(signal);
  const signalStd = std(signal, signalAvg);
  const variation = signalAvg !== 0 ? Math.abs(signalStd / signalAvg) : 0;

  const peaks = detectPeaks(signal);
  const intervals = [];
  for (let i = 1; i < peaks.length; i += 1) intervals.push(peaks[i] - peaks[i - 1]);
  const intervalAvg = mean(intervals);
  const longPauseCount = intervals.filter((v) => v > intervalAvg * 1.8).length;
  const pauseRatio = intervals.length > 0 ? longPauseCount / intervals.length : 0;

  const metrics = {
    frequency,
    sampleCount: signal.length,
    lightMean,
    heavyMean,
    roughness,
    variation,
    longPauseCount,
    pauseRatio
  };

  const judged = detectPulseTypes(metrics);
  const types = unique(judged.types);
  const typeText = types.length > 0 ? types.join("、") : "平脉";

  const lines = [
    `脉象判定：${typeText}`,
    "",
    "判读依据：",
    ...judged.reasons.map((r) => `- ${r}`),
    "",
    "健康提示：",
    "- 本结果仅用于日常健康管理参考。",
    "- 建议结合舌象、问诊和临床面诊综合判断。"
  ];

  return {
    types,
    metrics,
    text: lines.join("\n")
  };
}
