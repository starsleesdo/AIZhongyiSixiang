import { getDefaultReport } from "./default-report";
import { getLatestReport, getReportHistory } from "./report-store";

const DEFAULT_BASE_URL = "http://127.0.0.1:3010";
const FALLBACK_BASE_URL = "http://127.0.0.1:3000";
const STORAGE_BASE_URL = "backend_base_url";
const STORAGE_PROVIDER = "ai_provider";
const STORAGE_PROVIDER_CONFIGS = "ai_provider_configs";
const STORAGE_AUTH_TOKEN = "app_auth_token";
const STORAGE_AUTH_USER = "app_auth_user";

const DEFAULT_PROVIDER_CONFIGS = {
  deepseek: {
    baseUrl: "https://api.deepseek.com/v1",
    model: "deepseek-chat",
    apiKey: ""
  },
  openai: {
    baseUrl: "https://api.openai.com/v1",
    model: "gpt-4o-mini",
    apiKey: ""
  },
  qwen: {
    baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    model: "qwen-plus",
    apiKey: ""
  },
  glm: {
    baseUrl: "https://open.bigmodel.cn/api/paas/v4",
    model: "glm-4-flash",
    apiKey: ""
  },
  custom: {
    baseUrl: "",
    model: "",
    apiKey: ""
  }
};

function normalizeErrorMessage(message) {
  const raw = String(message || "").trim();
  if (!raw) return "请求失败";
  const map = {
    "Account, phone, name and password are required": "请填写完整注册信息",
    "Account or phone already exists": "账号或手机号已存在",
    "Account/phone or password is invalid": "账号/手机号或密码错误",
    "Not logged in": "未登录或登录已失效",
    "User not found": "用户不存在",
    "Not Found": "接口不存在",
    "provider is required and must be configured": "模型提供商配置无效"
  };
  return map[raw] || raw;
}

function isNetworkFailError(error) {
  const msg = String((error && error.message) || error || "").toLowerCase();
  return (
    msg.includes("request:fail") ||
    msg.includes("timeout") ||
    msg.includes("connection refused") ||
    msg.includes("failed to connect")
  );
}

function getBaseUrlState() {
  const custom = String(uni.getStorageSync(STORAGE_BASE_URL) || "").trim();
  return {
    baseUrl: custom || DEFAULT_BASE_URL
  };
}

function getLocalProviderConfigs() {
  const cached = uni.getStorageSync(STORAGE_PROVIDER_CONFIGS);
  const source = cached && typeof cached === "object" ? cached : {};
  return {
    deepseek: { ...DEFAULT_PROVIDER_CONFIGS.deepseek, ...(source.deepseek || {}) },
    openai: { ...DEFAULT_PROVIDER_CONFIGS.openai, ...(source.openai || {}) },
    qwen: { ...DEFAULT_PROVIDER_CONFIGS.qwen, ...(source.qwen || {}) },
    glm: { ...DEFAULT_PROVIDER_CONFIGS.glm, ...(source.glm || {}) },
    custom: { ...DEFAULT_PROVIDER_CONFIGS.custom, ...(source.custom || {}) }
  };
}

function setLocalProviderConfigs(configs) {
  uni.setStorageSync(STORAGE_PROVIDER_CONFIGS, configs);
}

function doRequest({ baseUrl, url, method = "GET", data, skipAuth = false }) {
  return new Promise((resolve, reject) => {
    const header = {};
    const token = getAuthToken();
    if (!skipAuth && token) {
      header.Authorization = `Bearer ${token}`;
    }
    uni.request({
      url: `${baseUrl}${url}`,
      method,
      data,
      header,
      timeout: 15000,
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data);
          return;
        }
        const backendMessage = res && res.data ? res.data.message : "";
        reject(new Error(normalizeErrorMessage(backendMessage) || `请求失败: ${res.statusCode}`));
      },
      fail: (err) => {
        reject(new Error(normalizeErrorMessage((err && (err.errMsg || err.message)) || "")));
      }
    });
  });
}

