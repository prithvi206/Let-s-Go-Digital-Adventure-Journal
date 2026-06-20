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

async function listQuests() {
  const { data, error } = await supabase.from('quests').select('*');
  if (error) {
    console.error('Error fetching quests:', error);
  } else {
    console.log(`Successfully fetched ${data.length} quests:`);
    console.log(JSON.stringify(data, null, 2));
  }
}

listQuests();
