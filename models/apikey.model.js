const { DataTypes } = require('sequelize');
const sequelize = require('../config/db.config');

/**
 * نموذج مفتاح API
 * يتم استخدامه للتحقق من صحة طلبات API
 */
const ApiKey = sequelize.define('ApiKey', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'اسم المستخدم أو الخدمة التي تستخدم المفتاح'
  },
  key: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    comment: 'مفتاح API الفريد'
  },
  expiryDate: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'تاريخ انتهاء صلاحية المفتاح'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'حالة تفعيل المفتاح'
  },
  lastUsed: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'آخر استخدام للمفتاح'
  },
  usageCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'عدد مرات استخدام المفتاح'
  }
}, {
  timestamps: true,
  comment: 'نموذج مفاتيح API لتأمين الوصول إلى واجهات البرمجة'
});

/**
 * تحديث بيانات استخدام المفتاح
 * @param {string} key - مفتاح API المستخدم
 * @returns {Promise<boolean>} - نجاح أو فشل التحديث
 */
ApiKey.prototype.updateUsage = async function() {
  this.lastUsed = new Date();
  this.usageCount += 1;
  await this.save();
  return this;
}

/**
 * التحقق من صلاحية المفتاح
 * @param {string} apiKey - مفتاح API للتحقق
 * @returns {Promise<Object|null>} - كائن المفتاح إذا كان صالحًا، وإلا null
 */
ApiKey.validateKey = async function(apiKey) {
  const key = await this.findOne({ where: { key: apiKey } });
  
  if (!key) {
    return { valid: false, message: 'مفتاح API غير صالح' };
  }
  
  if (!key.isActive) {
    return { valid: false, message: 'مفتاح API غير مفعل' };
  }
  
  if (key.expiryDate && new Date() > new Date(key.expiryDate)) {
    return { valid: false, message: 'مفتاح API منتهي الصلاحية' };
  }
  
  await key.updateUsage();
  return { valid: true, key };
}

module.exports = ApiKey; 