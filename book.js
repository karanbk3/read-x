
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


    // 3. CHECK HTML ELEMENTS

    if (!loginForm || !emailInput || !passwordInput ||
        !errorMessage || !loginButton) {

        console.error("Some required HTML elements are missing.");
        return;

    }


    // 4. CHECK SUPABASE

    if (!db) {

        showMessage(
            "Unable to connect to the server. Please check your connection.",
            "error"
        );

        loginButton.disabled = true;

        console.error("Supabase connection not found.");

        return;

    }


    // 5. SHOW MESSAGE

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


    // 6. CLEAR MESSAGE

    function clearMessage() {

        errorMessage.textContent = "";
        errorMessage.style.display = "none";

    }


    // 7. VALIDATE EMAIL

    function isValidEmail(value) {

        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

    }


    // 8. VALIDATE PHONE NUMBER

    function isValidPhone(value) {

        // International format, for example:
        // +9779812345678

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

            showMessage("Please enter your email or mobile number and password.");
            emailInput.focus();

            return;

        }

        if (!loginId) {

            showMessage("Please enter your email or mobile number.");
            emailInput.focus();

            return;

        }

        if (!userPassword) {

            showMessage("Please enter your password.");
            passwordInput.focus();

            return;

        }


        // Identify email or phone

        const isEmail = isValidEmail(loginId);
        const isPhone = isValidPhone(loginId);

        if (!isEmail && !isPhone) {

            showMessage(
                "Enter a valid email address or international phone number, such as +9779812345678."
            );

            emailInput.focus();

            return;

        }


        // Prepare Supabase credentials

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

            const { data, error } =
                await db.auth.signInWithPassword(credentials);

            if (error) {

                console.error("Login error:", error.message);

                showMessage(
                    "Incorrect login details. Please check your email or phone number and password."
                );

                return;

            }


            // Successful login

            showMessage(
                "Login successful! Welcome.",
                "success"
            );

            console.log("Authenticated user ID:", data.user.id);

            console.log("Login successful.");

            // The user remains on this page.
            // You can add a redirect later.

        }

        catch (error) {

            console.error("Unexpected login error:", error);

            showMessage(
                "Something went wrong. Please try again."
            );

        }

        finally {

            setLoading(false);

        }

    });


    // 11. FORGOT PASSWORD

    if (forgotPasswordLink) {

        forgotPasswordLink.addEventListener("click", async (event) => {

            event.preventDefault();

            clearMessage();

            const userEmail = emailInput.value.trim();

            if (!userEmail || !isValidEmail(userEmail)) {

                showMessage(
                    "Enter your registered email address to receive a password reset link."
                );

                emailInput.focus();

                return;

            }

            try {

                forgotPasswordLink.style.pointerEvents = "none";

                const redirectURL = new URL(
                    "./book.html",
                    window.location.href
                ).href;

                const { error } = await db.auth.resetPasswordForEmail(
                    userEmail,
                    {
                        redirectTo: redirectURL
                    }
                );

                if (error) throw error;

                showMessage(
                    "If an account exists for this email, a password reset link will be sent.",
                    "success"
                );

            }

            catch (error) {

                console.error("Password reset error:", error);

                showMessage(
                    "Unable to send the reset link. Please try again."
                );

            }

            finally {

                forgotPasswordLink.style.pointerEvents = "";

            }

        });

    }


    // 12. INITIALIZATION

    console.log("Connect authentication system initialized.");

});
