import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load .env file from the current directory manually
if (fs.existsSync('./.env')) {
  const envContent = fs.readFileSync('./.env', 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.substring(0, idx).trim();
        const val = trimmed.substring(idx + 1).trim();
        process.env[key] = val;
      }
    }
  }
}

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://tchhqwbrfftmwivvmiuz.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

console.log('Using Supabase URL:', supabaseUrl);
console.log('Using Anon Key:', supabaseAnonKey ? 'FOUND (length ' + supabaseAnonKey.length + ')' : 'MISSING');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing credentials!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log('\n--- 1. Testing Connection & Selecting Quests ---');
  try {
    const { data, error } = await supabase.from('quests').select('*').limit(1);
    if (error) {
      console.error('Error selecting quests:', error);
    } else {
      console.log('Select quests success! Data:', data);
    }
  } catch (e) {
    console.error('Exception during select:', e);
  }

  console.log('\n--- 2. Testing Anonymous Sign-In ---');
  let user = null;
  try {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) {
      console.error('Error signing in anonymously:', error);
    } else {
      user = data.user;
      console.log('Sign in anonymously success! User ID:', user.id);
      console.log('User Role:', user.role);
      console.log('Is Anonymous:', user.is_anonymous);
    }
  } catch (e) {
    console.error('Exception during sign in:', e);
  }

  if (user) {
    console.log('\n--- 3. Testing Quest Insertion with Signed-In User ---');
    try {
      const dummyQuest = {
        title: 'Test Scratch Quest',
        priority: 'Medium',
        location: 'Kyoto',
        status: 'Pending',
        photo_urls: [],
        user_id: user.id
      };
      
      const { data, error } = await supabase
        .from('quests')
        .insert(dummyQuest)
        .select()
        .single();
        
      if (error) {
        console.error('Error inserting quest:', error);
      } else {
        console.log('Insert quest success! Created Quest:', data);
      }
    } catch (e) {
      console.error('Exception during insert:', e);
    }
  } else {
    console.log('\n--- Skipping insert test because user auth failed ---');
  }
}

run();
