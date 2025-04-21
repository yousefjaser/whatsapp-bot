// middleware للتحقق من مفتاح API
const { ApiKey } = require('../models');

/**
 * Middleware للتحقق من صحة مفتاح API في الطلب
 */
async function apiKeyAuth(req, res, next) {
  // البحث عن مفتاح API في رأس الطلب أو معلمات الاستعلام
  const apiKey = req.headers['x-api-key'] || req.query.api_key;
  
  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: 'مفتاح API مطلوب'
    });
  }
  
  // التحقق من صحة مفتاح API
  try {
    const result = await ApiKey.validateKey(apiKey);
    
    if (!result.valid) {
      return res.status(403).json({
        success: false,
        error: result.message || 'مفتاح API غير صالح أو منتهي الصلاحية'
      });
    }
    
    // إضافة معلومات المفتاح إلى الطلب
    req.apiKey = result.key;
    
    // إذا كان المفتاح صالحًا، الانتقال إلى المعالج التالي
    next();
  } catch (error) {
    console.error('خطأ في التحقق من مفتاح API:', error);
    return res.status(500).json({
      success: false,
      error: 'حدث خطأ أثناء التحقق من مفتاح API'
    });
  }
}

/**
 * Middleware اختياري للتحقق من مفتاح API (يسمح بالطلبات بدون مفتاح)
 */
async function optionalApiKeyAuth(req, res, next) {
  // البحث عن مفتاح API في رأس الطلب أو معلمات الاستعلام
  const apiKey = req.headers['x-api-key'] || req.query.api_key;
  
  // إذا تم تقديم مفتاح، التحقق من صحته
  if (apiKey) {
    try {
      const result = await ApiKey.validateKey(apiKey);
      
      if (!result.valid) {
        return res.status(403).json({
          success: false,
          error: result.message || 'مفتاح API غير صالح أو منتهي الصلاحية'
        });
      }
      
      // إضافة معلومات المفتاح إلى الطلب
      req.apiKey = result.key;
    } catch (error) {
      console.error('خطأ في التحقق من مفتاح API:', error);
      return res.status(500).json({
        success: false,
        error: 'حدث خطأ أثناء التحقق من مفتاح API'
      });
    }
  }
  
  // الانتقال إلى المعالج التالي
  next();
}

module.exports = {
  apiKeyAuth,
  optionalApiKeyAuth
}; 