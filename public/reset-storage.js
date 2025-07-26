// Reset localStorage to fix Supabase connection issues
(function() {
  try {
    // Look for problematic keys
    const keysToRemove = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      const value = localStorage.getItem(key);
      
      if (value && typeof value === 'string') {
        if (value.includes('your-supabase-url') || value.includes('your-anon-key')) {
          keysToRemove.push(key);
        }
      }
    }
    
    // Remove problematic keys
    keysToRemove.forEach(key => {
      console.log(`Removing problematic key: ${key}`);
      localStorage.removeItem(key);
    });
    
    console.log(`Reset complete! Removed ${keysToRemove.length} problematic items.`);
  } catch (error) {
    console.error('Error resetting storage:', error);
  }
})();
