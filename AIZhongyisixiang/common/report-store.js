import { getDefaultReport } from "./default-report";

const STORAGE_LATEST = "latest_report";
const STORAGE_HISTORY = "report_history";

function clone(data) {
  return JSON.parse(JSON.stringify(data));
}

function ensureReportFields(report, index = 0) {
  const base = getDefaultReport();
  const source = clone(report || {});
  const safe = {
    ...base,
    ...source,
    status: { ...base.status, ...(source.status || {}) },
    constitution: {
      ...base.constitution,
      ...(source.constitution || {}),
      bars:
        source.constitution && Array.isArray(source.constitution.bars)
          ? source.constitution.bars
          : base.constitution.bars
    },
    tongue: { ...base.tongue, ...(source.tongue || {}) },
    inquiry: { ...base.inquiry, ...(source.inquiry || {}) },
    pulse: { ...base.pulse, ...(source.pulse || {}) },
    climate: { ...base.climate, ...(source.climate || {}) },
    risk: { ...base.risk, ...(source.risk || {}) },
    plan: { ...base.plan, ...(source.plan || {}) }
  };

  if (!Array.isArray(safe.tongue.findings)) {
    safe.tongue.findings = base.tongue.findings;
  }
  if (!Array.isArray(safe.risk.items)) {
    safe.risk.items = base.risk.items;
  }
  if (!safe.id) {
    safe.id = `RPT-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  }
  if (!safe.createdAt) {
    safe.createdAt = new Date().toISOString().slice(0, 10);
  }
  if (!safe.userName) safe.userName = "用户3968";
  if (!safe.gender) safe.gender = "男";
  if (!safe.age) safe.age = 26;
  if (typeof safe.score !== "number") safe.score = 72 - index * 4;
  return safe;
}

function buildInitialHistory() {
  const base = ensureReportFields(getDefaultReport(), 0);
  const older1 = ensureReportFields(
    {
      ...base,
      id: "RPT-20260218-A1B2",
      createdAt: "2026-02-18",
      score: 68
    },
    1
  );
  const older2 = ensureReportFields(
    {
      ...base,
      id: "RPT-20260110-C3D4",
      createdAt: "2026-01-10",
      score: 65
    },
    2
  );
  return [base, older1, older2];
}

export function getReportHistory() {
  const cached = uni.getStorageSync(STORAGE_HISTORY);
  if (Array.isArray(cached) && cached.length > 0) {
    return cached
      .map((item, idx) => ensureReportFields(item, idx))
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  }
  const seeded = buildInitialHistory();
  uni.setStorageSync(STORAGE_HISTORY, seeded);
  uni.setStorageSync(STORAGE_LATEST, seeded[0]);
  return seeded;
}

export function getLatestReport() {
  const latest = uni.getStorageSync(STORAGE_LATEST);
  if (latest && latest.id) return ensureReportFields(latest, 0);
  const history = getReportHistory();
  return history[0];
}

export function saveReportHistory(list) {
  const next = (list || [])
    .map((item, idx) => ensureReportFields(item, idx))
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  uni.setStorageSync(STORAGE_HISTORY, next);
  if (next[0]) {
    uni.setStorageSync(STORAGE_LATEST, next[0]);
  }
  return next;
}

export function prependHistory(report) {
  const normalized = ensureReportFields(report, 0);
  const history = getReportHistory().filter((item) => item.id !== normalized.id);
  history.unshift(normalized);
  saveReportHistory(history);
  return normalized;
}

export function getReportById(id) {
  if (!id) return null;
  const history = getReportHistory();
  return history.find((item) => item.id === id) || null;
}
