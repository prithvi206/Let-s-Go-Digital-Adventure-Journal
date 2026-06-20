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

async function checkSharedQuests() {
  console.log('Logging in as explorer@questvault.com...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'explorer@questvault.com',
    password: 'DefaultSharedPassword123!'
  });

  if (authError) {
    console.error('Failed to log in as shared user:', authError.message);
  } else {
    console.log('Log in successful! User ID:', authData.user.id);
    const { data: quests, error: questsError } = await supabase
      .from('quests')
      .select('*')
      .order('created_at', { ascending: false });

    if (questsError) {
      console.error('Error fetching quests:', questsError);
    } else {
      console.log(`Found ${quests.length} quests for shared user:`);
      console.log(JSON.stringify(quests, null, 2));
    }
  }
}

checkSharedQuests();
