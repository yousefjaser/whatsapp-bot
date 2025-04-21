const ApiKey = require('../models/ApiKey');
const crypto = require('crypto');

// إنشاء مفتاح API جديد
exports.createApiKey = async (req, res) => {
  try {
    const { name, expiresAt } = req.body;
    
    if (!name) {
      return res.status(400).json({ 
        success: false, 
        message: 'يجب تحديد اسم للمفتاح' 
      });
    }
    
    // إنشاء مفتاح عشوائي
    const key = crypto.randomBytes(32).toString('hex');
    
    const apiKey = new ApiKey({
      name,
      key,
      expiresAt: expiresAt || null
    });
    
    await apiKey.save();
    
    res.status(201).json({
      success: true,
      message: 'تم إنشاء مفتاح API بنجاح',
      data: apiKey
    });
  } catch (error) {
    console.error('خطأ في إنشاء مفتاح API:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء إنشاء مفتاح API',
      error: error.message
    });
  }
};

// الحصول على جميع مفاتيح API
exports.getAllApiKeys = async (req, res) => {
  try {
    const apiKeys = await ApiKey.find({}, { key: 0 }); // لا ترجع المفتاح الكامل
    
    res.status(200).json({
      success: true,
      count: apiKeys.length,
      data: apiKeys
    });
  } catch (error) {
    console.error('خطأ في الحصول على مفاتيح API:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء استرجاع مفاتيح API',
      error: error.message
    });
  }
};

// الحصول على مفتاح API بواسطة المعرف
exports.getApiKeyById = async (req, res) => {
  try {
    const apiKey = await ApiKey.findById(req.params.id, { key: 0 });
    
    if (!apiKey) {
      return res.status(404).json({
        success: false,
        message: 'مفتاح API غير موجود'
      });
    }
    
    res.status(200).json({
      success: true,
      data: apiKey
    });
  } catch (error) {
    console.error('خطأ في الحصول على مفتاح API:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء استرجاع مفتاح API',
      error: error.message
    });
  }
};

// تحديث مفتاح API
exports.updateApiKey = async (req, res) => {
  try {
    const { name, active, expiresAt } = req.body;
    const updateData = {};
    
    if (name !== undefined) updateData.name = name;
    if (active !== undefined) updateData.active = active;
    if (expiresAt !== undefined) updateData.expiresAt = expiresAt;
    
    const apiKey = await ApiKey.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!apiKey) {
      return res.status(404).json({
        success: false,
        message: 'مفتاح API غير موجود'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'تم تحديث مفتاح API بنجاح',
      data: apiKey
    });
  } catch (error) {
    console.error('خطأ في تحديث مفتاح API:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تحديث مفتاح API',
      error: error.message
    });
  }
};

// إعادة إنشاء مفتاح API
exports.regenerateApiKey = async (req, res) => {
  try {
    const apiKey = await ApiKey.findById(req.params.id);
    
    if (!apiKey) {
      return res.status(404).json({
        success: false,
        message: 'مفتاح API غير موجود'
      });
    }
    
    // إنشاء مفتاح جديد
    const newKey = crypto.randomBytes(32).toString('hex');
    apiKey.key = newKey;
    
    await apiKey.save();
    
    res.status(200).json({
      success: true,
      message: 'تم إعادة إنشاء مفتاح API بنجاح',
      data: apiKey
    });
  } catch (error) {
    console.error('خطأ في إعادة إنشاء مفتاح API:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء إعادة إنشاء مفتاح API',
      error: error.message
    });
  }
};

// حذف مفتاح API
exports.deleteApiKey = async (req, res) => {
  try {
    const apiKey = await ApiKey.findByIdAndDelete(req.params.id);
    
    if (!apiKey) {
      return res.status(404).json({
        success: false,
        message: 'مفتاح API غير موجود'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'تم حذف مفتاح API بنجاح'
    });
  } catch (error) {
    console.error('خطأ في حذف مفتاح API:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء حذف مفتاح API',
      error: error.message
    });
  }
};

// وظيفة للتحقق من مفتاح API
exports.verifyApiKey = async (key) => {
  try {
    const apiKey = await ApiKey.findOne({ key });
    
    if (!apiKey) {
      return { success: false, message: 'مفتاح API غير صالح' };
    }
    
    if (!apiKey.active) {
      return { success: false, message: 'مفتاح API غير نشط' };
    }
    
    if (apiKey.expiresAt && new Date() > apiKey.expiresAt) {
      return { success: false, message: 'مفتاح API منتهي الصلاحية' };
    }
    
    // تحديث آخر استخدام وعدد مرات الاستخدام
    apiKey.lastUsed = new Date();
    apiKey.usageCount += 1;
    await apiKey.save();
    
    return { success: true, apiKey };
  } catch (error) {
    console.error('خطأ في التحقق من مفتاح API:', error);
    return { success: false, message: 'حدث خطأ أثناء التحقق من مفتاح API' };
  }
}; 