const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://aamubkvkznkhbwgdytuj.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhbXVia3Zrem5raGJ3Z2R5dHVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3NDAwNDcsImV4cCI6MjA2MDMxNjA0N30.XYpGk_gv1x0_BPL-jcwC0vWa3yHYkmyGtQTxxvxcxtM';

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase; 