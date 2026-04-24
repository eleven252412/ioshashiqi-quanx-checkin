const CONFIG = {
  baseUrl: 'https://vip.ioshashiqi.com',
  loginPage: 'https://vip.ioshashiqi.com/aspx3/mobile/login.aspx',
  userCenterPage: 'https://vip.ioshashiqi.com/aspx3/mobile/usercenter.aspx?action=index',
  signPage: 'https://vip.ioshashiqi.com/aspx3/mobile/qiandao.aspx',
  honorApi: 'https://vip.ioshashiqi.com/ashx/Honor.ashx',
  userAgent:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
  timeout: 20000,
  cookieKey: 'ioshashiqi_cookie',
  captureNotifyKey: 'ioshashiqi_cookie_last_notify',
  captureDailySeenKey: 'ioshashiqi_cookie_daily_seen',
  captureMissNotifyKey: 'ioshashiqi_cookie_miss_daily_seen',
  captureHitNotifyKey: 'ioshashiqi_cookie_hit_daily_seen',
  captureNotifyCooldownMs: 15000,
  login: {
    username: '',
    password: ''
  }
};

function readCookieStore() {
  return ($prefs.valueForKey(CONFIG.cookieKey) || '').trim();
}
function saveCookieStore(cookie) {
  if (!cookie) return false;
  const current = readCookieStore();
  if (current === cookie) return false;
  return $prefs.setValueForKey(cookie, CONFIG.cookieKey);
}
function parseCookieString(cookie) {
  const jar = new Map();
  String(cookie || '').split(';').map((item) => item.trim()).filter(Boolean).forEach((item) => {
    const idx = item.indexOf('=');
    if (idx <= 0) return;
    const name = item.slice(0, idx).trim();
    const value = item.slice(idx + 1).trim();
    if (name) jar.set(name, value);
  });
  return jar;
}
function stringifyCookieJar(jar) {
  return Array.from(jar.entries()).map(([name, value]) => `${name}=${value}`).join('; ');
}
function normalizeSetCookie(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    return raw.split(/\n|,(?=[^;]+?=)/).map((item) => item.trim()).filter(Boolean);
  }
  return [];
}
function mergeSetCookie(cookie, setCookieHeaders) {
  const jar = parseCookieString(cookie);
  for (const line of normalizeSetCookie(setCookieHeaders)) {
    const first = String(line || '').split(';')[0].trim();
    const idx = first.indexOf('=');
    if (idx <= 0) continue;
    const name = first.slice(0, idx).trim();
    const value = first.slice(idx + 1).trim();
    if (!name) continue;
    if (!value || /^deleted$/i.test(value)) jar.delete(name); else jar.set(name, value);
  }
  return stringifyCookieJar(jar);
}
function getHeader(headers, name) {
  if (!headers) return undefined;
  const lower = String(name).toLowerCase();
  for (const key of Object.keys(headers)) {
    if (String(key).toLowerCase() === lower) return headers[key];
  }
  return undefined;
}
function cleanText(text) {
  return String(text || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
}
function notify(title, subtitle, body) { $notify(title, subtitle || '', body || ''); }
function shouldNotifyCapture() {
  const now = Date.now();
  const last = Number($prefs.valueForKey(CONFIG.captureNotifyKey) || '0');
  if (now - last < CONFIG.captureNotifyCooldownMs) return false;
  $prefs.setValueForKey(String(now), CONFIG.captureNotifyKey);
  return true;
}
function shouldNotifyDailyCookieSeen() {
  const today = new Date().toISOString().slice(0, 10);
  const last = $prefs.valueForKey(CONFIG.captureDailySeenKey) || '';
  if (last === today) return false;
  $prefs.setValueForKey(today, CONFIG.captureDailySeenKey);
  return true;
}
function shouldNotifyDailyCaptureMiss() {
  const today = new Date().toISOString().slice(0, 10);
  const last = $prefs.valueForKey(CONFIG.captureMissNotifyKey) || '';
  if (last === today) return false;
  $prefs.setValueForKey(today, CONFIG.captureMissNotifyKey);
  return true;
}

function shouldNotifyDailyCaptureHit() {
  const today = new Date().toISOString().slice(0, 10);
  const last = $prefs.valueForKey(CONFIG.captureHitNotifyKey) || '';
  if (last === today) return false;
  $prefs.setValueForKey(today, CONFIG.captureHitNotifyKey);
  return true;
}
function extractUsefulCookie(rawCookie) {
  const jar = parseCookieString(rawCookie);
  const picked = new Map();
  for (const [name, value] of jar.entries()) {
    if (!name || !value) continue;
    picked.set(name, value);
  }
  return stringifyCookieJar(picked);
}
function hasLoginCookie(cookie) {
  const jar = parseCookieString(cookie);
  return jar.has('ASP.NET_SessionId');
}
async function request({ url, method = 'GET', headers = {}, body = '', cookie = '' }) {
  const reqHeaders = Object.assign({ 'User-Agent': CONFIG.userAgent, Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8' }, headers);
  if (cookie) reqHeaders.Cookie = cookie;
  const resp = await $task.fetch({ url, method, headers: reqHeaders, body, opts: { redirection: true }, timeout: CONFIG.timeout });
  return { statusCode: resp.statusCode, headers: resp.headers || {}, body: resp.body || '', cookie: mergeSetCookie(cookie, getHeader(resp.headers, 'set-cookie')) };
}
async function fetchText(state, url, headers = {}) {
  const resp = await request({ url, headers, cookie: state.cookie });
  state.cookie = resp.cookie;
  saveCookieStore(state.cookie);
  if (resp.statusCode < 200 || resp.statusCode >= 400) throw new Error(`请求失败：${resp.statusCode} ${url}`);
  return resp.body;
}
async function postForm(state, url, data, headers = {}) {
  const body = Object.keys(data).map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(data[key] ?? '')}`).join('&');
  const resp = await request({ url, method: 'POST', headers: Object.assign({ 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8', Origin: CONFIG.baseUrl, Referer: url }, headers), body, cookie: state.cookie });
  state.cookie = resp.cookie;
  saveCookieStore(state.cookie);
  if (resp.statusCode < 200 || resp.statusCode >= 400) throw new Error(`提交失败：${resp.statusCode} ${url}`);
  return resp.body;
}
function parseInputValue(html, name) {
  const regex = new RegExp(`name=["']${name}["'][^>]*value=["']([^"']*)["']`, 'i');
  const match = html.match(regex);
  return match ? match[1] : '';
}
function looksLoggedOut(html) {
  const text = cleanText(html);
  return text.includes('立即登录') || text.includes('账号登录') || text.includes('vip下载中心');
}
function parseUserId(html) {
  const match = html.match(/ID:\s*([0-9]{5,})/i);
  return match ? match[1] : '';
}

function parseTotalDogfood(html) {
  const match = html.match(/balance-amount[^>]*>([0-9]+)狗粮</i);
  return match ? Number(match[1]) : null;
}
function parseSignState(raw) {
  let data;
  try { data = JSON.parse(raw); } catch (e) { return { status: 'error', detail: `状态接口不是 JSON：${cleanText(raw).slice(0, 200)}` }; }
  const signedToday = String(data.signedToday || '').toLowerCase() === 'true';
  const continuousDays = Number(data.continuousDays || 0);
  const addjifen = Number(data.addjifen || 0);
  const signedDates = Array.isArray(data.signedDates) ? data.signedDates : [];
  return { status: signedToday ? 'already' : 'pending', detail: signedToday ? '今日已签到' : '今日未签到', signedToday, continuousDays, addjifen, signedDates };
}
async function getSignState(state) {
  const nowmonth = String(new Date().getMonth() + 1);
  const raw = await postForm(state, CONFIG.honorApi, { control: 'list', nowmonth }, { Referer: CONFIG.signPage, Origin: CONFIG.baseUrl, Accept: 'application/json, text/javascript, */*; q=0.01', 'X-Requested-With': 'XMLHttpRequest' });
  return parseSignState(raw);
}
async function loginWithPassword(state) {
  if (!CONFIG.login.username || !CONFIG.login.password) throw new Error('cookie 已失效，且未配置账号密码');
  const loginHtml = await fetchText(state, CONFIG.loginPage);
  const viewstate = parseInputValue(loginHtml, '__VIEWSTATE');
  const viewstateGenerator = parseInputValue(loginHtml, '__VIEWSTATEGENERATOR');
  if (!viewstate || !viewstateGenerator) throw new Error('登录页字段解析失败');
  await postForm(state, CONFIG.loginPage, { __EVENTTARGET: 'btnLogin', __EVENTARGUMENT: '', __VIEWSTATE: viewstate, __VIEWSTATEGENERATOR: viewstateGenerator, txtUser_sign_in: CONFIG.login.username, txtPwd_sign_in: CONFIG.login.password, save_pass: 'on' }, { Referer: CONFIG.loginPage });
  const userCenterHtml = await fetchText(state, CONFIG.userCenterPage);
  if (looksLoggedOut(userCenterHtml)) throw new Error('账号密码登录后仍未进入登录态，请检查账号/密码');
  return parseUserId(userCenterHtml) || CONFIG.login.username;
}
function captureCookieMode() {
  const req = typeof $request !== 'undefined' ? $request : null;
  if (!req || !req.headers) return false;
  const url = req.url || '';
  const host = url.match(/^https?:\/\/([^/]+)/i);
  if (!host || !/^vip\.ioshashiqi\.com$/i.test(host[1])) return false;
  const path = url.replace(/^https?:\/\/[^/]+/i, '') || '/';
  const isCapturePage = path.startsWith('/aspx3/mobile/');
  if (!isCapturePage) return false;
  const rawCookie = getHeader(req.headers, 'cookie') || '';
  const usefulCookie = extractUsefulCookie(rawCookie);
  if (!rawCookie) {
    if (shouldNotifyDailyCaptureMiss()) notify('哈士奇 Cookie 抓取', '已命中页面但未带 Cookie', `已命中：${path}`);
    $done({});
    return true;
  }
  if (!usefulCookie || !hasLoginCookie(usefulCookie)) {
    if (shouldNotifyDailyCaptureMiss()) notify('哈士奇 Cookie 抓取', '未拿到完整登录态', `已命中：${path}，但当前请求里没有识别到 ASP.NET_SessionId`);
    $done({});
    return true;
  }
  const changed = saveCookieStore(usefulCookie);
  if (changed && shouldNotifyCapture()) {
    notify('哈士奇 Cookie 抓取', '成功', '已保存到 QuanX 本地存档');
  } else if (!changed && shouldNotifyDailyCookieSeen()) {
    notify('哈士奇 Cookie 状态', '仍有效', '本地 cookie 未变化，今天已确认仍可读取');
  }
  $done({});
  return true;
}
async function main() {
  if (typeof $request !== 'undefined') { captureCookieMode(); return; }
  const storedCookie = readCookieStore();
  if (!storedCookie) throw new Error('当前没有本地 cookie，请先在 QuanX 打开哈士奇会员中心或签到页并抓取 cookie');
  const state = { cookie: storedCookie };
  let userCenterHtml = await fetchText(state, CONFIG.userCenterPage);
  let userId = parseUserId(userCenterHtml);
  let totalDogfood = parseTotalDogfood(userCenterHtml);
  if (looksLoggedOut(userCenterHtml)) {
    userId = await loginWithPassword(state);
    userCenterHtml = await fetchText(state, CONFIG.userCenterPage);
    totalDogfood = parseTotalDogfood(userCenterHtml);
  }
  const signPageHtml = await fetchText(state, CONFIG.signPage);
  if (looksLoggedOut(signPageHtml)) throw new Error('本地 cookie 已失效，请重新打开登录页或会员中心抓取新 cookie');
  let signState = await getSignState(state);
  if (signState.status === 'error') throw new Error(signState.detail);
  if (signState.signedToday) {
    const msg = [`今天已签：${userId || 'unknown'}`, `连续签到：${signState.continuousDays}天`, `今日奖励：${signState.addjifen}狗粮`, totalDogfood === null ? '' : `累计狗粮：${totalDogfood}狗粮`, CONFIG.signPage].filter(Boolean).join('\n');
    console.log('RESULT: ALREADY');
    console.log(`DETAIL: ${signState.detail}`);
    notify('哈士奇签到', '已签到', msg);
    return;
  }
  const viewstate = parseInputValue(signPageHtml, '__VIEWSTATE');
  const viewstateGenerator = parseInputValue(signPageHtml, '__VIEWSTATEGENERATOR');
  if (!viewstate || !viewstateGenerator) throw new Error('签到页字段解析失败');
  await postForm(state, CONFIG.signPage, { __EVENTTARGET: '_lbtqd', __EVENTARGUMENT: '', __VIEWSTATE: viewstate, __VIEWSTATEGENERATOR: viewstateGenerator }, { Referer: CONFIG.signPage });
  signState = await getSignState(state);
  userCenterHtml = await fetchText(state, CONFIG.userCenterPage);
  totalDogfood = parseTotalDogfood(userCenterHtml);
  if (signState.signedToday) {
    const msg = [`签到成功：${userId || 'unknown'}`, `连续签到：${signState.continuousDays}天`, `今日奖励：${signState.addjifen}狗粮`, totalDogfood === null ? '' : `累计狗粮：${totalDogfood}狗粮`, CONFIG.signPage].filter(Boolean).join('\n');
    console.log('RESULT: SUCCESS');
    console.log(`DETAIL: continuousDays=${signState.continuousDays}; addjifen=${signState.addjifen}; totalDogfood=${totalDogfood}`);
    notify('哈士奇签到', '成功', msg);
    return;
  }
  throw new Error(`提交后状态仍未变更：${signState.detail}`);
}
main().catch((error) => {
  const message = `签到异常：${error.message || error}`;
  console.log('RESULT: ERROR');
  console.log(`DETAIL: ${error.message || error}`);
  notify('哈士奇签到', '异常', message);
}).finally(() => { if (typeof $request === 'undefined') $done(); });
