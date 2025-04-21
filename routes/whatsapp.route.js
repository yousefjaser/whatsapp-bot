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
  console.log(global.clientready, global.whatsappclient_qr);
  res.render("qr", {
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

module.exports = router;
