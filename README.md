# WhatsApp Bot Server

خادم Node.js لأتمتة WhatsApp باستخدام مكتبة whatsapp-web.js.

## المميزات

- تكامل مع واجهة برمجة تطبيقات WhatsApp Web
- مصادقة رمز QR
- وظيفة إرسال الرسائل
- واجهة ويب للتفاعل
- حالة اتصال في الوقت الحقيقي
- توثيق API باستخدام Swagger
- إدارة مفاتيح API

## التثبيت المحلي

1. استنساخ المستودع:
```bash
git clone https://github.com/yousefjaser/whatsapp-bot-nodeServer.git
cd whatsapp-bot-nodeServer
```

2. تثبيت التبعيات:
```bash
npm install
```

3. بدء الخادم:
```bash
npm run dev
```

## الاستخدام

1. افتح `http://localhost:5000/api/v1/qr` في متصفحك
2. امسح رمز QR باستخدام WhatsApp على هاتفك
3. بمجرد الاتصال، يمكنك إرسال الرسائل من خلال واجهة الويب أو API

## توثيق API

الوصول إلى وثائق Swagger على `http://localhost:5000/api-docs`

## النشر على Vercel

يمكنك نشر هذا التطبيق على منصة Vercel باتباع الخطوات التالية:

### 1. إعداد قاعدة بيانات PostgreSQL

لأن SQLite لا يعمل على Vercel، ستحتاج إلى قاعدة بيانات PostgreSQL:

- يمكنك استخدام [Supabase](https://supabase.com/) أو [Neon](https://neon.tech/) أو [ElephantSQL](https://www.elephantsql.com/) للحصول على قاعدة بيانات PostgreSQL مجانية
- بعد إنشاء قاعدة البيانات، احصل على رابط الاتصال `DATABASE_URL`

### 2. نشر المشروع على Vercel

1. قم بإنشاء حساب على [Vercel](https://vercel.com/) إذا لم يكن لديك حساب بالفعل

2. قم بتثبيت [Vercel CLI](https://vercel.com/docs/cli):
```bash
npm i -g vercel
```

3. من مجلد المشروع، قم بتسجيل الدخول إلى Vercel:
```bash
vercel login
```

4. قم بنشر المشروع:
```bash
vercel
```

5. أثناء عملية النشر، أضف المتغيرات البيئية التالية:
   - `DATABASE_URL`: رابط اتصال قاعدة بيانات PostgreSQL
   - `NODE_ENV`: production

### ملاحظات مهمة حول النشر

1. **محدوديات WhatsApp**: خادم WhatsApp المستند إلى واجهة المستخدم يحتاج إلى تفاعل مستخدم لمسح رمز QR عند بدء التشغيل
   - قد تحتاج إلى استخدام حلول مثل [Multi-Device API](https://developers.facebook.com/docs/whatsapp/api/reference) الرسمية لحالات الإنتاج

2. **الجلسات**: يُنصح باستخدام مزود تخزين خارجي لحفظ بيانات الجلسة بدلاً من التخزين المحلي

## المؤلف

- Yousef Jaser

## الترخيص

ISC
