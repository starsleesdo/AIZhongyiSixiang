const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PORT = process.env.PORT || 3000;
const PROVIDER_FILE = path.join(__dirname, "providers.json");
const ADMIN_FILE = path.join(__dirname, "admin-data.json");
const STAFF_COOKIE = "staff_token";
const DEFAULT_ADMIN_PASSWORD = "123456";
const LEGACY_ADMIN_PASSWORD = "admin123";
const DEFAULT_OPERATOR_PASSWORD = "op123456";

const STAFF_SESSIONS = new Map();
const APP_SESSIONS = new Map();

const STAFF_TTL = 24 * 60 * 60 * 1000;
const APP_TTL = 30 * 24 * 60 * 60 * 1000;

const DEFAULT_PROVIDERS = {
  deepseek: {
    label: "DeepSeek",
    baseUrl: "https://api.deepseek.com/chat/completions",
    model: "deepseek-chat",
    apiKey: ""
  },
  openai: {
    label: "OpenAI",
    baseUrl: "https://api.openai.com/v1/chat/completions",
    model: "gpt-4o-mini",
    apiKey: ""
  },
  qwen: {
    label: "Qwen",
    baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
    model: "qwen-plus",
    apiKey: ""
  },
  glm: {
    label: "GLM",
    baseUrl: "https://open.bigmodel.cn/api/paas/v4/chat/completions",
    model: "glm-4-air",
    apiKey: ""
  },
  custom: {
    label: "Custom",
    baseUrl: "",
    model: "",
    apiKey: ""
  }
};

function hashPassword(v) {
  return crypto.createHash("sha256").update(`AIZY::${String(v || "")}`).digest("hex");
}

