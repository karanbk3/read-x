
/* ==========================================
   READ-X | SUPABASE CONNECTION
   Official Publisher: Team X
========================================== */


/* 1. SUPABASE PROJECT URL */

const SUPABASE_URL =
    "https://iqlfuhjoltpwnezswkmw.supabase.co";


/* 2. SUPABASE PUBLISHABLE KEY */

const SUPABASE_KEY =
    "sb_publishable_hU61izoubK2oC0gr_3ZxnQ_1jX50V8K";


/* 3. CHECK SUPABASE LIBRARY */

if (
    !window.supabase ||
    typeof window.supabase.createClient !== "function"
) {

    console.error(
        "READ-X ERROR: Supabase library is not loaded."
    );

    window.readxSupabase = null;

} else {

    /* 4. CREATE SUPABASE CLIENT */

    try {

        window.readxSupabase = window.supabase.createClient(
            SUPABASE_URL,
            SUPABASE_KEY,
            {
                auth: {
                    persistSession: true,
                    autoRefreshToken: true,
                    detectSessionInUrl: true
                }
            }
        );

        console.log(
            "READ-X: Supabase client initialized successfully."
        );

    } catch (error) {

        window.readxSupabase = null;

        console.error(
            "READ-X ERROR: Connection initialization failed.",
            error
        );

    }

}


/* 5. CONNECTION STATUS */

if (window.readxSupabase) {

    console.log("READ-X: Database client is ready.");

} else {

    console.error("READ-X: Database client is unavailable.");

}
