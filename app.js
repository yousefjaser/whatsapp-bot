const express = require("express");
const app = express();
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./swagger.json");
const whatsappclient = require("./helpers/whatsapp-client");
const whatsappRoutes = require("./routes/whatsapp.route");
const apiRoutes = require("./routes/api.route");

require("dotenv").config();

whatsappclient.config();

app.set("view engine", "pug");
app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static("./public"));
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// إضافة مسار مباشر للمعلومات
app.get("/info", (req, res) => {
  const isServerless = process.env.VERCEL === '1';
  const envInfo = {
    VERCEL: process.env.VERCEL || 'غير محدد',
    SUPABASE_URL: process.env.SUPABASE_URL ? '✓ (موجود)' : '✗ (غير موجود)',
    SUPABASE_KEY: process.env.SUPABASE_KEY ? '✓ (موجود)' : '✗ (غير موجود)',
    NODE_ENV: process.env.NODE_ENV || 'غير محدد',
    PORT: process.env.PORT || 'غير محدد (افتراضي: 5000)'
  };
  
  const noteClass = isServerless ? 'note' : 'success';
  const noteText = isServerless 
    ? 'في بيئة Serverless لا يمكن استخدام واتساب مباشرة. ستُخزن الرسائل فقط ولن تُرسل تلقائياً.'
    : 'الخادم يعمل في وضع عادي ويمكن استخدام واتساب مباشرة.';

  const html = `
    <html>
      <head>
        <title>WhatsApp Bot - Info</title>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial; max-width: 800px; margin: 0 auto; padding: 20px; text-align: center; direction: rtl; }
          .container { background: #f8f9fa; border-radius: 10px; padding: 20px; margin: 20px 0; }
          .note { color: #721c24; background-color: #f8d7da; padding: 15px; border-radius: 5px; }
          .success { color: #155724; background-color: #d4edda; padding: 15px; border-radius: 5px; }
          pre { text-align: left; background: #f5f5f5; padding: 10px; border-radius: 5px; direction: ltr; }
        </style>
      </head>
      <body>
        <h1>معلومات بوت واتساب</h1>
        <div class="container">
          <h2>معلومات البيئة</h2>
          <p>حالة الخادم: <strong>متصل</strong></p>
          <p>وضع Serverless: <strong>${isServerless ? 'نعم' : 'لا'}</strong></p>
          <p>بيئة التشغيل: <strong>${envInfo.NODE_ENV}</strong></p>
          
          <h3>متغيرات البيئة</h3>
          <ul style="text-align: right; display: inline-block;">
            <li>VERCEL: ${envInfo.VERCEL}</li>
            <li>SUPABASE_URL: ${envInfo.SUPABASE_URL}</li>
            <li>SUPABASE_KEY: ${envInfo.SUPABASE_KEY}</li>
            <li>NODE_ENV: ${envInfo.NODE_ENV}</li>
            <li>PORT: ${envInfo.PORT}</li>
          </ul>
          
          <div class="${noteClass}">
            <strong>ملاحظة:</strong> ${noteText}
          </div>
        </div>
        
        <div class="container">
          <h2>المسارات المتاحة</h2>
          <ul style="text-align: right; list-style-position: inside;">
            <li><a href="/">/</a> - الصفحة الرئيسية</li>
            <li><a href="/api/v1/qr">/api/v1/qr</a> - صفحة QR</li>
            <li><a href="/api/v1/status">/api/v1/status</a> - حالة الاتصال</li>
            <li><a href="/api/v1/dashboard">/api/v1/dashboard</a> - لوحة التحكم</li>
            <li><a href="/api-docs">/api-docs</a> - وثائق API</li>
          </ul>
          
          <h3>اختبار إرسال رسالة</h3>
          <form id="message-form" style="margin: 20px 0; text-align: right;">
            <div style="margin-bottom: 10px;">
              <label for="phone">رقم الهاتف (مع رمز الدولة):</label>
              <input type="text" id="phone" name="phone" placeholder="مثال: +966501234567" required style="width: 100%; padding: 8px; direction: ltr;">
            </div>
            <div style="margin-bottom: 10px;">
              <label for="message">الرسالة:</label>
              <textarea id="message" name="message" rows="4" placeholder="اكتب رسالتك هنا" required style="width: 100%; padding: 8px;"></textarea>
            </div>
            <button type="submit" style="background-color: #28a745; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer;">إرسال الرسالة</button>
          </form>
          
          <div id="result" style="display: none;"></div>
        </div>
        
        <script>
          // تخزين معلومات البيئة في متغير JavaScript للاستخدام في السكريبت
          const serverInfo = {
            isServerless: ${isServerless}
          };
        
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
                resultDiv.innerHTML = '<div class="success">تم ' + (serverInfo.isServerless ? 'تخزين' : 'إرسال') + ' الرسالة بنجاح!</div>';
                resultDiv.innerHTML += '<pre>' + JSON.stringify(data, null, 2) + '</pre>';
                document.getElementById('message-form').reset();
              } else {
                resultDiv.innerHTML = '<div class="note">فشل في إرسال الرسالة: ' + (data.error || 'خطأ غير معروف') + '</div>';
                resultDiv.innerHTML += '<pre>' + JSON.stringify(data, null, 2) + '</pre>';
              }
            } catch (error) {
              resultDiv.innerHTML = '<div class="note">حدث خطأ أثناء إرسال الرسالة: ' + error.message + '</div>';
            }
          });
        </script>
      </body>
    </html>
  `;

  res.send(html);
});

app.use((req, res, next) => {
  req.whatsappclient = global.whatsappclient;
  
  req.isServerless = process.env.VERCEL === '1';
  
  next();
});
app.use("/api/v1", whatsappRoutes);
app.use("/api", apiRoutes);

app.all("*", async (req, res) => {
  return res.status(404).json({
    success: false,
    error: "المورد غير موجود",
  });
});

app.use((err, req, res, next) => {
  console.error('خطأ غير معالج في التطبيق:', err);
  
  const isServerless = process.env.VERCEL === '1';
  
  if (res.headersSent) {
    return next(err);
  }
  
  res.status(500).json({
    success: false,
    error: "حدث خطأ في الخادم",
    serverless: isServerless,
    message: isServerless ? "قد تكون بعض الميزات غير متاحة في بيئة Serverless" : err.message
  });
});

module.exports = app;
