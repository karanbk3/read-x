
/* ==========================================
   READ-X | SUPABASE CONNECTION
   Official Publisher: Team X
========================================== */


/* 1. SUPABASE PROJECT SETTINGS */

const READX_SUPABASE_URL =
    "https://iqlfuhjoltpwnezswkmw.supabase.co";

const READX_SUPABASE_KEY =
    "YOUR_EXISTING_PUBLISHABLE_KEY";


/* 2. CHECK SUPABASE LIBRARY */

if (
    !window.supabase ||
    typeof window.supabase.createClient !== "function"
) {

    console.error(
        "READ-X ERROR: Supabase library was not loaded."
    );

    window.readxSupabase = null;

} else {

    /* 3. CREATE DATABASE CONNECTION */

    try {

        window.readxSupabase =
            window.supabase.createClient(
                READX_SUPABASE_URL,
                READX_SUPABASE_KEY,
                {
                    auth: {
                        persistSession: true,
                        autoRefreshToken: true,
                        detectSessionInUrl: true
                    }
                }
            );

        console.log(
            "READ-X: Supabase initialized successfully."
        );

    } catch (error) {

        window.readxSupabase = null;

        console.error(
            "READ-X ERROR: Supabase initialization failed:",
            error
        );

    }

}
