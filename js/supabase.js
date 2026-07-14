const SUPABASE_URL = "https://yxgindixdofqvvxnrsgm.supabase.co/rest/v1/";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4Z2luZGl4ZG9mcXZ2eG5yc2dtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2ODU1NTIsImV4cCI6MjA5OTI2MTU1Mn0.X3tHwcJoQeeIy8wG0eVU0oUtdZfcBKqIiVZpXWNikKc";

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
