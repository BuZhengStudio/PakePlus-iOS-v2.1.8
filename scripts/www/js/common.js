/**
 * 公共逻辑：编号生成、验证等
 */
const Common = {
  /** 生成 4 位签到编号 */
  formatCheckinNo(n) {
    if (n < 1 || n > 1500) return null;
    return String(n).padStart(4, '0');
  },

  /** 验证手机号 */
  validatePhone(phone) {
    const cleaned = String(phone).replace(/\D/g, '');
    return cleaned.length >= 11;
  },

  /** 标准化手机号（去除非数字） */
  normalizePhone(phone) {
    return String(phone).replace(/\D/g, '');
  },

  /** 生成唯一 ID */
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
  }
};
