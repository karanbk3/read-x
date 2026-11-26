
/* ==========================================
   CONNECT | LOGIN SYSTEM
   Supabase Authentication
========================================== */

document.addEventListener("DOMContentLoaded", () => {

    // 1. SUPABASE CONNECTION

    const db = window.readxSupabase;


    // 2. HTML ELEMENTS

    const loginForm = document.getElementById("loginForm");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const errorMessage = document.getElementById("errorMessage");

    const forgotPasswordLink = document.querySelector(".forgot-link");
    const loginButton = loginForm?.querySelector('button[type="submit"]');


    // 3. CHECK REQUIRED HTML ELEMENTS

    if (
        !loginForm ||
        !emailInput ||
        !passwordInput ||
        !errorMessage ||
        !loginButton
    ) {
        console.error("Required login HTML elements are missing.");
        return;
    }


    // 4. SHOW MESSAGE

    function showMessage(message, type = "error") {

        errorMessage.textContent = message;
        errorMessage.style.display = "block";

        if (type === "success") {

            errorMessage.style.background = "#eaf8ef";
            errorMessage.style.border = "1px solid #b7e4c7";
            errorMessage.style.color = "#188038";

        } else {

            errorMessage.style.background = "#fff0f0";
            errorMessage.style.border = "1px solid #ffd1d1";
            errorMessage.style.color = "#d93025";

        }

    }


    // 5. CLEAR MESSAGE

    function clearMessage() {

        errorMessage.textContent = "";
        errorMessage.style.display = "none";

    }


    // 6. CHECK SUPABASE CONNECTION

    if (!db || !db.auth) {

        showMessage(
            "Unable to connect to the server. Please check your connection."
        );

        loginButton.disabled = true;

        console.error(
            "Supabase client not found. Check supabase.js and script loading order."
        );

        return;

    }


    // 7. VALIDATE EMAIL

    function isValidEmail(value) {

        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

    }


    // 8. VALIDATE PHONE NUMBER

    function isValidPhone(value) {

        // International phone format.
        // Example: +9779812345678

        return /^\+[1-9]\d{7,14}$/.test(value);

    }


    // 9. BUTTON LOADING

    function setLoading(loading) {

        loginButton.disabled = loading;

        loginButton.textContent = loading
            ? "Logging in..."
            : "Log in";

    }


    // 10. LOGIN SYSTEM

    loginForm.addEventListener("submit", async (event) => {

        event.preventDefault();

        clearMessage();

        const loginId = emailInput.value.trim();
        const userPassword = passwordInput.value;


        // Check empty fields

        if (!loginId && !userPassword) {

            showMessage(
                "Please enter your email or mobile number and password."
            );

            emailInput.focus();
            return;

        }

        if (!loginId) {

            showMessage(
                "Please enter your email or mobile number."
            );

            emailInput.focus();
            return;

        }

        if (!userPassword) {

            showMessage("Please enter your password.");

            passwordInput.focus();
            return;

        }


        // Identify email or phone number

        const isEmail = isValidEmail(loginId);
        const isPhone = isValidPhone(loginId);

        if (!isEmail && !isPhone) {

            showMessage(
                "Enter a valid email address or international phone number, such as +9779812345678."
            );

            emailInput.focus();
            return;

        }


        // Prepare login credentials

        const credentials = isEmail
            ? {
                email: loginId,
                password: userPassword
            }
            : {
                phone: loginId,
                password: userPassword
            };


        // Start login

        setLoading(true);

        try {

            // Authenticate with Supabase

            const { data, error } =
                await db.auth.signInWithPassword(credentials);


            // Handle login errors

            if (error) {

                console.error("Supabase login error:", error.message);

                showMessage(
                    "Incorrect login details. Please check your email or phone number and password."
                );

                return;

            }


            // Confirm successful authentication

            if (!data || !data.user || !data.session) {

                showMessage(
                    "Login could not be completed. Please try again."
                );

                return;

            }


            // LOGIN SUCCESSFUL

            console.log("Login successful.");
            console.log("Authenticated user ID:", data.user.id);

            showMessage(
                "Login successful! Welcome to Connect.",
                "success"
            );


            // Redirect to home.html

            loginButton.textContent = "Success! Redirecting...";

            setTimeout(() => {

                window.location.replace("./home.html");

            }, 1000);

        }

        catch (error) {

            console.error("Unexpected login error:", error);

            showMessage(
                "Something went wrong. Please check your connection and try again."
            );

        }

        finally {

            // Restore button only if redirect has not started

            if (!window.location.href.includes("home.html")) {
                setLoading(false);
            }

        }

    });


    // 11. FORGOT PASSWORD SYSTEM

    if (forgotPasswordLink) {

        forgotPasswordLink.addEventListener("click", async (event) => {

            event.preventDefault();

            clearMessage();

            const userEmail = emailInput.value.trim();


            // Password reset requires an email address

            if (!userEmail || !isValidEmail(userEmail)) {

                showMessage(
                    "Enter your registered email address to receive a password reset link."
                );

                emailInput.focus();
                return;

            }


            try {

                forgotPasswordLink.style.pointerEvents = "none";

                forgotPasswordLink.style.opacity = "0.6";


                // Password reset redirect address

                const redirectURL = new URL(
                    "./book.html",
                    window.location.href
                ).href;


                // Send password reset email

                const { error } = await db.auth.resetPasswordForEmail(
                    userEmail,
                    {
                        redirectTo: redirectURL
                    }
                );


                if (error) {
                    throw error;
                }


                showMessage(
                    "If an account exists for this email, a password reset link will be sent.",
                    "success"
                );

            }

            catch (error) {

                console.error("Password reset error:", error);

                showMessage(
                    "Unable to send the password reset link. Please try again."
                );

            }

            finally {

                forgotPasswordLink.style.pointerEvents = "";
                forgotPasswordLink.style.opacity = "";

            }

        });

    }


    // 12. INITIALIZATION

    console.log("Connect authentication system initialized successfully.");

});
