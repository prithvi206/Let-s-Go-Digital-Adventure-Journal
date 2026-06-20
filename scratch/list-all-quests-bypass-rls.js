import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import readline from 'readline';

// 1. Load .env config
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

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('To list all quests (bypassing RLS), we need your Supabase Service Role Key.');
console.log('You can find it in the Supabase Dashboard under Project Settings > API > service_role (secret).\n');

rl.question('Please paste your SUPABASE_SERVICE_ROLE_KEY: ', async (serviceKey) => {
  rl.close();
  
  const key = serviceKey.trim();
  if (!key) {
    console.error('Error: Service Role Key cannot be empty.');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, key, {
    auth: {
      persistSession: false
    }
  });

  console.log('\nFetching all quests from table...');
  const { data: quests, error } = await supabase
    .from('quests')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching quests:', error.message);
  } else {
    console.log(`\nSuccessfully fetched ${quests.length} quests in total:`);
    console.log('==================================================');
    quests.forEach((q, index) => {
      console.log(`[Quest #${index + 1}]`);
      console.log(`  ID:         ${q.id}`);
      console.log(`  User ID:    ${q.user_id}`);
      console.log(`  Title:      ${q.title}`);
      console.log(`  Priority:   ${q.priority}`);
      console.log(`  Location:   ${q.location || 'N/A'}`);
      console.log(`  Status:     ${q.status}`);
      console.log(`  Date:       ${q.quest_date || 'N/A'}`);
      console.log(`  Created At: ${q.created_at}`);
      console.log('--------------------------------------------------');
    });
  }
});
