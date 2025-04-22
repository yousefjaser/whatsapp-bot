const { v4: uuidv4 } = require('uuid');
const supabase = require('../config/supabase');

/**
 * نموذج مفتاح API
 * يتم استخدامه للتحقق من صحة طلبات API
 */
class ApiKey {
  // استرجاع كل المفاتيح
  static async findAll() {
    const { data, error } = await supabase
      .from('ApiKeys')
      .select('*');
    
    if (error) throw error;
    return data;
  }

  // إنشاء مفتاح جديد
  static async create(keyData) {
    const { name, key = uuidv4(), expiryDate, isActive = true } = keyData;
    
    const { data, error } = await supabase
      .from('ApiKeys')
      .insert([{
        name,
        key,
        expiryDate,
        isActive,
        createdAt: new Date(),
        updatedAt: new Date()
      }])
      .select();
    
    if (error) throw error;
    return data[0];
  }

  // العثور على مفتاح بواسطة المعرف
  static async findByPk(id) {
    const { data, error } = await supabase
      .from('ApiKeys')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  }

  // حفظ التغييرات
  static async update(id, changes) {
    const { data, error } = await supabase
      .from('ApiKeys')
      .update({
        ...changes,
        updatedAt: new Date()
      })
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return data[0];
  }

  // حذف مفتاح
  static async destroy(options) {
    const { where } = options;
    const { id } = where;
    
    const { error, count } = await supabase
      .from('ApiKeys')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return count || 0;
  }

  // التحقق من صلاحية المفتاح
  static async validateKey(apiKey) {
    const { data, error } = await supabase
      .from('ApiKeys')
      .select('*')
      .eq('key', apiKey)
      .single();
    
    if (error || !data) {
      return { valid: false, message: 'مفتاح API غير صالح' };
    }
    
    if (!data.isActive) {
      return { valid: false, message: 'مفتاح API غير مفعل' };
    }
    
    if (data.expiryDate && new Date() > new Date(data.expiryDate)) {
      return { valid: false, message: 'مفتاح API منتهي الصلاحية' };
    }
    
    // تحديث بيانات الاستخدام
    await supabase
      .from('ApiKeys')
      .update({
        lastUsed: new Date(),
        usageCount: (data.usageCount || 0) + 1,
        updatedAt: new Date()
      })
      .eq('id', data.id);
    
    return { valid: true, key: data };
  }
}

module.exports = ApiKey; 