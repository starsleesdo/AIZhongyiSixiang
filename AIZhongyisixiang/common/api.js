const DEFAULT_BASE_URL = "http://127.0.0.1:3000";
const FALLBACK_BASE_URL = "http://127.0.0.1:3010";
const STORAGE_BASE_URL = "backend_base_url";
const STORAGE_PROVIDER = "ai_provider";
const STORAGE_AUTH_TOKEN = "app_auth_token";
const STORAGE_AUTH_USER = "app_auth_user";

const MESSAGE_MAP = {
  "Account, phone, name and password are required": "请填写完整注册信息",
  "Account or phone already exists": "账号或手机号已存在",
  "Account/phone or password is invalid": "账号/手机号或密码错误",
  "Not logged in": "未登录或登录已失效",
  "User not found": "用户不存在",
  "Not Found": "接口不存在",
  "provider is required and must be configured": "模型提供商配置无效"
};

function getBaseUrlState() {
  const custom = String(uni.getStorageSync(STORAGE_BASE_URL) || "").trim();
  return {
    baseUrl: custom || DEFAULT_BASE_URL,
    hasCustom: Boolean(custom)
  };
}

function normalizeErrorMessage(message) {
  const raw = String(message || "").trim();
  return MESSAGE_MAP[raw] || raw || "请求失败";
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
        reject(new Error(normalizeErrorMessage(err && err.errMsg ? err.errMsg : err && err.message)));
      }
    });
  });
}

async function request({ url, method = "GET", data, skipAuth = false }) {
  const base = getBaseUrlState();
  try {
    return await doRequest({ baseUrl: base.baseUrl, url, method, data, skipAuth });
  } catch (err) {
    if (!isNetworkFailError(err)) {
      throw err;
    }
    const retryBaseUrl =
      base.baseUrl === DEFAULT_BASE_URL
        ? FALLBACK_BASE_URL
        : base.baseUrl === FALLBACK_BASE_URL
          ? DEFAULT_BASE_URL
          : "";
    if (!retryBaseUrl || retryBaseUrl === base.baseUrl) {
      throw err;
    }
    return doRequest({ baseUrl: retryBaseUrl, url, method, data, skipAuth });
  }
}

export function getBaseUrl() {
  return getBaseUrlState().baseUrl;
}

export function getCurrentProvider() {
  return uni.getStorageSync(STORAGE_PROVIDER) || "deepseek";
}

export function setBaseUrl(url) {
  uni.setStorageSync(STORAGE_BASE_URL, url);
}

export function setCurrentProvider(provider) {
  uni.setStorageSync(STORAGE_PROVIDER, provider);
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

export function getProviders() {
  return request({ url: "/api/providers" });
}

export function saveProviderConfig(payload) {
  return request({
    url: "/api/providers",
    method: "POST",
    data: payload
  });
}

export function generateReport(payload) {
  return request({
    url: "/api/report/generate",
    method: "POST",
    data: payload
  });
}

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

export async function logoutUser() {
  try {
    await request({
      url: "/api/auth/logout",
      method: "POST",
      data: {}
    });
  } finally {
    clearAuthSession();
  }
}

export async function fetchAuthUser() {
  const data = await request({
    url: "/api/auth/me",
    method: "GET",
    data: {}
  });
  if (data && data.user) {
    setAuthSession(getAuthToken(), data.user);
  }
  return data;
}

export function getUserReports() {
  return request({
    url: "/api/user/reports",
    method: "GET",
    data: {}
  });
}
