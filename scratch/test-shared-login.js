import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

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

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSharedLogin() {
  console.log('Attempting login for explorer@questvault.com...');
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'explorer@questvault.com',
    password: 'DefaultSharedPassword123!'
  });

  if (error) {
    console.error('Login failed:', error.message);
    if (error.message.includes('Email not confirmed')) {
      console.log('\nCONFIRMATION: The email is still not confirmed in Supabase!');
    }
  } else {
    console.log('Login SUCCEEDED! User ID:', data.user.id);
    console.log('Fetching quests...');
    const { data: quests, error: questsError } = await supabase
      .from('quests')
      .select('*');
    
    if (questsError) {
      console.error('Fetch quests failed:', questsError.message);
    } else {
      console.log(`Fetch succeeded! Found ${quests.length} quests.`);
      console.log(JSON.stringify(quests, null, 2));
    }
  }
}

testSharedLogin();
