const http = require("http");
const app = require("./app");
require("dotenv").config();

app.set("port", process.env.PORT || 5000);
const server = http.createServer(app);

server.listen(process.env.PORT || 5000, () => {
  console.log(`server started on port ${process.env.PORT || 5000}`);
});

// إضافة معالج خطأ عام لكل مسارات التطبيق
app.use((err, req, res, next) => {
  console.error('خطأ غير معالج:', err);
  
  // تحقق مما إذا كنا في بيئة Vercel
  const isServerless = process.env.VERCEL === '1';
  
  // إعادة رسالة خطأ مناسبة
  res.status(500).json({
    success: false,
    error: "حدث خطأ في الخادم",
    serverless: isServerless,
    message: isServerless ? "قد تكون بعض الميزات غير متاحة في بيئة Serverless" : err.message
  });
});

// اضافة مسار للتعامل مع الخطأ 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "المورد غير موجود"
  });
});
