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
