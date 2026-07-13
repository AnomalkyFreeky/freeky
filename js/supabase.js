const SUPABASE_URL = "IL_TUO_PROJECT_URL";
const SUPABASE_KEY = "LA_TUA_ANON_KEY";

// Wrapped in try/catch and assigned to window.supabaseClient (not `const`):
// with placeholder credentials, createClient() throws — without this guard,
// that failed `const` declaration would poison every later reference to
// `supabaseClient` across the whole site (a browser/TDZ quirk with `const`
// shared across separate <script> tags), crashing pages that have nothing
// to do with Your File. See js/account.js hasSupabase() for how this is used.
try {
    window.supabaseClient = supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );
} catch (e) {
    window.supabaseClient = null; // not configured yet — the rest of the site keeps working
}
