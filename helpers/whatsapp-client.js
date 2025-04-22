const qrcode = require("qrcode-terminal");
const { Client, LocalAuth } = require("whatsapp-web.js");
const { reportError } = require("../utils");

module.exports.config = () => {
  // تحقق ما إذا كنا في بيئة Vercel Serverless
  const isServerless = process.env.VERCEL === '1';
  
  if (isServerless) {
    console.log('تشغيل في بيئة Vercel Serverless - تم تعطيل عميل WhatsApp');
    
    // إنشاء عميل وهمي للبيئة السحابية
    global.whatsappclient = {
      info: null,
      isReady: false,
      sendMessage: async () => { 
        return { success: false, message: 'عميل WhatsApp غير متاح في الوضع Serverless' }; 
      },
      getState: () => null,
      getContacts: async () => [],
      getChats: async () => [],
      isRegisteredUser: async () => false,
      getChatById: async () => null,
      initialize: async () => console.log('تم تجاهل تهيئة العميل في الوضع Serverless')
    };
    
    global.clientready = false;
    global.clientauthenticated = false;
    global.whatsappclient_qr = "لا يمكن استخدام QR في بيئة Serverless";
    
    return;
  }
  
  try {
    console.log("Initializing WhatsApp client...");
    
    const client = new Client({
      authStrategy: new LocalAuth({ clientId: "client-one" }),
      puppeteer: {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu',
          '--disable-infobars',
          '--window-position=0,0',
          '--ignore-certificate-errors',
          '--ignore-certificate-errors-spki-list',
          '--disable-extensions',
          '--disable-default-apps',
          '--enable-features=NetworkService',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-breakpad',
          '--disable-component-extensions-with-background-pages',
          '--disable-features=TranslateUI,BlinkGenPropertyTrees',
          '--disable-ipc-flooding-protection',
          '--disable-renderer-backgrounding',
          '--enable-automation',
          '--password-store=basic',
          '--use-gl=swiftshader',
          '--use-mock-keychain'
        ],
        executablePath: process.env.CHROME_PATH || undefined,
        ignoreDefaultArgs: ['--disable-extensions'],
        timeout: 100000
      },
      qrMaxRetries: 5,
      restartOnAuthFail: true,
      takeoverOnConflict: true,
      takeoverTimeoutMs: 10000
    });

    global.whatsappclient = client;
    global.clientready = false;
    global.clientauthenticated = false;
    global.whatsappclient_qr = null;

    client.on("qr", (qr) => {
      console.log("New QR Code received");
      global.whatsappclient_qr = qr;
      global.clientready = false;
      global.clientauthenticated = false;
    });

    client.on("ready", () => {
      console.log("Client is ready!");
      global.clientready = true;
      global.clientauthenticated = true;
      global.whatsappclient_qr = null;
      global.connectedTime = new Date();
    });

    client.on("authenticated", () => {
      console.log("Client is authenticated!");
      global.clientauthenticated = true;
      global.whatsappclient_qr = null;
    });

    client.on("message", (message) => {
      console.log("Message received:", message.body);
    });

    client.on("disconnected", (reason) => {
      console.log("Client was disconnected:", reason);
      global.clientready = false;
      global.clientauthenticated = false;
    });

    client.on("auth_failure", (message) => {
      console.error("Authentication failed:", message);
      global.clientready = false;
      global.clientauthenticated = false;
    });

    process.on('SIGINT', async () => {
      console.log('Shutting down gracefully...');
      try {
        await client.destroy();
        console.log('Client destroyed successfully');
        process.exit(0);
      } catch (err) {
        console.error('Error during shutdown:', err);
        process.exit(1);
      }
    });

    console.log("Starting client initialization...");
    client.initialize().catch(err => {
      console.error("Failed to initialize client:", err);
      setTimeout(() => {
        console.log("Attempting to reinitialize...");
        client.initialize().catch(err => {
          console.error("Reinitialization failed:", err);
        });
      }, 5000);
    });

  } catch (error) {
    console.error("Error in WhatsApp config:", error);
    reportError("whatsapp-config", error);
  }
};
