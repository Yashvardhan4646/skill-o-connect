// ==============================================================================
//  SkillConnect — Supabase Client Initializer (Zero Embedded Keys)
// ==============================================================================

// Reads exclusively from window environment variables configured at deployment
const SUPABASE_URL  = window.SUPABASE_URL || window.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON = window.SUPABASE_ANON_KEY || window.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Keep reference to Supabase CDN library if present
const supabaseLib = typeof supabase !== 'undefined' ? supabase : null;

if (supabaseLib && SUPABASE_URL && SUPABASE_ANON && SUPABASE_URL.trim() !== '' && SUPABASE_ANON.trim() !== '') {
  try {
    window.supabase = supabaseLib.createClient(SUPABASE_URL, SUPABASE_ANON);
    console.log('✅ Supabase client initialized securely');
  } catch (err) {
    console.error('❌ Failed to initialize Supabase client:', err);
    initFallbackSupabase();
  }
} else {
  console.warn('⚠️ Supabase credentials missing. Please set SUPABASE_URL and SUPABASE_ANON_KEY in your deployment environment.');
  initFallbackSupabase();
}

function initFallbackSupabase() {
  // Graceful stub to prevent uncaught TypeErrors in UI scripts if env vars aren't set yet
  const dummyPromise = () => Promise.resolve({ data: null, error: null, count: 0 });
  const dummyArrayPromise = () => Promise.resolve({ data: [], error: null, count: 0 });
  const dummyQuery = () => ({
    select: dummyArrayPromise,
    insert: dummyPromise,
    upsert: dummyPromise,
    update: dummyPromise,
    delete: dummyPromise,
    eq: () => ({ maybeSingle: dummyPromise, single: dummyPromise, select: dummyArrayPromise, in: dummyArrayPromise }),
    in: () => ({ select: dummyArrayPromise }),
    order: () => ({ select: dummyArrayPromise })
  });

  window.supabase = {
    auth: {
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      signUp: dummyPromise,
      signInWithPassword: dummyPromise,
      signOut: dummyPromise,
      onAuthStateChange: (cb) => {
        return { data: { subscription: { unsubscribe: () => {} } } };
      }
    },
    from: dummyQuery,
    channel: () => ({
      on: function() { return this; },
      subscribe: function() { return this; }
    }),
    removeChannel: () => {},
    storage: {
      from: () => ({
        upload: dummyPromise,
        getPublicUrl: () => ({ data: { publicUrl: '' } })
      })
    }
  };
}

// Shorthand DOM helper
window.$ = (id) => document.getElementById(id);

