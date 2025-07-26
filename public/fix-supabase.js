/**
 * Fix Supabase URL issues
 * This script runs in the browser to fix any hardcoded URLs
 */

(function fixSupabase() {
  try {
    console.log('🔍 Checking for Supabase URL issues...');
    
    // 1. Check if placeholder URLs are in localStorage
    const keysToCheck = [
      'supabase.auth.token',
      'auth_session',
      'auth_user',
      'supabaseSession',
      'notificationPreferences',
      'notifications'
    ];
    
    let fixedItems = 0;
    
    // Fix localStorage items
    keysToCheck.forEach(key => {
      try {
        const value = localStorage.getItem(key);
        if (value && typeof value === 'string') {
          if (value.includes('your-supabase-url') || value.includes('your-anon-key')) {
            console.log(`📝 Found placeholder Supabase URL in localStorage key: ${key}`);
            localStorage.removeItem(key);
            fixedItems++;
          }
        }
      } catch (e) {
        console.error(`Error checking localStorage key ${key}:`, e);
      }
    });
    
    // 2. Clean all sessionStorage too
    try {
      sessionStorage.clear();
      console.log('🧹 Cleared sessionStorage');
    } catch (e) {
      console.error('Error clearing sessionStorage:', e);
    }
    
    // 3. Replace any global reference to the placeholder URL
    if (typeof window !== 'undefined') {
      if (window.SUPABASE_URL && window.SUPABASE_URL.includes('your-supabase-url')) {
        window.SUPABASE_URL = 'https://mgafiaiqnzrgyarxmjjw.supabase.co';
        fixedItems++;
      }
      
      if (window.SUPABASE_KEY && window.SUPABASE_KEY.includes('your-anon-key')) {
        window.SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1nYWZpYWlxbnpyZ3lhcnhtamp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2MjE1MTIsImV4cCI6MjA2ODE5NzUxMn0.4jUz8gNhzDixhndOGV5thl8KSpuSKlRXNWu5T3BTEV';
        fixedItems++;
      }
    }
    
    // 4. Update environment variables if possible
    if (typeof process !== 'undefined' && process.env) {
      if (process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_URL.includes('your-supabase-url')) {
        process.env.VITE_SUPABASE_URL = 'https://mgafiaiqnzrgyarxmjjw.supabase.co';
        fixedItems++;
      }
      
      if (process.env.VITE_SUPABASE_ANON_KEY && process.env.VITE_SUPABASE_ANON_KEY.includes('your-anon-key')) {
        process.env.VITE_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1nYWZpYWlxbnpyZ3lhcnhtamp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2MjE1MTIsImV4cCI6MjA2ODE5NzUxMn0.4jUz8gNhzDixhndOGV5thl8KSpuSKlRXNWu5T3BTEV';
        fixedItems++;
      }
    }
    
    // 5. Force environment variables through window
    if (typeof window !== 'undefined') {
      window.env = window.env || {};
      window.env.VITE_SUPABASE_URL = 'https://mgafiaiqnzrgyarxmjjw.supabase.co';
      window.env.VITE_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1nYWZpYWlxbnpyZ3lhcnhtamp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2MjE1MTIsImV4cCI6MjA2ODE5NzUxMn0.4jUz8gNhzDixhndOGV5thl8KSpuSKlRXNWu5T3BTEV';
    }
    
    // 6. Fix any Supabase client in window
    if (typeof window !== 'undefined' && window.supabaseClient) {
      console.log('📊 Found Supabase client in window, updating configuration...');
      window.supabaseClient = null; // Force recreation with correct URL
      fixedItems++;
    }
    
    console.log(`✅ Supabase URL check complete. Fixed ${fixedItems} issues.`);
    
    // 7. Suggest refreshing the page
    if (fixedItems > 0) {
      console.log('🔄 Please refresh the page for changes to take effect.');
      if (confirm('Supabase connection issues were fixed. Refresh the page now?')) {
        window.location.reload();
      }
    }
  } catch (error) {
    console.error('Error in fixSupabase script:', error);
  }
})(); 