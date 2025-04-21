const { v4: uuidv4 } = require('uuid');
const path = require('path');
const { ApiKey } = require('../models');
const whatsappclient = require('../helpers/whatsapp-client');

/**
 * عرض صفحة إدارة API
 * @param {Object} req - كائن الطلب
 * @param {Object} res - كائن الاستجابة
 */
exports.getApiPage = async (req, res) => {
  try {
    const apiKeys = await ApiKey.findAll();
    const client = global.whatsappclient;
    const isConnected = client && client.info;

    res.render('api', {
      title: 'إدارة واجهة API',
      apiKeys,
      isConnected,
      clientInfo: isConnected ? client.info : null
    });
  } catch (error) {
    console.error('خطأ في عرض صفحة API:', error);
    res.status(500).json({ 
      success: false, 
      message: 'حدث خطأ أثناء تحميل صفحة API' 
    });
  }
};

/**
 * عرض صفحة إدارة مفاتيح API
 * @param {Object} req - كائن الطلب
 * @param {Object} res - كائن الاستجابة
 */
exports.getApiKeysPage = async (req, res) => {
  try {
    const apiKeys = await ApiKey.findAll();
    const client = global.whatsappclient;
    const isConnected = client && client.info;

    res.render('api-keys', {
      title: 'إدارة مفاتيح API',
      apiKeys,
      isConnected,
      clientInfo: isConnected ? client.info : null
    });
  } catch (error) {
    console.error('خطأ في عرض صفحة إدارة مفاتيح API:', error);
    res.status(500).json({ 
      success: false, 
      message: 'حدث خطأ أثناء تحميل صفحة إدارة مفاتيح API' 
    });
  }
};

/**
 * إنشاء مفتاح API جديد
 * @param {Object} req - كائن الطلب
 * @param {Object} res - كائن الاستجابة
 */
exports.createApiKey = async (req, res) => {
  const { name, expiryDate } = req.body;
  
  try {
    if (!name || name.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        message: 'اسم المفتاح مطلوب' 
      });
    }

    const apiKey = await ApiKey.create({
      name,
      key: uuidv4(),
      expiryDate: expiryDate || null,
      isActive: true
    });

    res.status(201).json({ 
      success: true, 
      message: 'تم إنشاء مفتاح API بنجاح', 
      apiKey 
    });
  } catch (error) {
    console.error('خطأ في إنشاء مفتاح API:', error);
    res.status(500).json({ 
      success: false, 
      message: 'حدث خطأ أثناء إنشاء مفتاح API' 
    });
  }
};

/**
 * تحديث حالة مفتاح API
 * @param {Object} req - كائن الطلب
 * @param {Object} res - كائن الاستجابة
 */
exports.updateApiKey = async (req, res) => {
  const { id } = req.params;
  const { isActive } = req.body;
  
  try {
    const apiKey = await ApiKey.findByPk(id);
    
    if (!apiKey) {
      return res.status(404).json({ 
        success: false, 
        message: 'لم يتم العثور على مفتاح API' 
      });
    }
    
    apiKey.isActive = isActive;
    await apiKey.save();
    
    res.json({ 
      success: true, 
      message: 'تم تحديث حالة مفتاح API بنجاح' 
    });
  } catch (error) {
    console.error('خطأ في تحديث مفتاح API:', error);
    res.status(500).json({ 
      success: false, 
      message: 'حدث خطأ أثناء تحديث مفتاح API' 
    });
  }
};

/**
 * الحصول على جميع مفاتيح API
 * @param {Object} req - كائن الطلب
 * @param {Object} res - كائن الاستجابة
 */
exports.getApiKeys = async (req, res) => {
  try {
    const apiKeys = await ApiKey.findAll();
    res.json({ success: true, apiKeys });
  } catch (error) {
    console.error('خطأ في جلب مفاتيح API:', error);
    res.status(500).json({ 
      success: false, 
      message: 'حدث خطأ أثناء جلب مفاتيح API' 
    });
  }
};

/**
 * حذف مفتاح API
 * @param {Object} req - كائن الطلب
 * @param {Object} res - كائن الاستجابة
 */
exports.deleteApiKey = async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await ApiKey.destroy({ where: { id } });
    
    if (result === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'لم يتم العثور على مفتاح API' 
      });
    }
    
    res.json({ 
      success: true, 
      message: 'تم حذف مفتاح API بنجاح' 
    });
  } catch (error) {
    console.error('خطأ في حذف مفتاح API:', error);
    res.status(500).json({ 
      success: false, 
      message: 'حدث خطأ أثناء حذف مفتاح API' 
    });
  }
};

/**
 * عرض وثائق API
 * @param {Object} req - كائن الطلب
 * @param {Object} res - كائن الاستجابة
 */
exports.getApiDocs = (req, res) => {
  try {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    
    const apiDocs = {
      version: 'v2',
      baseUrl: `${baseUrl}/api/v2`,
      authentication: {
        type: 'API Key',
        headerName: 'x-api-key',
        description: 'أضف مفتاح API في رأس الطلب كـ x-api-key'
      },
      endpoints: {
        sendMessage: {
          url: '/send',
          method: 'POST',
          description: 'إرسال رسالة واتساب',
          params: {
            mobile: 'رقم الهاتف المستهدف (مثال: 966501234567)',
            message: 'محتوى الرسالة النصية'
          },
          returns: {
            success: 'بوليان يوضح نجاح العملية',
            message: 'رسالة توضيحية',
            response: 'بيانات استجابة واتساب (في حالة النجاح)'
          }
        },
        checkNumber: {
          url: '/check-number',
          method: 'GET',
          description: 'التحقق ما إذا كان الرقم مسجل على واتساب',
          params: {
            mobile: 'رقم الهاتف للتحقق (مثال: 966501234567)'
          },
          returns: {
            success: 'بوليان يوضح نجاح العملية',
            exists: 'بوليان يوضح وجود الرقم على واتساب',
            message: 'رسالة توضيحية'
          }
        }
      }
    };
    
    res.json(apiDocs);
  } catch (error) {
    console.error('خطأ في عرض وثائق API:', error);
    res.status(500).json({ 
      success: false, 
      message: 'حدث خطأ أثناء تحميل وثائق API' 
    });
  }
}; 