async function request({ url, method = "GET", data, skipAuth = false }) {
  const base = getBaseUrlState();
  try {
    return await doRequest({ baseUrl: base.baseUrl, url, method, data, skipAuth });
  } catch (err) {
    if (!isNetworkFailError(err)) throw err;
    const retryBaseUrl = base.baseUrl === DEFAULT_BASE_URL ? FALLBACK_BASE_URL : DEFAULT_BASE_URL;
    return doRequest({ baseUrl: retryBaseUrl, url, method, data, skipAuth });
  }
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function clone(data) {
  return JSON.parse(JSON.stringify(data));
}

function buildLocalReport(payload = {}) {
  const base = clone(getDefaultReport());
  const profile = (payload && payload.profile) || {};
  const inquiryAnswers = Array.isArray(payload.inquiryAnswers) ? payload.inquiryAnswers.filter(Boolean) : [];
  const now = Date.now();

  base.id = `RPT-${now}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  base.createdAt = todayStr();
  base.userName = String(profile.name || base.userName || "用户");
  base.gender = String(profile.gender || base.gender || "男");
  base.age = Number(profile.age) || Number(base.age) || 26;
  base.score = Math.max(60, Math.min(95, Number(base.score) || 72));

  if (!base.status || typeof base.status !== "object") {
    base.status = {};
  }
  base.status.tongue = "已完成";
  base.status.inquiry = "已完成";
  base.status.climate = "已完成";

  if (!base.inquiry || typeof base.inquiry !== "object") {
    base.inquiry = {};
  }
  if (inquiryAnswers.length) {
    base.inquiry.summary = inquiryAnswers.join("；");
  }

  return base;
}

export function getBaseUrl() {
  return getBaseUrlState().baseUrl;
}

export function getCurrentProvider() {
  return uni.getStorageSync(STORAGE_PROVIDER) || "deepseek";
}

export function setBaseUrl(url) {
  uni.setStorageSync(STORAGE_BASE_URL, String(url || "").trim());
}

export function setCurrentProvider(provider) {
  uni.setStorageSync(STORAGE_PROVIDER, String(provider || "").trim() || "deepseek");
}

export function getAuthToken() {
  return uni.getStorageSync(STORAGE_AUTH_TOKEN) || "";
}

export function getAuthUser() {
  return uni.getStorageSync(STORAGE_AUTH_USER) || null;
}

export function setAuthSession(token, user) {
  if (token) {
    uni.setStorageSync(STORAGE_AUTH_TOKEN, token);
  }
  if (user) {
    uni.setStorageSync(STORAGE_AUTH_USER, user);
  }
}

export function clearAuthSession() {
  uni.removeStorageSync(STORAGE_AUTH_TOKEN);
  uni.removeStorageSync(STORAGE_AUTH_USER);
}

export function isLoggedIn() {
  return !!getAuthToken();
}

// 离线优先：模型配置走本地存储，不依赖后端
export function getProviders() {
  return Promise.resolve({ providers: getLocalProviderConfigs() });
}

// 离线优先：保存到本地；需要时可在后端可用时再做同步
export function saveProviderConfig(payload = {}) {
  const provider = String(payload.provider || getCurrentProvider() || "deepseek");
  const configs = getLocalProviderConfigs();
  configs[provider] = {
    ...(configs[provider] || {}),
    baseUrl: String(payload.baseUrl || ""),
    model: String(payload.model || ""),
    apiKey: String(payload.apiKey || ""),
    updatedAt: new Date().toISOString()
  };
  setLocalProviderConfigs(configs);
  return Promise.resolve({ ok: true, provider, savedAt: configs[provider].updatedAt });
}

// 离线优先：本地生成报告
export function generateReport(payload) {
  const report = buildLocalReport(payload || {});
  return Promise.resolve({ ok: true, report });
}

// 登录注册仍然走后端校验
export async function registerUser(payload) {
  const data = await request({
    url: "/api/auth/register",
    method: "POST",
    data: payload,
    skipAuth: true
  });
  if (data && data.token) {
    setAuthSession(data.token, data.user || null);
  }
  return data;
}

// 登录注册仍然走后端校验
export async function loginUser(payload) {
  const data = await request({
    url: "/api/auth/login",
    method: "POST",
    data: payload,
    skipAuth: true
  });
  if (data && data.token) {
    setAuthSession(data.token, data.user || null);
  }
  return data;
}

// 离线优先：退出只清理本地会话
export async function logoutUser() {
  clearAuthSession();
  return { ok: true };
}

// 离线优先：从本地会话读取用户
export async function fetchAuthUser() {
  const user = getAuthUser();
  if (!user) {
    throw new Error("未登录");
  }
  return { user };
}

// 离线优先：我的报告从本地历史读取
export function getUserReports() {
  const reports = getReportHistory();
  const latest = reports && reports[0] ? reports[0] : getLatestReport();
  return Promise.resolve({
    reports,
    latestAssessmentDate: latest && latest.createdAt ? latest.createdAt : ""
  });
}

