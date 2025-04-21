const { Sequelize } = require('sequelize');

// تهيئة اتصال قاعدة البيانات استناداً إلى بيئة التشغيل
let sequelize;

if (process.env.NODE_ENV === 'production') {
  // استخدام قاعدة بيانات على الخادم في الإنتاج
  // يمكن استخدام PostgreSQL على Supabase, Neon أو خدمات أخرى
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('خطأ: لم يتم تحديد رابط قاعدة البيانات (DATABASE_URL)');
    process.exit(1);
  }
  
  sequelize = new Sequelize(databaseUrl, {
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    logging: false
  });
  
  console.log('تم تهيئة اتصال قاعدة بيانات PostgreSQL للإنتاج');
} else {
  // استخدام SQLite للتطوير المحلي
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './database.sqlite',
    logging: false
  });
  
  console.log('تم تهيئة اتصال قاعدة بيانات SQLite للتطوير');
}

// اختبار الاتصال
(async () => {
  try {
    await sequelize.authenticate();
    console.log('تم الاتصال بقاعدة البيانات بنجاح');
    
    // مزامنة النماذج مع قاعدة البيانات
    await sequelize.sync();
    console.log('تم مزامنة قاعدة البيانات');
  } catch (error) {
    console.error('خطأ في الاتصال بقاعدة البيانات:', error);
  }
})();

module.exports = sequelize; 