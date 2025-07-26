// Basic script to test Supabase connection without any table requirements
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('Testing basic Supabase connection...');
console.log(`URL: ${supabaseUrl}`);
console.log(`Key (first 5 chars): ${supabaseKey?.substring(0, 5)}...`);

// Initialize the Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Test a simple health check
async function testBasicConnection() {
  try {
    // Try a simple auth request
    console.log('Checking Supabase auth status...');
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Auth check failed:', error);
      process.exit(1);
    }
    
    console.log('Auth service connected successfully!');
    console.log('You have a valid Supabase connection.');
    
    console.log('\nNOTE: The profiles table may not exist yet. Run the SQL setup script:');
    console.log('1. Go to Supabase dashboard > SQL Editor');
    console.log('2. Create a new query with contents of supabase-setup.sql');
    console.log('3. Run the query to create required tables');
    
    process.exit(0);
  } catch (err) {
    console.error('Unexpected error:', err);
    process.exit(1);
  }
}

testBasicConnection(); 