const DEFAULT_BASE_URL = "http://127.0.0.1:3010";
const STORAGE_BASE_URL = "backend_base_url";
const STORAGE_PROVIDER = "ai_provider";
const STORAGE_AUTH_TOKEN = "app_auth_token";
const STORAGE_AUTH_USER = "app_auth_user";

export function getBaseUrl() {
  const custom = uni.getStorageSync(STORAGE_BASE_URL);
  return custom || DEFAULT_BASE_URL;
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

function request({ url, method = "GET", data, skipAuth = false }) {
  return new Promise((resolve, reject) => {
    const header = {};
    const token = getAuthToken();
    if (!skipAuth && token) {
      header.Authorization = `Bearer ${token}`;
    }
    uni.request({
      url: `${getBaseUrl()}${url}`,
      method,
      data,
      header,
      timeout: 15000,
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data);
          return;
        }
        reject(
          new Error(
            (res.data && res.data.message) || `请求失败: ${res.statusCode}`
          )
        );
      },
      fail: (err) => reject(err)
    });
  });
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
