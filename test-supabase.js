// Simple script to test Supabase connection
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('Testing Supabase connection...');
console.log(`URL: ${supabaseUrl}`);
console.log(`Key length: ${supabaseKey?.length || 0} characters`);

// Check if environment variables are set
if (!supabaseUrl || supabaseUrl === 'https://your-supabase-url.supabase.co') {
  console.error('Error: Supabase URL is not set correctly in .env file');
  process.exit(1);
}

if (!supabaseKey || supabaseKey === 'your-anon-key') {
  console.error('Error: Supabase anon key is not set correctly in .env file');
  process.exit(1);
}

// Initialize the Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Test the connection
async function testConnection() {
  try {
    console.log('Attempting to connect to Supabase...');
    // A simple query that doesn't require authentication
    const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error('Error connecting to Supabase:');
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Error details:', error.details);
      console.error('Error hint:', error.hint);
      process.exit(1);
    }
    
    console.log('Successfully connected to Supabase!');
    console.log('Response data:', data);
    console.log('Your configuration is correct.');
    process.exit(0);
  } catch (err) {
    console.error('Unexpected error:', err);
    if (err.stack) {
      console.error('Stack trace:', err.stack);
    }
    process.exit(1);
  }
}

testConnection(); 