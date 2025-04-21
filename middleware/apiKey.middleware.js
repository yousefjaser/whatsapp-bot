const { verifyApiKey } = require('../controllers/apikey.controller');

/**
 * Middleware للتحقق من مفتاح API
 */
const requireApiKey = async (req, res, next) => {
  try {
    // الحصول على المفتاح من الرأس
    const apiKey = req.headers['x-api-key'] || req.query.apiKey;
    
    if (!apiKey) {
      return res.status(401).json({
        success: false,
        message: 'مفتاح API مطلوب للوصول'
      });
    }
    
    // التحقق من المفتاح
    const { success, apiKey: validApiKey, message } = await verifyApiKey(apiKey);
    
    if (!success) {
      return res.status(401).json({
        success: false,
        message: message || 'مفتاح API غير صالح'
      });
    }
    
    // تخزين معلومات المفتاح في الطلب
    req.apiKey = validApiKey;
    
    next();
  } catch (error) {
    console.error('خطأ في middleware التحقق من مفتاح API:', error);
    return res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء التحقق من المصادقة',
      error: error.message
    });
  }
};

module.exports = { requireApiKey }; 