
/* ==========================================
   READ-X | SUPABASE CONNECTION
   Official Publisher: Team X
========================================== */

// Supabase project URL
const SUPABASE_URL =
    "https://iqlfuhjoltpwnezswkmw.supabase.co";

// Supabase publishable key
const SUPABASE_KEY =
    "sb_publishable_hU61izoubK2oC0gr_3ZxnQ_1jX50V8K";

// Create Supabase connection
const { createClient } = window.supabase;

window.readxSupabase = createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

console.log("READ-X: Supabase connected successfully.");
