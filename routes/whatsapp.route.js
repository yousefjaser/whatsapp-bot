const express = require("express");
const { sendMessage, logOut, checkNumber, getDashboardData } = require("../controllers/whatsapp.controller");
const router = express.Router();

router.post("/", sendMessage);

router.get("/status", (req, res) => {
  res.json({
    clientready: global.clientready || false,
    clientauthenticated: global.clientauthenticated || false,
    qrcode: global.whatsappclient_qr || null
  });
});

router.get("/qr", (req, res) => {
  // التحقق ما إذا كنا في بيئة Vercel Serverless
  const isServerless = process.env.VERCEL === '1';
  
  if (isServerless) {
    // في بيئة Vercel، نستخدم JSON بدلاً من قالب Pug
    return res.status(200).json({
      success: true,
      message: "وضع QR غير متاح في بيئة Serverless",
      serverlessMode: true,
      note: "يرجى تشغيل الخادم محلياً للوصول إلى رمز QR"
    });
  }
  
  // السلوك العادي خارج بيئة Serverless
  console.log(global.clientready, global.whatsappclient_qr);
  res.render("qr", {
    serverless: false,
    qr: global.whatsappclient_qr,
    clientready: global.clientready ? "yes" : "no",
    clientauthenticated: global.clientauthenticated ? "yes" : "no",
  });
});

router.get("/dashboard", (req, res) => {
  res.render("dashboard", {
    clientready: global.clientready ? "yes" : "no",
    clientauthenticated: global.clientauthenticated ? "yes" : "no",
  });
});

router.get("/dashboard-data", getDashboardData);

router.route("/logout").get(logOut).post(logOut);

router.get("/check-number", checkNumber);

// مسار جديد للتحقق من الرقم عندما يتم إدخاله مباشرة في المتصفح
router.get("/:number", async (req, res) => {
  try {
    // استخراج الرقم من المعلمة في المسار
    const number = req.params.number;
    
    // التحقق إذا كان النص المدخل يبدو كرقم هاتف
    if (/^\+?\d+$/.test(number)) {
      // إعادة توجيه الطلب إلى دالة التحقق من الرقم
      req.query.number = number;
      return checkNumber(req, res);
    } else {
      // إذا لم يكن رقم هاتف، إرجاع رسالة خطأ 404
      return res.status(404).json({
        success: false,
        error: "Resource not found",
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "حدث خطأ أثناء معالجة الطلب",
    });
  }
});

// إضافة مسار جديد لعرض معلومات حول وضع Serverless
router.get("/serverless-info", (req, res) => {
  res.send(`
    <html>
      <head>
        <title>WhatsApp Bot - Serverless Mode</title>
        <style>
          body { font-family: Arial; max-width: 800px; margin: 0 auto; padding: 20px; text-align: center; direction: rtl; }
          .container { background: #f8f9fa; border-radius: 10px; padding: 20px; margin: 20px 0; }
          .note { color: #721c24; background-color: #f8d7da; padding: 15px; border-radius: 5px; }
          .success { color: #155724; background-color: #d4edda; padding: 15px; border-radius: 5px; }
        </style>
      </head>
      <body>
        <h1>بوت واتساب - وضع Serverless</h1>
        <div class="container">
          <h2>معلومات عن البيئة</h2>
          <p>هذا التطبيق يعمل حالياً في بيئة Vercel Serverless</p>
          <p>متغيرات البيئة المكتشفة:</p>
          <ul style="text-align: right; display: inline-block;">
            <li>VERCEL: ${process.env.VERCEL}</li>
            <li>SUPABASE_URL: ${process.env.SUPABASE_URL ? '✓ (موجود)' : '✗ (غير موجود)'}</li>
            <li>SUPABASE_KEY: ${process.env.SUPABASE_KEY ? '✓ (موجود)' : '✗ (غير موجود)'}</li>
            <li>NODE_ENV: ${process.env.NODE_ENV}</li>
          </ul>
          
          <div class="note">
            <strong>ملاحظة هامة:</strong> في بيئة Serverless لا يمكن استخدام واتساب مباشرة.
            <br>لاستخدام كامل ميزات البوت، يجب تشغيل الخادم محلياً.
          </div>
        </div>

        <div class="container">
          <h2>إرسال رسالة (وضع Serverless)</h2>
          <p>في وضع Serverless، سيتم تخزين الرسائل في قاعدة البيانات ولكن لن يتم إرسالها تلقائياً.</p>
          
          <form id="message-form" style="margin: 20px 0; text-align: right;">
            <div style="margin-bottom: 10px;">
              <label for="phone" style="display: block; margin-bottom: 5px;">رقم الهاتف (مع رمز الدولة):</label>
              <input type="text" id="phone" name="phone" placeholder="مثال: +966501234567" required style="width: 100%; padding: 8px; direction: ltr;">
            </div>
            <div style="margin-bottom: 10px;">
              <label for="message" style="display: block; margin-bottom: 5px;">الرسالة:</label>
              <textarea id="message" name="message" rows="4" placeholder="اكتب رسالتك هنا" required style="width: 100%; padding: 8px;"></textarea>
            </div>
            <button type="submit" style="background-color: #28a745; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer;">إرسال الرسالة</button>
          </form>
          
          <div id="result" style="display: none;"></div>
        </div>
        
        <p>
          <a href="/">الصفحة الرئيسية</a>
        </p>
        
        <script>
          document.getElementById('message-form').addEventListener('submit', async function(e) {
            e.preventDefault();
            const phone = document.getElementById('phone').value;
            const message = document.getElementById('message').value;
            const resultDiv = document.getElementById('result');
            
            resultDiv.innerHTML = 'جارِ إرسال الرسالة...';
            resultDiv.className = '';
            resultDiv.style.display = 'block';
            
            try {
              const response = await fetch('/api/v1/', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  mobile: phone,
                  message: message
                })
              });
              
              const data = await response.json();
              
              if (data.success) {
                resultDiv.innerHTML = 'تم تخزين الرسالة بنجاح في قاعدة البيانات!';
                resultDiv.className = 'success';
                document.getElementById('message-form').reset();
              } else {
                resultDiv.innerHTML = 'فشل في إرسال الرسالة: ' + (data.error || 'خطأ غير معروف');
                resultDiv.className = 'note';
              }
            } catch (error) {
              resultDiv.innerHTML = 'حدث خطأ أثناء إرسال الرسالة: ' + error.message;
              resultDiv.className = 'note';
            }
          });
        </script>
      </body>
    </html>
  `);
});

module.exports = router;