function safeJsonParse(text, fallback) {
  try {
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}

function readJson(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  return safeJsonParse(fs.readFileSync(filePath, "utf8"), fallback);
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
}

function randomId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

function buildDefaultBars(primary) {
  const labels = ["yang-def", "qi-def", "damp-heat", "yin-def", "phlegm-damp", "blood-stasis", "qi-stagnation", "special", "balanced"];
  return labels.map((label, idx) => ({
    label,
    value: Math.max(10, 88 - idx * 8),
    highlight: label === primary
  }));
}

function seedReport(config) {
  return {
    id: config.id,
    userName: config.userName,
    gender: config.gender,
    age: config.age,
    createdAt: config.date,
    score: config.score,
    status: { tongue: "done", pulse: "pending", inquiry: "done", climate: "done" },
    constitution: {
      mainType: config.mainType,
      secondType: config.secondType,
      conclusion: "Overall tendency is sub-healthy; keep regular routine and support with TCM guidance.",
      bars: buildDefaultBars(config.mainType)
    },
    tongue: { summary: "Tongue color is slightly pale with thin white coating.", findings: ["Possible qi-blood weakness", "Mild spleen deficiency tendency"] },
    inquiry: { summary: "Often feels tired with light sleep quality." },
    pulse: { summary: "No pulse device connected; add monitoring later if needed." },
    climate: { summary: "Current season tends to dry/windy; keep warm and stable routine." },
    risk: { level: "medium", items: ["Digestive fluctuation risk", "Fatigue accumulation risk"] },
    plan: { diet: "Prefer warm and easy-to-digest meals.", routine: "Sleep before 23:00 and exercise 3 times/week.", medicine: "Use personalized TCM plan after offline consultation." }
  };
}

function defaultAdminData() {
  return {
    staffAccounts: [
      { id: "STAFF-ADMIN", username: "admin", displayName: "System Admin", role: "admin", passwordHash: hashPassword(DEFAULT_ADMIN_PASSWORD) },
      { id: "STAFF-OP", username: "operator", displayName: "Support A", role: "operator", passwordHash: hashPassword(DEFAULT_OPERATOR_PASSWORD) }
    ],
    users: [
      {
        id: "U-3968",
        account: "user3968",
        phone: "13800003968",
        name: "User3968",
        gender: "male",
        age: 26,
        appPasswordHash: hashPassword("123456"),
        latestAssessmentDate: "2026-04-07",
        reports: [
          seedReport({ id: "RPT-20260407-A1B2", date: "2026-04-07", score: 72, mainType: "yang-def", secondType: "qi-def", userName: "User3968", gender: "male", age: 26 }),
          seedReport({ id: "RPT-20260315-F1F8", date: "2026-03-15", score: 70, mainType: "qi-def", secondType: "yang-def", userName: "User3968", gender: "male", age: 26 })
        ],
        payments: [{ id: "PAY-20260407-1001", orderNo: "ORD-20260407-1001", planName: "Annual Plan", amount: 299, status: "paid", paidAt: "2026-04-07 10:30:00" }]
      }
    ]
  };
}

function normalizeAdminData(data) {
  const safe = data && typeof data === "object" ? data : {};
  const def = defaultAdminData();
  const legacyAdminHash = hashPassword(LEGACY_ADMIN_PASSWORD);
  const defaultAdminHash = hashPassword(DEFAULT_ADMIN_PASSWORD);
  const out = {
    staffAccounts: Array.isArray(safe.staffAccounts) ? safe.staffAccounts : def.staffAccounts,
    users: Array.isArray(safe.users) ? safe.users : def.users
  };
  let changed = !Array.isArray(safe.staffAccounts) || !Array.isArray(safe.users);
  out.staffAccounts = out.staffAccounts.map((s, idx) => {
    const row = {
      id: s.id || randomId(`STAFF${idx}`),
      username: String(s.username || ""),
      displayName: String(s.displayName || s.username || "Staff"),
      role: s.role === "admin" ? "admin" : "operator",
      passwordHash: s.passwordHash || hashPassword(s.role === "admin" ? DEFAULT_ADMIN_PASSWORD : DEFAULT_OPERATOR_PASSWORD)
    };
    if (!s.passwordHash) changed = true;
    // Migrate legacy seeded admin password from admin123 -> 123456.
    if (row.role === "admin" && row.username === "admin" && row.passwordHash === legacyAdminHash) {
      row.passwordHash = defaultAdminHash;
      changed = true;
    }
    return row;
  });
  if (out.staffAccounts.length === 0) {
    out.staffAccounts = def.staffAccounts;
    changed = true;
  }
  out.users = out.users.map((u) => {
    const row = { ...u };
    if (!Array.isArray(row.reports)) {
      row.reports = [];
      changed = true;
    }
    if (!Array.isArray(row.payments)) {
      row.payments = [];
      changed = true;
    }
    if (!row.appPasswordHash) {
      row.appPasswordHash = hashPassword("123456");
      changed = true;
    }
    return row;
  });
  return { out, changed };
}

function loadAdminData() {
  const fallback = defaultAdminData();
  if (!fs.existsSync(ADMIN_FILE)) {
    writeJson(ADMIN_FILE, fallback);
    return fallback;
  }
  const parsed = readJson(ADMIN_FILE, fallback);
  const n = normalizeAdminData(parsed);
  if (n.changed) writeJson(ADMIN_FILE, n.out);
  return n.out;
}

function loadProviders() {
  const defaults = JSON.parse(JSON.stringify(DEFAULT_PROVIDERS));
  const parsed = readJson(PROVIDER_FILE, {});
  Object.keys(defaults).forEach((k) => {
    defaults[k] = { ...defaults[k], ...(parsed[k] || {}) };
  });
  return defaults;
}

function saveProviders(providers) {
  writeJson(PROVIDER_FILE, providers);
}

function parseCookies(req) {
  const cookie = req.headers.cookie || "";
  return cookie.split(";").reduce((acc, item) => {
    const idx = item.indexOf("=");
    if (idx > 0) acc[item.slice(0, idx).trim()] = decodeURIComponent(item.slice(idx + 1).trim());
    return acc;
  }, {});
}

function setCookie(res, name, value, maxAgeSec) {
  res.setHeader("Set-Cookie", `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSec}`);
}

function clearCookie(res, name) {
  res.setHeader("Set-Cookie", `${name}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
}

function getBearerToken(req) {
  const auth = req.headers.authorization || "";
  return auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";
}

function createSession(store, payload, ttl) {
  const token = crypto.randomUUID();
  store.set(token, { ...payload, expiresAt: Date.now() + ttl });
  return token;
}

function getSession(store, token) {
  if (!token) return null;
  const hit = store.get(token);
  if (!hit) return null;
  if (Date.now() > hit.expiresAt) {
    store.delete(token);
    return null;
  }
  return hit;
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  });
  res.end(JSON.stringify(data));
}

function sendHtml(res, html, code = 200) {
  res.writeHead(code, { "Content-Type": "text/html; charset=utf-8" });
  res.end(html);
}

function redirect(res, location) {
  const safeLocation = encodeURI(location);
  res.writeHead(302, { Location: safeLocation });
  res.end();
}

async function readBody(req) {
  const raw = await new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (c) => {
      body += c;
      if (body.length > 1024 * 1024) reject(new Error("payload too large"));
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
  const ctype = req.headers["content-type"] || "";
  if (ctype.includes("application/x-www-form-urlencoded")) {
    const params = new URLSearchParams(raw);
    const out = {};
    params.forEach((v, k) => {
      out[k] = v;
    });
    return out;
  }
  return safeJsonParse(raw || "{}", {});
}

function maskKey(key) {
  if (!key) return "";
  if (key.length <= 6) return "******";
  return `${key.slice(0, 3)}***${key.slice(-3)}`;
}

function escapeHtml(text) {
  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function staffAuth(req) {
  const token = parseCookies(req)[STAFF_COOKIE] || getBearerToken(req);
  const session = getSession(STAFF_SESSIONS, token);
  return session ? { token, ...session } : null;
}

function appAuth(req) {
  const token = getBearerToken(req);
  const session = getSession(APP_SESSIONS, token);
  return session ? { token, ...session } : null;
}

function filterUsers(users, q) {
  const k = String(q || "").trim().toLowerCase();
  if (!k) return users;
  return users.filter((u) =>
    String(u.account || "").toLowerCase().includes(k) ||
    String(u.phone || "").toLowerCase().includes(k) ||
    String(u.name || "").toLowerCase().includes(k)
  );
}

function allPayments(users) {
  const out = [];
  users.forEach((u) => (u.payments || []).forEach((p) => out.push({ ...p, userId: u.id, account: u.account, phone: u.phone, name: u.name })));
  return out.sort((a, b) => String(b.paidAt || "").localeCompare(String(a.paidAt || "")));
}

function findUserById(users, id) {
  return users.find((u) => u.id === id) || null;
}

function findUserByAccountOrPhone(users, text) {
  const t = String(text || "").trim();
  if (!t) return null;
  return users.find((u) => u.account === t || u.phone === t) || null;
}

function findReport(users, reportId) {
  for (const u of users) {
    const r = (u.reports || []).find((x) => x.id === reportId);
    if (r) return { user: u, report: r };
  }
  return null;
}

function findOrCreateUserByProfile(adminData, profile) {
  const account = String(profile.account || profile.username || profile.userName || profile.phone || "").trim();
  const phone = String(profile.phone || "").trim();
  const name = String(profile.name || profile.userName || "Anonymous User").trim() || "Anonymous User";
  const gender = String(profile.gender || "male");
  const age = Number(profile.age) || 26;
  let user = adminData.users.find((u) => (account && u.account === account) || (phone && u.phone === phone));
  if (!user) {
    user = {
      id: randomId("U"),
      account: account || `u${Date.now().toString().slice(-6)}`,
      phone,
      name,
      gender,
      age,
      appPasswordHash: hashPassword("123456"),
      latestAssessmentDate: "",
      reports: [],
      payments: []
    };
    adminData.users.unshift(user);
  }
  return user;
}

function ensureAdmin(staff) {
  return staff && staff.role === "admin";
}

function loginPage(msg) {
  return `<!doctype html><html><head><meta charset="utf-8"/><title>闂傚倸鍊搁崐鎼佸磹閹间礁纾瑰瀣捣閻棗銆掑锝呬壕濡ょ姷鍋涢ˇ鐢稿极閹剧粯鍋愰柛鎰级閻ゅ嫰姊绘担铏瑰笡闁告棑绠撳畷婊堟晝閳ь剟鍩㈤幘缁樺殟闁靛绠戝鍨攽閻樼粯娑ф俊顐ｇ矒閿濈偤鏁冮埀顒勬箒濠电姴锕ら崯鎵矓濞差亝鐓涚€光偓閳ь剟宕伴幘鑸殿潟闁圭儤顨呴～鍛存煟濡櫣锛嶅ù婊冪埣濮婄粯鎷呮笟顖滃姼婵°倗濮甸幃鍌炲箚瀹€鍕＜闁绘劘灏欓悾娲偡濠婂懎顣奸悽顖涘浮閹瑦绻濋崘锔跨盎闂婎偄娲﹂幐鎼侇敂椤愶絾鍙忛柨婵嗗暙閻忣喚绱?/title><style>body{font-family:Arial;background:#f2f6f2;display:flex;min-height:100vh;align-items:center;justify-content:center}.c{background:#fff;padding:20px;border-radius:10px;box-shadow:0 2px 10px rgba(0,0,0,.08);width:320px}input,button{width:100%;padding:10px;margin-top:10px;box-sizing:border-box}button{background:#2c7148;color:#fff;border:none}.e{color:#b3261e;font-size:13px;margin-top:8px}</style></head><body><div class="c"><h3>闂傚倸鍊搁崐鎼佸磹閹间礁纾瑰瀣捣閻棗銆掑锝呬壕濡ょ姷鍋涢ˇ鐢稿极閹剧粯鍋愰柛鎰级閻ゅ嫰姊绘担铏瑰笡闁告棑绠撳畷婊堟晝閳ь剟鍩㈤幘缁樺殟闁靛绠戝鍨攽閻樼粯娑ф俊顐ｇ矒閿濈偤鏁冮埀顒勬箒濠电姴锕ら崯鎵矓濞差亝鐓涚€光偓閳ь剟宕伴幘鑸殿潟闁圭儤顨呴～鍛存煟濡櫣锛嶅ù婊冪埣濮婄粯鎷呮笟顖滃姼婵°倗濮甸幃鍌炲箚瀹€鍕＜闁绘劘灏欓悾娲偡濠婂懎顣奸悽顖涘浮閹瑦绻濋崘锔跨盎闂婎偄娲﹂幐鎼侇敂椤愶絾鍙忛柨婵嗗暙閻忣喚绱?/h3><form method="post" action="/admin/login"><input name="username" placeholder="闂傚倸鍊搁崐鎼佸磹閹间礁纾归柣鎴ｅГ閸婂潡鏌ㄩ弴妤€浜惧銈庝簻閸熸潙鐣疯ぐ鎺濇晪闁告侗鍨版慨娲⒒娴ｄ警娼掗柛鏇炵仛閻ｅ墎绱撴担鎻掍壕婵犮垼娉涙径鍥磻閹捐崵宓侀柛顭戝枛婵骸顪冮妶蹇撶槣闁搞劏娉涢锝嗗閺夋嚦銊╂煥閺傚灝鈷旀い鏃€娲熷娲偡閹殿喗鎲奸梺鑽ゅ枂閸庣敻骞冨鈧崺锟犲川椤旈棿鐢?/><input type="password" name="password" placeholder="闂傚倸鍊搁崐鎼佸磹瀹勬噴褰掑炊椤掑鏅悷婊勬瀵粯绻濋崶銊︽珳闂佸憡绮堥懗鍫曞礉閻戣姤鍋℃繝濠傚暟鍟搁梺璇茬箰椤戝懘鍩為幋锔藉€烽柡澶嬪灩娴犙囨⒑閹肩偛濡芥俊鐐舵閻?/><button>闂傚倸鍊搁崐鎼佸磹閹间礁纾圭€瑰嫭鍣磋ぐ鎺戠倞妞ゆ帊绀侀崜顓烆渻閵堝棗濮х紒鐘冲灴閻涱噣濮€閵堝棛鍘撻柡澶屽仦婢瑰棝宕濆鍡愪簻闁哄倸鐏濋顐ょ磼?/button></form>${msg ? `<div class="e">${escapeHtml(msg)}</div>` : ""}<div style="font-size:12px;color:#666;margin-top:8px">admin/123456, operator/op123456</div></div></body></html>`;
}

function dashboardPage(staff, users, payments, tab, q, msg) {
  const query = escapeHtml(q || "");
  const userRows = users
    .map((u) => `<tr><td>${escapeHtml(u.account)}</td><td>${escapeHtml(u.phone)}</td><td>${escapeHtml(u.name)}</td><td>${escapeHtml(u.latestAssessmentDate || "-")}</td><td>${(u.reports || []).length}</td></tr>`)
    .join("");
  const payRows = payments
    .map((p) => `<tr><td>${escapeHtml(p.orderNo)}</td><td>${escapeHtml(p.name || "-")}</td><td>${escapeHtml(p.account || "-")}</td><td>${escapeHtml(p.phone || "-")}</td><td>${escapeHtml(p.planName || "-")}</td><td>${escapeHtml(p.amount || 0)}</td><td>${escapeHtml(p.status || "-")}</td><td>${escapeHtml(p.paidAt || "-")}</td></tr>`)
    .join("");

  const body = tab === "payments"
    ? `<h3>Payments</h3><table><tr><th>Order</th><th>Name</th><th>Account</th><th>Phone</th><th>Plan</th><th>Amount</th><th>Status</th><th>Paid At</th></tr>${payRows || "<tr><td colspan='8'>No data</td></tr>"}</table>`
    : `<h3>Users</h3><table><tr><th>Account</th><th>Phone</th><th>Name</th><th>Latest</th><th>Reports</th></tr>${userRows || "<tr><td colspan='5'>No data</td></tr>"}</table>`;

  return `<!doctype html><html><head><meta charset="utf-8"/><title>Admin</title><style>body{margin:0;font-family:Arial;background:#f5f7f5}.layout{display:flex;min-height:100vh}.side{width:220px;background:#1f4a32;color:#fff;padding:12px}.side a{display:block;color:#e3efe5;text-decoration:none;padding:9px;border-radius:6px}.side a.active{background:#2c7148}.main{flex:1;padding:14px}.top{background:#fff;padding:10px;border-radius:8px;display:flex;justify-content:space-between;align-items:center}form{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0}input{padding:8px}button{padding:8px;background:#2c7148;color:#fff;border:none;border-radius:4px}table{width:100%;border-collapse:collapse;background:#fff}td,th{border:1px solid #e6ece6;padding:8px;vertical-align:top}th{background:#eef4ee}.msg{color:#2c7148;margin:8px 0}</style></head><body><div class="layout"><aside class="side"><h3>Admin</h3><a class="${tab === "users" ? "active" : ""}" href="/admin?tab=users&q=${encodeURIComponent(q || "")}">Users</a><a class="${tab === "payments" ? "active" : ""}" href="/admin?tab=payments&q=${encodeURIComponent(q || "")}">Payments</a></aside><main class="main"><div class="top"><div>${escapeHtml(staff.displayName)} (${escapeHtml(staff.role)})</div><form method="post" action="/admin/logout"><button>Logout</button></form></div><form method="get" action="/admin"><input type="hidden" name="tab" value="${escapeHtml(tab)}"/><input name="q" value="${query}" placeholder="Search by account/phone/name"/><button>Search</button><a style="line-height:34px" href="/admin?tab=${escapeHtml(tab)}">Clear</a></form>${msg ? `<div class="msg">${escapeHtml(msg)}</div>` : ""}${body}</main></div></body></html>`;
}
function reportPage(staff, user, report) {
  if (!report) return "<h3>闂傚倸鍊搁崐鎼佸磹閹间礁纾归柣鎴ｅГ閸ゅ嫰鏌涢锝嗙８闁逞屽厸閻掞妇鎹㈠┑瀣妞ゆ挾濯Σ鍗炩攽閻愬瓨缍戦柛姘儏椤洤鈻庨幋婵愭闂佺鍕垫畷闁抽攱鍨堕妵鍕箳閸℃ぞ澹曠紓鍌欑椤︻垶顢氶鐘插灊濠电姵纰嶉崑鍕煕韫囨艾浜归柛妯绘崌濮婅櫣鈧湱濮甸妴鍐磼閳ь剚绗熼埀顒€顕ｉ幎鑺ュ亜闁稿繗鍋愰崢鎾剁磽閸屾瑧鍔嶉拑閬嶆煃闁垮娴柡灞界Х椤т線鏌涢幘瀵告噮缂侇喛顕ч鍏煎緞婵犲嫸绱甸梻鍌欑贰閸撴瑧绮旂€靛摜涓嶉柣妯肩帛閻撴瑩鏌ｅΔ鈧悧濠勬閼碱剛纾奸柣妯挎珪閵囨繈鏌″畝瀣埌閾伙綁鏌ゅù瀣珔缂佹绻濆?/h3><a href='/admin'>闂傚倸鍊搁崐鎼佸磹妞嬪海鐭嗗〒姘ｅ亾妤犵偞鐗犻、鏇氱秴闁搞儺鍓﹂弫鍐煥閺囨浜鹃梺姹囧€楅崑鎾舵崲濠靛洨绡€闁稿本绮岄。娲⒑閽樺鏆熼柛鐘崇墵瀵寮撮悢铏诡啎闂佸壊鐓堥崰鏍ㄧ珶?/a>";
  return `<!doctype html><html><head><meta charset="utf-8"/><title>闂傚倸鍊搁崐鎼佸磹閹间礁纾归柣鎴ｅГ閸ゅ嫰鏌涢锝嗙８闁逞屽厸閻掞妇鎹㈠┑瀣妞ゆ挾濯Σ鍗炩攽閻愬瓨缍戦柛姘儏椤洤鈻庨幋婵愭闂佺鍕垫畷闁抽攱鍨堕妵鍕箳閸℃ぞ澹曠紓鍌欑椤︻垶顢氶鐘插灊濠电姵纰嶉崑鍕煕韫囨艾浜归柛娆忔閳规垿鎮欓弶鎴犱桓闂佹寧纰嶉妵鍕疀閿濆嫰鍋楅梺璇″枟椤ㄥ懘锝炲┑瀣垫晣闁绘劕寮堕幊娆撴⒒娴ｅ憡鎯堥悶姘煎亰瀹曟繈骞嬪┑鎰濡炪倖娲嶉崑鎾垛偓瑙勬礀閻栧ジ鍨鹃敃鍌氱闁绘垵妫欓ˉ澶愭⒒?/title><style>body{font-family:Arial;background:#f5f7f5;padding:16px}pre{background:#111;color:#daf1df;padding:12px;border-radius:8px;overflow:auto}a{color:#2c7148}</style></head><body><a href="/admin">闂傚倸鍊搁崐鎼佸磹妞嬪海鐭嗗〒姘ｅ亾妤犵偞鐗犻、鏇氱秴闁搞儺鍓﹂弫鍐煥閺囨浜鹃梺姹囧€楅崑鎾舵崲濠靛洨绡€闁稿本绮岄。娲⒑閽樺鏆熼柛鐘崇墵瀵寮撮悢铏诡啎闂佸壊鐓堥崰鏍ㄧ珶閸曨偀鏀介柣鎰级閳绘洖霉濠婂嫮鐭掔€规洘锕㈤崺鈧い鎺嗗亾妞ゎ亜鍟存俊鍫曞幢濡儤娈梻浣侯焾椤戝洦鎱ㄦィ鍏熺兘宕掗悙绮规嫽婵炶揪绲肩拃锕傚绩娴煎瓨鐓曢悗锝庡亜婵鏌熼璇插祮濠碉紕鍏橀崺鈩冩媴閸濆嫬袝濠碉紕鍋戦崐鏍暜婵犲嫮鐭嗗〒姘ｅ亾闁糕斂鍨藉鎾閿涘嫬骞?/a><h3>闂傚倸鍊搁崐鎼佸磹閹间礁纾归柣鎴ｅГ閸ゅ嫰鏌涢锝嗙８闁逞屽厸閻掞妇鎹㈠┑瀣妞ゆ挾濯Σ鍗炩攽閻愬瓨缍戦柛姘儏椤洤鈻庨幋婵愭闂佺鍕垫畷闁抽攱鍨堕妵鍕箳閸℃ぞ澹曠紓鍌欑椤︻垶顢氶鐘插灊?${escapeHtml(report.id)}</h3><div>闂傚倸鍊搁崐鎼佸磹閹间礁纾瑰瀣捣閻棗銆掑锝呬壕濡ょ姷鍋為悧鐘汇€侀弴銏犖ч柛鈩冦仦缁剝淇婇悙顏勨偓鏍礉瑜忕划濠氬箣閻樺樊妫滈梺绉嗗嫷娈曢柣鎾存礋閺岀喖鏌囬敃鈧悘閬嶆煕閵堝拋鍎旈柡灞诲€濆鍫曞箰鎼粹€叉樊闂備礁鎼張顒傜矙閹达箑鐓″鑸靛姇绾偓闂佺粯鍔曢顓熺閻愵兛绻? ${escapeHtml(staff.username)} (${escapeHtml(staff.role)})</div><div>闂傚倸鍊搁崐鎼佸磹閹间礁纾归柣鎴ｅГ閸婂潡鏌ㄩ弴妤€浜惧銈庝簻閸熸潙鐣疯ぐ鎺濇晪闁告侗鍨版慨娲⒒娴ｄ警娼掗柛鏇炵仛閻ｅ墎绱撴担鎻掍壕婵犮垼娉涙径鍥磻閹捐崵宓侀柛顭戝枛婵骸顪冮妶蹇撶槣闁搞劏娉涢? ${escapeHtml(user.name)} (${escapeHtml(user.account)}) ${escapeHtml(user.phone)}</div><pre>${escapeHtml(JSON.stringify(report, null, 2))}</pre></body></html>`;
}

function sanitizeUser(u) {
  return { id: u.id, account: u.account, phone: u.phone, name: u.name, gender: u.gender, age: u.age, latestAssessmentDate: u.latestAssessmentDate || "" };
}

function generateMockReport(profile) {
  const p = profile || {};
  const main = "yang-def";
  return {
    id: `RPT-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    userName: p.name || "Anonymous User",
    gender: p.gender || "male",
    age: p.age || 26,
    createdAt: new Date().toISOString().slice(0, 10),
    score: 72,
    status: { tongue: "done", pulse: "pending", inquiry: "done", climate: "done" },
    constitution: { mainType: main, secondType: "qi-def", conclusion: "Sub-healthy tendency with qi deficiency.", bars: buildDefaultBars(main) },
    tongue: { summary: "Tongue is slightly pale with thin white coating.", findings: ["Possible qi-blood weakness", "Mild spleen deficiency tendency"] },
    inquiry: { summary: "Reports fatigue and light sleep." },
    pulse: { summary: "Pulse device not connected." },
    climate: { summary: "Seasonal dryness/wind suggests balanced routine and warm diet." },
    risk: { level: "medium", items: ["Digestive fluctuation risk", "Fatigue accumulation risk"] },
    plan: { diet: "Prefer warm meals and avoid cold/raw food.", routine: "Sleep before 23:00, exercise 3 times/week.", medicine: "Use personalized prescription after offline consultation." }
  };
}

function extractJsonFromText(rawText) {
  if (!rawText) return null;
  const fenced = rawText.match(/```json\s*([\s\S]*?)\s*```/i);
  if (fenced && fenced[1]) return safeJsonParse(fenced[1], null);
  return safeJsonParse(rawText, null);
}

async function callModel(provider, payload) {
  if (!provider || !provider.apiKey || !provider.baseUrl || !provider.model) return null;
  if (typeof fetch !== "function") return null;
  const prompt = {
    instruction: "Return only JSON that follows the schema.",
    schema: {
      constitution: { mainType: "", secondType: "", conclusion: "", bars: [] },
      tongue: { summary: "", findings: [] },
      inquiry: { summary: "" },
      pulse: { summary: "" },
      climate: { summary: "" },
      risk: { level: "", items: [] },
      plan: { diet: "", routine: "", medicine: "" },
      score: 0
    },
    input: payload
  };
  const resp = await fetch(provider.baseUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${provider.apiKey}`
    },
    body: JSON.stringify({
      model: provider.model,
      temperature: 0.2,
      messages: [
        { role: "system", content: "You are a TCM assistant. Output valid JSON only, no markdown." },
        { role: "user", content: JSON.stringify(prompt) }
      ]
    })
  });
  if (!resp.ok) return null;
  const data = await resp.json();
  const content = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
  return extractJsonFromText(content);
}

function mergeReport(base, ai) {
  if (!ai || typeof ai !== "object") return base;
  return {
    ...base,
    ...ai,
    id: base.id,
    userName: base.userName,
    gender: base.gender,
    age: base.age,
    createdAt: base.createdAt,
    status: base.status,
    constitution: { ...base.constitution, ...(ai.constitution || {}) },
    tongue: { ...base.tongue, ...(ai.tongue || {}) },
    inquiry: { ...base.inquiry, ...(ai.inquiry || {}) },
    pulse: { ...base.pulse, ...(ai.pulse || {}) },
    climate: { ...base.climate, ...(ai.climate || {}) },
    risk: { ...base.risk, ...(ai.risk || {}) },
    plan: { ...base.plan, ...(ai.plan || {}) },
    score: Number(ai.score) || base.score
  };
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    sendJson(res, 200, { ok: true });
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathName = url.pathname;
  const providers = loadProviders();
  const adminData = loadAdminData();

  if (req.method === "GET" && pathName === "/favicon.ico") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === "GET" && pathName === "/") {
    redirect(res, "/admin");
    return;
  }

  if (req.method === "GET" && pathName === "/admin/login") {
    sendHtml(res, loginPage(url.searchParams.get("err") || ""));
    return;
  }

  if (req.method === "POST" && pathName === "/admin/login") {
    const body = await readBody(req);
    const user = adminData.staffAccounts.find((s) => s.username === String(body.username || "").trim());
    if (!user || user.passwordHash !== hashPassword(body.password || "")) {
      redirect(res, "/admin/login?err=Invalid username or password");
      return;
    }
    const token = createSession(STAFF_SESSIONS, { staffId: user.id, username: user.username, displayName: user.displayName, role: user.role }, STAFF_TTL);
    setCookie(res, STAFF_COOKIE, token, Math.floor(STAFF_TTL / 1000));
    redirect(res, "/admin?tab=users");
    return;
  }

  if (req.method === "POST" && pathName === "/admin/logout") {
    const auth = staffAuth(req);
    if (auth) STAFF_SESSIONS.delete(auth.token);
    clearCookie(res, STAFF_COOKIE);
    redirect(res, "/admin/login");
    return;
  }

  if (req.method === "GET" && pathName === "/admin") {
    const staff = staffAuth(req);
    if (!staff) {
      redirect(res, "/admin/login");
      return;
    }
    const tab = url.searchParams.get("tab") === "payments" ? "payments" : "users";
    const q = url.searchParams.get("q") || "";
    const users = filterUsers(adminData.users, q);
    const payments = allPayments(users);
    sendHtml(res, dashboardPage(staff, users, payments, tab, q, url.searchParams.get("msg") || ""));
    return;
  }

  if (req.method === "GET" && pathName.startsWith("/admin/report/")) {
    const staff = staffAuth(req);
    if (!staff) {
      redirect(res, "/admin/login");
      return;
    }
    const id = decodeURIComponent(pathName.replace("/admin/report/", ""));
    const hit = findReport(adminData.users, id);
    sendHtml(res, reportPage(staff, hit && hit.user, hit && hit.report), hit ? 200 : 404);
    return;
  }

  if (req.method === "POST" && pathName === "/admin/users/create") {
    const staff = staffAuth(req);
    if (!staff) {
      redirect(res, "/admin/login");
      return;
    }
    if (!ensureAdmin(staff)) {
      redirect(res, "/admin?tab=users&msg=No permission");
      return;
    }
    const body = await readBody(req);
    const account = String(body.account || "").trim();
    const phone = String(body.phone || "").trim();
    const name = String(body.name || "").trim();
    if (!account || !phone || !name) {
      redirect(res, "/admin?tab=users&msg=Account, phone and name are required");
      return;
    }
    if (adminData.users.some((u) => u.account === account || u.phone === phone)) {
      redirect(res, "/admin?tab=users&msg=Account or phone already exists");
      return;
    }
    adminData.users.unshift({
      id: randomId("U"),
      account,
      phone,
      name,
      gender: String(body.gender || "male"),
      age: Number(body.age) || 26,
      appPasswordHash: hashPassword(body.password || "123456"),
      latestAssessmentDate: "",
      reports: [],
      payments: []
    });
    writeJson(ADMIN_FILE, adminData);
    redirect(res, "/admin?tab=users&msg=User created");
    return;
  }

  if (req.method === "POST" && pathName === "/admin/users/delete") {
    const staff = staffAuth(req);
    if (!staff) {
      redirect(res, "/admin/login");
      return;
    }
    if (!ensureAdmin(staff)) {
      redirect(res, "/admin?tab=users&msg=No permission");
      return;
    }
    const body = await readBody(req);
    adminData.users = adminData.users.filter((u) => u.id !== String(body.userId || ""));
    writeJson(ADMIN_FILE, adminData);
    redirect(res, "/admin?tab=users&msg=User deleted");
    return;
  }

  if (req.method === "POST" && pathName === "/admin/users/update") {
    const staff = staffAuth(req);
    if (!staff) {
      redirect(res, "/admin/login");
      return;
    }
    if (!ensureAdmin(staff)) {
      redirect(res, "/admin?tab=users&msg=No permission");
      return;
    }
    const body = await readBody(req);
    const user = findUserById(adminData.users, String(body.userId || ""));
    if (!user) {
      redirect(res, "/admin?tab=users&msg=User not found");
      return;
    }
    const nextPhone = String(body.phone || user.phone).trim();
    if (nextPhone && adminData.users.some((u) => u.id !== user.id && u.phone === nextPhone)) {
      redirect(res, "/admin?tab=users&msg=Phone already exists");
      return;
    }
    user.name = String(body.name || user.name).trim() || user.name;
    user.phone = nextPhone || user.phone;
    user.gender = String(body.gender || user.gender || "male").trim() || "male";
    user.age = Number(body.age) || user.age || 26;
    if (String(body.password || "").trim()) {
      user.appPasswordHash = hashPassword(String(body.password));
    }
    writeJson(ADMIN_FILE, adminData);
    redirect(res, "/admin?tab=users&msg=User updated");
    return;
  }

  if (req.method === "POST" && pathName === "/admin/payments/create") {
    const staff = staffAuth(req);
    if (!staff) {
      redirect(res, "/admin/login");
      return;
    }
    if (!ensureAdmin(staff)) {
      redirect(res, "/admin?tab=payments&msg=No permission");
      return;
    }
    const body = await readBody(req);
    const user = findUserById(adminData.users, String(body.userId || ""));
    if (!user) {
      redirect(res, "/admin?tab=payments&msg=User not found");
      return;
    }
    user.payments.unshift({
      id: randomId("PAY"),
      orderNo: String(body.orderNo || randomId("ORD")),
      planName: String(body.planName || "Unnamed plan"),
      amount: Number(body.amount) || 0,
      status: String(body.status || "paid"),
      paidAt: String(body.paidAt || new Date().toISOString().slice(0, 19).replace("T", " "))
    });
    writeJson(ADMIN_FILE, adminData);
    redirect(res, "/admin?tab=payments&msg=Payment created");
    return;
  }

  if (req.method === "POST" && pathName === "/admin/payments/delete") {
    const staff = staffAuth(req);
    if (!staff) {
      redirect(res, "/admin/login");
      return;
    }
    if (!ensureAdmin(staff)) {
      redirect(res, "/admin?tab=payments&msg=No permission");
      return;
    }
    const body = await readBody(req);
    const paymentId = String(body.paymentId || "");
    adminData.users.forEach((u) => {
      u.payments = (u.payments || []).filter((p) => p.id !== paymentId);
    });
    writeJson(ADMIN_FILE, adminData);
    redirect(res, "/admin?tab=payments&msg=Payment deleted");
    return;
  }

  if (req.method === "POST" && pathName === "/admin/payments/update") {
    const staff = staffAuth(req);
    if (!staff) {
      redirect(res, "/admin/login");
      return;
    }
    if (!ensureAdmin(staff)) {
      redirect(res, "/admin?tab=payments&msg=No permission");
      return;
    }
    const body = await readBody(req);
    const paymentId = String(body.paymentId || "");
    let hit = null;
    for (const u of adminData.users) {
      const p = (u.payments || []).find((item) => item.id === paymentId);
      if (p) {
        hit = p;
        break;
      }
    }
    if (!hit) {
      redirect(res, "/admin?tab=payments&msg=Payment not found");
      return;
    }
    hit.planName = String(body.planName || hit.planName);
    hit.amount = Number(body.amount) || hit.amount;
    hit.status = String(body.status || hit.status);
    hit.paidAt = String(body.paidAt || hit.paidAt);
    writeJson(ADMIN_FILE, adminData);
    redirect(res, "/admin?tab=payments&msg=Payment updated");
    return;
  }

  // app auth
  if (req.method === "POST" && pathName === "/api/auth/register") {
    const body = await readBody(req);
    const account = String(body.account || "").trim();
    const phone = String(body.phone || "").trim();
    const name = String(body.name || "").trim();
    const password = String(body.password || "");
    if (!account || !phone || !name || !password) {
      sendJson(res, 400, { message: "Account, phone, name and password are required" });
      return;
    }
    if (adminData.users.some((u) => u.account === account || u.phone === phone)) {
      sendJson(res, 400, { message: "Account or phone already exists" });
      return;
    }
    const user = {
      id: randomId("U"),
      account,
      phone,
      name,
      gender: String(body.gender || "male"),
      age: Number(body.age) || 26,
      appPasswordHash: hashPassword(password),
      latestAssessmentDate: "",
      reports: [],
      payments: []
    };
    adminData.users.unshift(user);
    writeJson(ADMIN_FILE, adminData);
    const token = createSession(APP_SESSIONS, { userId: user.id, account: user.account, phone: user.phone }, APP_TTL);
    sendJson(res, 200, { ok: true, token, user: sanitizeUser(user) });
    return;
  }

  if (req.method === "POST" && pathName === "/api/auth/login") {
    const body = await readBody(req);
    const accountOrPhone = String(body.accountOrPhone || "").trim();
    const password = String(body.password || "");
    const user = findUserByAccountOrPhone(adminData.users, accountOrPhone);
    if (!user || user.appPasswordHash !== hashPassword(password)) {
      sendJson(res, 401, { message: "Account/phone or password is invalid" });
      return;
    }
    const token = createSession(APP_SESSIONS, { userId: user.id, account: user.account, phone: user.phone }, APP_TTL);
    sendJson(res, 200, { ok: true, token, user: sanitizeUser(user) });
    return;
  }

  if (req.method === "POST" && pathName === "/api/auth/logout") {
    const auth = appAuth(req);
    if (auth) APP_SESSIONS.delete(auth.token);
    sendJson(res, 200, { ok: true });
    return;
  }

  if (req.method === "GET" && pathName === "/api/auth/me") {
    const auth = appAuth(req);
    if (!auth) {
      sendJson(res, 401, { message: "Not logged in" });
      return;
    }
    const user = findUserById(adminData.users, auth.userId);
    if (!user) {
      sendJson(res, 401, { message: "User not found" });
      return;
    }
    sendJson(res, 200, { ok: true, user: sanitizeUser(user) });
    return;
  }

  if (req.method === "GET" && pathName === "/api/user/reports") {
    const auth = appAuth(req);
    if (!auth) {
      sendJson(res, 401, { message: "Not logged in" });
      return;
    }
    const user = findUserById(adminData.users, auth.userId);
    if (!user) {
      sendJson(res, 404, { message: "User not found" });
      return;
    }
    const reports = (user.reports || []).slice().sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    sendJson(res, 200, { ok: true, user: sanitizeUser(user), latestAssessmentDate: user.latestAssessmentDate || "", reports });
    return;
  }

  // admin query api (login required)
  if (req.method === "GET" && pathName === "/api/admin/users") {
    const staff = staffAuth(req);
    if (!staff) {
      sendJson(res, 401, { message: "Not authorized" });
      return;
    }
    const users = filterUsers(adminData.users, url.searchParams.get("q") || "");
    sendJson(res, 200, { total: users.length, role: staff.role, users: users.map((u) => ({ ...sanitizeUser(u), reports: u.reports || [], payments: u.payments || [] })) });
    return;
  }

  if (req.method === "GET" && pathName === "/api/admin/payments") {
    const staff = staffAuth(req);
    if (!staff) {
      sendJson(res, 401, { message: "Not authorized" });
      return;
    }
    const users = filterUsers(adminData.users, url.searchParams.get("q") || "");
    sendJson(res, 200, { total: allPayments(users).length, role: staff.role, payments: allPayments(users) });
    return;
  }

  if (req.method === "GET" && pathName.startsWith("/api/admin/report/")) {
    const staff = staffAuth(req);
    if (!staff) {
      sendJson(res, 401, { message: "Not authorized" });
      return;
    }
    const hit = findReport(adminData.users, decodeURIComponent(pathName.replace("/api/admin/report/", "")));
    if (!hit) {
      sendJson(res, 404, { message: "Not found" });
      return;
    }
    sendJson(res, 200, { role: staff.role, user: sanitizeUser(hit.user), report: hit.report });
    return;
  }

  if (req.method === "POST" && pathName === "/api/admin/users/create") {
    const staff = staffAuth(req);
    if (!staff) {
      sendJson(res, 401, { message: "Not authorized" });
      return;
    }
    if (!ensureAdmin(staff)) {
      sendJson(res, 403, { message: "Forbidden" });
      return;
    }
    const body = await readBody(req);
    const account = String(body.account || "").trim();
    const phone = String(body.phone || "").trim();
    const name = String(body.name || "").trim();
    if (!account || !phone || !name) {
      sendJson(res, 400, { message: "Invalid request" });
      return;
    }
    if (adminData.users.some((u) => u.account === account || u.phone === phone)) {
      sendJson(res, 400, { message: "Invalid request" });
      return;
    }
    const user = {
      id: randomId("U"),
      account,
      phone,
      name,
      gender: String(body.gender || "male"),
      age: Number(body.age) || 26,
      appPasswordHash: hashPassword(body.password || "123456"),
      latestAssessmentDate: "",
      reports: [],
      payments: []
    };
    adminData.users.unshift(user);
    writeJson(ADMIN_FILE, adminData);
    sendJson(res, 200, { ok: true, user: sanitizeUser(user) });
    return;
  }

  if (req.method === "POST" && pathName === "/api/admin/users/delete") {
    const staff = staffAuth(req);
    if (!staff) {
      sendJson(res, 401, { message: "Not authorized" });
      return;
    }
    if (!ensureAdmin(staff)) {
      sendJson(res, 403, { message: "Forbidden" });
      return;
    }
    const body = await readBody(req);
    const userId = String(body.userId || "");
    const before = adminData.users.length;
    adminData.users = adminData.users.filter((u) => u.id !== userId);
    if (before === adminData.users.length) {
      sendJson(res, 404, { message: "Not found" });
      return;
    }
    writeJson(ADMIN_FILE, adminData);
    sendJson(res, 200, { ok: true });
    return;
  }

  if (req.method === "POST" && pathName === "/api/admin/users/update") {
    const staff = staffAuth(req);
    if (!staff) {
      sendJson(res, 401, { message: "Not authorized" });
      return;
    }
    if (!ensureAdmin(staff)) {
      sendJson(res, 403, { message: "Forbidden" });
      return;
    }
    const body = await readBody(req);
    const user = findUserById(adminData.users, String(body.userId || ""));
    if (!user) {
      sendJson(res, 404, { message: "Not found" });
      return;
    }
    const nextPhone = String(body.phone || user.phone).trim();
    if (
      nextPhone &&
      adminData.users.some((u) => u.id !== user.id && u.phone === nextPhone)
    ) {
      sendJson(res, 400, { message: "Invalid request" });
      return;
    }
    user.name = String(body.name || user.name).trim() || user.name;
    user.phone = nextPhone || user.phone;
    user.gender = String(body.gender || user.gender || "male").trim() || "male";
    user.age = Number(body.age) || user.age || 26;
    if (String(body.password || "").trim()) {
      user.appPasswordHash = hashPassword(String(body.password));
    }
    writeJson(ADMIN_FILE, adminData);
    sendJson(res, 200, { ok: true, user: sanitizeUser(user) });
    return;
  }

  if (req.method === "POST" && pathName === "/api/admin/payments/update") {
    const staff = staffAuth(req);
    if (!staff) {
      sendJson(res, 401, { message: "Not authorized" });
      return;
    }
    if (!ensureAdmin(staff)) {
      sendJson(res, 403, { message: "Forbidden" });
      return;
    }
    const body = await readBody(req);
    const paymentId = String(body.paymentId || "");
    let hit = null;
    for (const u of adminData.users) {
      const p = (u.payments || []).find((item) => item.id === paymentId);
      if (p) {
        hit = p;
        break;
      }
    }
    if (!hit) {
      sendJson(res, 404, { message: "Not found" });
      return;
    }
    hit.planName = String(body.planName || hit.planName);
    hit.amount = Number(body.amount) || hit.amount;
    hit.status = String(body.status || hit.status);
    hit.paidAt = String(body.paidAt || hit.paidAt);
    writeJson(ADMIN_FILE, adminData);
    sendJson(res, 200, { ok: true, payment: hit });
    return;
  }

  if (req.method === "POST" && pathName === "/api/admin/payments/create") {
    const staff = staffAuth(req);
    if (!staff) {
      sendJson(res, 401, { message: "Not authorized" });
      return;
    }
    if (!ensureAdmin(staff)) {
      sendJson(res, 403, { message: "Forbidden" });
      return;
    }
    const body = await readBody(req);
    const user = findUserById(adminData.users, String(body.userId || ""));
    if (!user) {
      sendJson(res, 404, { message: "Not found" });
      return;
    }
    const payment = {
      id: randomId("PAY"),
      orderNo: String(body.orderNo || randomId("ORD")),
      planName: String(body.planName || "Plan"),
      amount: Number(body.amount) || 0,
      status: String(body.status || "pending"),
      paidAt: String(body.paidAt || new Date().toISOString().slice(0, 19).replace("T", " "))
    };
    user.payments.unshift(payment);
    writeJson(ADMIN_FILE, adminData);
    sendJson(res, 200, { ok: true, payment });
    return;
  }

  if (req.method === "POST" && pathName === "/api/admin/payments/delete") {
    const staff = staffAuth(req);
    if (!staff) {
      sendJson(res, 401, { message: "Not authorized" });
      return;
    }
    if (!ensureAdmin(staff)) {
      sendJson(res, 403, { message: "Forbidden" });
      return;
    }
    const body = await readBody(req);
    const paymentId = String(body.paymentId || "");
    let removed = false;
    adminData.users.forEach((u) => {
      const before = (u.payments || []).length;
      u.payments = (u.payments || []).filter((p) => p.id !== paymentId);
      if ((u.payments || []).length !== before) removed = true;
    });
    if (!removed) {
      sendJson(res, 404, { message: "Not found" });
      return;
    }
    writeJson(ADMIN_FILE, adminData);
    sendJson(res, 200, { ok: true });
    return;
  }

  // ai endpoints used by app
  if (req.method === "GET" && pathName === "/api/health") {
    sendJson(res, 200, { ok: true, time: new Date().toISOString() });
    return;
  }

  if (req.method === "GET" && pathName === "/api/providers") {
    const out = {};
    Object.keys(providers).forEach((k) => {
      out[k] = { ...providers[k], hasApiKey: Boolean(providers[k].apiKey), apiKeyMasked: maskKey(providers[k].apiKey), apiKey: "" };
    });
    sendJson(res, 200, { providers: out });
    return;
  }

  if (req.method === "POST" && pathName === "/api/providers") {
    const body = await readBody(req);
    const provider = body.provider;
    if (!provider || !providers[provider]) {
      sendJson(res, 400, { message: "provider is required and must be configured" });
      return;
    }
    providers[provider] = {
      ...providers[provider],
      baseUrl: body.baseUrl || providers[provider].baseUrl,
      model: body.model || providers[provider].model,
      apiKey: body.apiKey || providers[provider].apiKey,
      updatedAt: new Date().toISOString()
    };
    saveProviders(providers);
    sendJson(res, 200, { ok: true, provider, savedAt: providers[provider].updatedAt });
    return;
  }

  if (req.method === "POST" && pathName === "/api/report/generate") {
    const body = await readBody(req);
    const auth = appAuth(req);
    let user = null;
    let profile = body.profile || {};
    if (auth) {
      user = findUserById(adminData.users, auth.userId);
      if (user) {
        profile = { account: user.account, phone: user.phone, name: user.name, gender: user.gender, age: user.age };
      }
    }
    const reportBase = generateMockReport(profile);
    const provider = providers[body.provider || "deepseek"] || providers.deepseek;
    const aiResult = await callModel(provider, { ...body, profile });
    const report = mergeReport(reportBase, aiResult);
    if (!user) {
      user = findOrCreateUserByProfile(adminData, profile);
    }
    user.latestAssessmentDate = report.createdAt;
    user.reports = [report, ...(user.reports || []).filter((r) => r.id !== report.id)];
    writeJson(ADMIN_FILE, adminData);
    sendJson(res, 200, { report, user: sanitizeUser(user), traceId: crypto.randomUUID() });
    return;
  }

  sendJson(res, 404, { message: "Not Found" });
});

server.listen(PORT, () => {
  console.log(`AI TCM backend listening on http://127.0.0.1:${PORT}`);
});
