// ==============================================================================
//  SkillConnect — Supabase Client Initializer (Zero Embedded Keys)
// ==============================================================================

// Reads exclusively from window environment variables configured at deployment
const SUPABASE_URL  = window.SUPABASE_URL || window.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON = window.SUPABASE_ANON_KEY || window.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (typeof supabase !== 'undefined' && SUPABASE_URL && SUPABASE_ANON) {
  window.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
  console.log('✅ Supabase client initialized securely');
} else {
  console.warn('⚠️ Supabase credentials missing. Please set SUPABASE_URL and SUPABASE_ANON_KEY in your deployment environment.');
}

// Shorthand DOM helper
window.$ = (id) => document.getElementById(id);
