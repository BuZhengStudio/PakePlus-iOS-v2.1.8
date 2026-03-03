/**
 * 登录态：花名+手机号，记住到 LocalStorage（方案 A）
 */
const LOGIN_KEY = 'annual_meeting_login';

function getLoginUser() {
  try {
    const raw = localStorage.getItem(LOGIN_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw);
    if (o && o.phone) return { name: o.name || '', phone: String(o.phone) };
  } catch (_) {}
  return null;
}

function setLoginUser(name, phone) {
  localStorage.setItem(LOGIN_KEY, JSON.stringify({
    name: String(name || '').trim(),
    phone: String(phone || '').trim()
  }));
}

function clearLoginUser() {
  localStorage.removeItem(LOGIN_KEY);
}
