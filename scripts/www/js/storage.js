/**
 * 数据层抽象：统一接口，支持 LocalStorage 与后端切换
 * USE_BACKEND = true 时，改为调用后端 API（需配合 storage-backend.js）
 */
const USE_BACKEND = false;

const STORAGE_KEY = 'annual_meeting_data';

const defaultData = () => ({
  registrations: [],
  nextCheckinNo: 1
});

// ---------- LocalStorage 实现 ----------
const LocalStorageAdapter = {
  _load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultData();
      const parsed = JSON.parse(raw);
      return {
        registrations: parsed.registrations || [],
        nextCheckinNo: parsed.nextCheckinNo ?? 1
      };
    } catch {
      return defaultData();
    }
  },

  _save(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  },

  submitRegistration(info) {
    const data = this._load();
    const id = Common.generateId();
    const phone = Common.normalizePhone(info.phone);
    if (data.registrations.some(r => Common.normalizePhone(r.phone) === phone)) {
      return { ok: false, message: '该手机号已报名' };
    }
    const team = (info.team != null && info.team !== '') ? String(info.team).trim() : (info.department != null ? String(info.department).trim() : '');
    data.registrations.push({
      id,
      name: String(info.name).trim(),
      phone,
      team,
      base: info.base ? String(info.base).trim() : '',
      position: info.position ? String(info.position).trim() : '',
      status: 'pending',
      checkinNo: null,
      createdAt: new Date().toISOString()
    });
    this._save(data);
    return { ok: true, id };
  },

  getRegistration(phoneOrId) {
    const data = this._load();
    const key = String(phoneOrId).trim();
    const normalized = Common.normalizePhone(key);
    const r = data.registrations.find(
      x => x.id === key || Common.normalizePhone(x.phone) === normalized
    );
    return r ? { ...r } : null;
  },

  submitCheckin(phoneOrId) {
    const data = this._load();
    const key = String(phoneOrId).trim();
    const normalized = Common.normalizePhone(key);
    const idx = data.registrations.findIndex(
      x => x.id === key || Common.normalizePhone(x.phone) === normalized
    );
    if (idx === -1) return { ok: false, message: '未找到报名信息' };
    const r = data.registrations[idx];
    if (r.status !== 'approved') return { ok: false, message: '请先通过审核后再签到' };
    if (r.checkinNo) return { ok: false, message: '您已签到，编号：' + r.checkinNo };
    if (data.nextCheckinNo > 1500) return { ok: false, message: '签到人数已满' };

    const no = Common.formatCheckinNo(data.nextCheckinNo);
    data.registrations[idx].checkinNo = no;
    data.nextCheckinNo += 1;
    this._save(data);
    return { ok: true, name: r.name, checkinNo: no };
  },

  adminGetAll() {
    const data = this._load();
    return [...data.registrations];
  },

  adminApprove(id, approved) {
    const data = this._load();
    const idx = data.registrations.findIndex(x => x.id === id);
    if (idx === -1) return { ok: false };
    data.registrations[idx].status = approved ? 'approved' : 'rejected';
    this._save(data);
    return { ok: true };
  },

  adminDelete(id) {
    const data = this._load();
    const idx = data.registrations.findIndex(x => x.id === id);
    if (idx === -1) return { ok: false };
    data.registrations.splice(idx, 1);
    this._save(data);
    return { ok: true };
  },

  adminExport() {
    const list = this.adminGetAll();
    return list.map(r => ({
      花名: r.name,
      手机号: r.phone,
      所属团队: r.team || r.department || '',
      基地: r.base || '',
      职位: r.position || '',
      报名状态: r.status === 'pending' ? '待审核' : r.status === 'approved' ? '审核通过' : '审核不通过',
      签到状态: r.checkinNo ? '已签到' : '未签到',
      签到编号: r.checkinNo || ''
    }));
  }
};

// ---------- 天气提示（管理员可配置） ----------
const WEATHER_KEY = 'annual_meeting_weather_tip';
LocalStorageAdapter.getWeatherTip = function() {
  return localStorage.getItem(WEATHER_KEY) || '';
};
LocalStorageAdapter.setWeatherTip = function(text) {
  localStorage.setItem(WEATHER_KEY, String(text || ''));
};

// ---------- 统一 DataService（当前使用 LocalStorage） ----------
const DataService = USE_BACKEND
  ? (typeof BackendDataService !== 'undefined' ? BackendDataService : LocalStorageAdapter)
  : LocalStorageAdapter;
