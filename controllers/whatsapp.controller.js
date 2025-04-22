const { reportError, isEmpty } = require("../utils");
const whatsappclient = require("../helpers/whatsapp-client");
const supabase = require('../config/supabase');

exports.sendMessage = async (req, res, next) => {
  try {
    let client = req.whatsappclient;
    const isServerless = process.env.VERCEL === '1';
    
    if (isServerless) {
      // في بيئة Serverless، نحفظ الرسالة في قاعدة البيانات فقط
      try {
        const { mobile, message } = req.body;
        
        if (!mobile || !message) {
          return res.status(400).json({
            success: false,
            error: "يرجى تقديم رقم الهاتف والرسالة",
          });
        }
        
        // تنسيق رقم الهاتف
        let formattedNumber = mobile.toString().replace(/\D/g, "");
        
        // التأكد من أن الرقم يبدأ بمفتاح الدولة
        if (!formattedNumber.startsWith("1") && !formattedNumber.startsWith("91") && 
            !formattedNumber.startsWith("966") && !formattedNumber.startsWith("971")) {
          // إضافة مفتاح السعودية افتراضياً إذا لم يكن موجودًا
          formattedNumber = "966" + formattedNumber;
        }
        
        // إضافة الرسالة إلى قاعدة البيانات
        const { data, error } = await supabase
          .from('Messages')
          .insert([
            { 
              fromNumber: 'system',
              toNumber: formattedNumber,
              message: message,
              status: 'pending',
              apiKeyId: req.apiKey?.id,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          ]);
        
        if (error) throw error;
        
        return res.status(200).json({
          success: true,
          message: "تم تسجيل الرسالة بنجاح (وضع Serverless)",
          note: "في بيئة Serverless، لا يمكن إرسال الرسائل مباشرة. تم تسجيل الرسالة وستتم معالجتها لاحقًا."
        });
      } catch (error) {
        console.error('Error saving message to Supabase:', error);
        return res.status(400).json({
          success: false,
          error: "فشل في حفظ الرسالة: " + (error.message || "خطأ غير معروف"),
        });
      }
    }
    
    // التنفيذ العادي إذا لم نكن في بيئة serverless
    if (!client || !global.clientready) {
      return res.status(400).json({
        success: false,
        error: "واتساب غير متصل حالياً، يرجى الانتظار حتى يتم الاتصال وإعادة المحاولة",
      });
    }
    
    const { mobile, message } = req.body;
    
    if (!mobile || !message) {
      return res.status(400).json({
        success: false,
        error: "يرجى تقديم رقم الهاتف والرسالة",
      });
    }
    
    // تنسيق رقم الهاتف
    let formattedNumber = mobile.toString().replace(/\D/g, "");
    
    // التأكد من أن الرقم يبدأ بمفتاح الدولة
    if (!formattedNumber.startsWith("1") && !formattedNumber.startsWith("91") && 
        !formattedNumber.startsWith("966") && !formattedNumber.startsWith("971")) {
      // إضافة مفتاح السعودية افتراضياً إذا لم يكن موجودًا
      formattedNumber = "966" + formattedNumber;
    }
    
    // التحقق مما إذا كان آخر رقم طابعًا صحيحًا
    if (!/^\d+$/.test(formattedNumber)) {
      return res.status(400).json({
        success: false,
        error: "رقم الهاتف يحتوي على أحرف غير صالحة",
      });
    }
    
    // إضافة "@c.us" لتنسيق معرف واتساب
    const chatId = `${formattedNumber}@c.us`;
    
    // التحقق من الرقم أولاً
    const isRegistered = await checkNumber(client, formattedNumber);

    if (!isRegistered.exists) {
      return res.status(400).json({
        success: false,
        error: "هذا الرقم غير مسجل على واتساب",
        numberStatus: isRegistered
      });
    }
    
    // استخدام sendMessage مع الرقم المنسق بشكل صحيح
    const messageResponse = await client.sendMessage(chatId, message);
    
    // حفظ الرسالة في قاعدة البيانات
    try {
      await supabase
        .from('Messages')
        .insert([
          { 
            fromNumber: 'system',
            toNumber: formattedNumber,
            message: message,
            status: 'sent',
            apiKeyId: req.apiKey?.id,
            sentAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ]);
    } catch (dbError) {
      console.error('Error saving message to database:', dbError);
      // نستمر حتى لو فشل الحفظ في قاعدة البيانات
    }
    
    console.log("Message sent:", message);
    
    return res.status(200).json({
      success: true,
      message: "تم إرسال الرسالة بنجاح",
      response: messageResponse
    });
  } catch (err) {
    reportError("sendMessagectrl err", err);
    return res.status(400).json({
      success: false,
      error: "فشل في إرسال الرسالة: " + (err.message || "خطأ غير معروف"),
      details: err.toString()
    });
  }
};

exports.logOut = async (req, res, next) => {
  try {
    if (!req.whatsappclient || !global.clientready) {
      return res.status(400).json({
        success: false,
        error:
          "Whatsapp client is instantiating and not ready, could not process your request at this time, please wait a few minutes and  try again",
      });
    }
    await req.whatsappclient.logout();
    global.clientready = false;
    whatsappclient.config();

    return res.status(200).json({
      success: true,
      message: "log out succesful",
    });
  } catch (err) {
    reportError("logOut err", err);
    return res.status(400).json({
      success: false,
      error: "Failed to log client out, please try again",
    });
  }
};

exports.checkNumber = async (req, res, next) => {
  try {
    const { number } = req.query;
    let client = req.whatsappclient;
    const isServerless = process.env.VERCEL === '1';
    
    if (isServerless) {
      // في بيئة Serverless، نفترض أن الرقم موجود ونكتفي بالتحقق من التنسيق
      try {
        if (isEmpty(number)) {
          return res.status(400).json({
            success: false,
            error: "الرجاء إدخال رقم هاتف للتحقق منه",
          });
        }

        // تنظيف الرقم من أي أحرف غير رقمية باستثناء علامة +
        let formattedNumber = number.trim().replace(/[^\d+]/g, '');
        
        // إذا بدأ بـ +، نزيل العلامة وننسق الرقم بالطريقة التي يتوقعها WhatsApp Web
        if (formattedNumber.startsWith("+")) {
          formattedNumber = formattedNumber.substring(1);
        }
        
        // نتحقق من أن الرقم يطابق نمط WhatsApp المعروف
        const isValid = /^\d{10,15}$/.test(formattedNumber);
        
        return res.status(200).json({
          success: true,
          exists: isValid, // نفترض أن الرقم موجود إذا كان التنسيق صحيحًا
          message: isValid ? "تنسيق الرقم صحيح (وضع Serverless)" : "تنسيق الرقم غير صحيح",
          number: formattedNumber,
          note: "في بيئة Serverless، لا يمكن التحقق من وجود الرقم على واتساب مباشرةً."
        });
      } catch (error) {
        console.error('Error in serverless number check:', error);
        return res.status(400).json({
          success: false,
          error: "حدث خطأ أثناء التحقق من الرقم: " + (error.message || "خطأ غير معروف"),
        });
      }
    }
    
    // التنفيذ العادي إذا لم نكن في بيئة serverless
    if (!client || !global.clientready) {
      return res.status(400).json({
        success: false,
        error:
          "واتساب غير متصل حالياً، يرجى الانتظار حتى يتم الاتصال وإعادة المحاولة",
      });
    }

    if (isEmpty(number)) {
      return res.status(400).json({
        success: false,
        error: "الرجاء إدخال رقم هاتف للتحقق منه",
      });
    }

    // تنظيف الرقم من أي أحرف غير رقمية باستثناء علامة +
    let formattedNumber = number.trim().replace(/[^\d+]/g, '');
    
    // إذا بدأ بـ +، نزيل العلامة وننسق الرقم بالطريقة التي يتوقعها WhatsApp Web
    if (formattedNumber.startsWith("+")) {
      formattedNumber = formattedNumber.substring(1);
    }
    
    try {
      // استخدام تنسيق COUNTRYCODE + PHONENUMBER لـ WhatsApp
      const number_details = await client.getNumberId(formattedNumber);
      
      if (number_details) {
        return res.status(200).json({
          success: true,
          exists: true,
          message: "الرقم مسجل على واتساب",
          number: formattedNumber,
          details: number_details
        });
      } else {
        return res.status(200).json({
          success: true,
          exists: false,
          message: "الرقم غير مسجل على واتساب",
          number: formattedNumber
        });
      }
    } catch (innerErr) {
      console.error("Error during number check:", innerErr);
      
      // محاولة بتنسيق آخر (إضافة @ قبل c.us كما هو مطلوب في بعض إصدارات المكتبة)
      try {
        const chatId = `${formattedNumber}@c.us`;
        const isRegistered = await client.isRegisteredUser(chatId);
        
        return res.status(200).json({
          success: true,
          exists: isRegistered,
          message: isRegistered ? "الرقم مسجل على واتساب" : "الرقم غير مسجل على واتساب",
          number: formattedNumber
        });
      } catch (finalErr) {
        console.error("Final error during number check:", finalErr);
        return res.status(400).json({
          success: false,
          error: "حدث خطأ أثناء التحقق من الرقم، تأكد من إدخال رقم صالح",
        });
      }
    }
  } catch (err) {
    reportError("checkNumber err", err);
    return res.status(400).json({
      success: false,
      error: "حدث خطأ أثناء التحقق من الرقم، يرجى المحاولة مرة أخرى",
    });
  }
};

exports.getDashboardData = async (req, res, next) => {
  let client = req.whatsappclient;
  try {
    if (!client || !global.clientready) {
      return res.status(400).json({
        success: false,
        error: "واتساب غير متصل حالياً، يرجى الانتظار حتى يتم الاتصال ثم حاول مرة أخرى",
      });
    }
    
    // الحصول على معلومات الحساب المتصل
    const connectionStatus = await client.getState();
    let accountInfo = null;
    
    if (client.info) {
      // استخدام خصائص client.info بدلاً من getWid
      accountInfo = {
        me: {
          name: client.info.pushname || "غير متوفر",
          id: client.info.wid?._serialized || client.info.wid || "غير متوفر"
        }
      };
    } else {
      // بديل إذا كانت client.info غير متوفرة
      accountInfo = {
        me: {
          name: "الحساب المتصل",
          id: "غير متوفر حالياً"
        }
      };
    }
    
    let profileUrl = null;
    try {
      // محاولة الحصول على الصورة الشخصية
      if (accountInfo.me.id && accountInfo.me.id !== "غير متوفر") {
        const profilePic = await client.getProfilePicUrl(accountInfo.me.id);
        profileUrl = profilePic || null;
      }
    } catch (error) {
      console.log("فشل في جلب الصورة الشخصية:", error.message);
    }
    
    // جلب جهات الاتصال والمحادثات
    const contacts = await client.getContacts();
    const chats = await client.getChats();
    
    // تنسيق البيانات للعرض
    const formattedContacts = contacts.map(contact => ({
      id: contact.id._serialized || contact.id,
      name: contact.name || contact.pushname || 'غير معروف',
      shortName: contact.shortName || '',
      number: contact.number || (contact.id.user || '').replace('@c.us', ''),
      isGroup: contact.isGroup || false,
      isWAContact: contact.isWAContact || false,
      profilePic: null // عادةً لا يتم تحميل الصور الشخصية للجهات لتسريع تحميل البيانات
    })).filter(c => c.isWAContact && !c.isGroup); // فلترة للاتصالات الفردية فقط
    
    const formattedChats = chats.map(chat => ({
      id: chat.id._serialized || chat.id,
      name: chat.name || (chat.id.user ? chat.id.user : 'محادثة'),
      unreadCount: chat.unreadCount || 0,
      timestamp: chat.timestamp || Date.now(),
      isGroup: chat.isGroup || false,
      lastMessage: chat.lastMessage ? {
        body: chat.lastMessage.body || 'ملف وسائط',
        fromMe: chat.lastMessage.fromMe || false,
        timestamp: chat.lastMessage.timestamp || Date.now()
      } : null
    }));
    
    // الرسائل الأخيرة (نستخدم مصفوفة فارغة مؤقتًا)
    const recentMessages = [];
    
    // ترتيب المحادثات حسب الأحدث
    const sortedChats = formattedChats.sort((a, b) => b.timestamp - a.timestamp);
    
    // تحضير البيانات بالتنسيق الذي يتوقعه ملف dashboard.pug
    const dashboardData = {
      account: {
        status: connectionStatus,
        phoneNumber: accountInfo.me.id ? accountInfo.me.id.replace('@c.us', '') : 'غير متوفر',
        profilePic: profileUrl
      },
      stats: {
        contactsCount: formattedContacts.length,
        chatsCount: formattedChats.length,
        activeStatus: connectionStatus,
        platform: client.info ? (client.info.platform || 'واتساب') : 'واتساب',
        connectedOn: global.connectedTime || new Date()
      },
      contacts: formattedContacts,
      chats: sortedChats,
      recentMessages: recentMessages
    };
    
    return res.status(200).json({
      success: true,
      data: dashboardData
    });
  } catch (err) {
    reportError("getDashboardData err", err);
    return res.status(400).json({
      success: false,
      error: "حدث خطأ أثناء جلب بيانات لوحة التحكم: " + (err.message || "خطأ غير معروف"),
      details: err.toString()
    });
  }
};

async function checkNumber(client, number) {
  try {
    if (!client) {
      return {
        exists: false,
        error: "واتساب غير متصل"
      };
    }
    
    // تنسيق الرقم
    let formattedNumber = number.toString().replace(/\D/g, "");
    
    // التأكد من أن الرقم يبدأ بمفتاح الدولة
    if (!formattedNumber.startsWith("1") && !formattedNumber.startsWith("91") && !formattedNumber.startsWith("966") && !formattedNumber.startsWith("971")) {
      // إضافة مفتاح السعودية افتراضياً إذا لم يكن موجودًا
      formattedNumber = "966" + formattedNumber;
    }
    
    // إنشاء معرف واتساب
    const chatId = `${formattedNumber}@c.us`;
    
    // محاولة التحقق من الرقم باستخدام الطريقة الحديثة أولاً
    try {
      const contactExists = await client.isRegisteredUser(chatId);
      if (contactExists !== undefined) {
        return {
          exists: contactExists,
          id: chatId,
          number: formattedNumber
        };
      }
    } catch (e) {
      console.log("First method failed:", e.message);
    }
    
    // طريقة بديلة: محاولة الحصول على معلومات حول جهة الاتصال
    try {
      const contact = await client.getContactById(chatId);
      return {
        exists: (contact && contact.isWAContact) ? true : false,
        id: chatId,
        number: formattedNumber
      };
    } catch (e) {
      console.log("Second method failed:", e.message);
    }
    
    // طريقة ثالثة: محاولة مباشرة بدون التحقق المسبق
    return {
      exists: true, // نفترض أن الرقم قد يكون موجودًا
      id: chatId,
      number: formattedNumber,
      note: "لم نتمكن من التحقق من وجود الرقم، لكن سنحاول إرسال الرسالة"
    };
  } catch (error) {
    console.error("CheckNumber error:", error);
    return {
      exists: false,
      error: error.message || "خطأ غير معروف أثناء التحقق من الرقم",
      id: null,
      number: number
    };
  }
}

// إضافة دالة لتحديث وقت الاتصال عند تشغيل الخادم
function updateConnectedTime() {
  if (!global.connectedTime && global.clientready) {
    global.connectedTime = new Date();
  }
}

// تحديث وقت الاتصال عند بدء التشغيل
updateConnectedTime();

// تشغيل التحديث كل دقيقة
setInterval(updateConnectedTime, 60000);
