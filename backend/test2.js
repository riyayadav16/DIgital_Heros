const { createClient } = require('@supabase/supabase-js');
try {
  createClient('https://qgbljogzsyczieyfrfiz.supabase.co', undefined);
} catch (e) {
  console.log('Exception:', e.message);
}
