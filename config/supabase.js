const { createClient } = require('@supabase/supabase-js');

// استخدام متغيرات البيئة مع القيم الافتراضية
const supabaseUrl = process.env.SUPABASE_URL || 'https://aamubkvkznkhbwgdytuj.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhbXVia3Zrem5raGJ3Z2R5dHVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3NDAwNDcsImV4cCI6MjA2MDMxNjA0N30.XYpGk_gv1x0_BPL-jcwC0vWa3yHYkmyGtQTxxvxcxtM';

try {
  console.log(`تهيئة اتصال Supabase على URL: ${supabaseUrl}`);
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // اختبار الاتصال قبل التصدير
  (async () => {
    try {
      // محاولة بسيطة لاختبار الاتصال
      const { error } = await supabase.from('ApiKeys').select('count', { count: 'exact', head: true });
      
      if (error) {
        console.error('خطأ في الاتصال بـ Supabase:', error.message);
      } else {
        console.log('تم الاتصال بـ Supabase بنجاح');
      }
    } catch (err) {
      console.error('استثناء أثناء اختبار اتصال Supabase:', err.message);
    }
  })();
  
  module.exports = supabase;
} catch (error) {
  console.error('خطأ في إنشاء عميل Supabase:', error.message);
  
  // إنشاء عميل وهمي في حالة الفشل لتجنب تعطل التطبيق
  const dummyClient = {
    from: () => ({
      select: () => ({ data: null, error: new Error('عميل Supabase غير متاح') }),
      insert: () => ({ data: null, error: new Error('عميل Supabase غير متاح') }),
      update: () => ({ data: null, error: new Error('عميل Supabase غير متاح') }),
      delete: () => ({ data: null, error: new Error('عميل Supabase غير متاح') }),
    }),
  };
  
  module.exports = dummyClient;
} 