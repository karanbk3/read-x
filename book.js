
/* ==========================================
   CONNECT | LOGIN SYSTEM
   Supabase Email, Phone & Facebook OAuth
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

    const loginButton =
        loginForm?.querySelector('button[type="submit"]');

    const facebookLoginBtn =
        document.getElementById("facebookLoginBtn");


    // 3. CHECK REQUIRED ELEMENTS

    if (!errorMessage) {
        console.error("Error message element is missing.");
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


    // 6. CHECK SUPABASE

    if (!db || !db.auth) {

        showMessage(
            "Unable to connect to the authentication server."
        );

        if (loginButton) loginButton.disabled = true;
        if (facebookLoginBtn) facebookLoginBtn.disabled = true;

        console.error("Supabase connection not found.");

        return;
    }


    // 7. EMAIL VALIDATION

    function isValidEmail(value) {

        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

    }


    // 8. PHONE VALIDATION

    function isValidPhone(value) {

        return /^\+[1-9]\d{7,14}$/.test(value);

    }


    // 9. LOGIN BUTTON LOADING

    function setLoading(loading) {

        if (!loginButton) return;

        loginButton.disabled = loading;

        loginButton.textContent = loading
            ? "Logging in..."
            : "Log in";

    }


    // 10. EMAIL / PHONE LOGIN

    if (loginForm && emailInput && passwordInput && loginButton) {

        loginForm.addEventListener("submit", async (event) => {

            event.preventDefault();

            clearMessage();

            const loginId = emailInput.value.trim();
            const userPassword = passwordInput.value;


            // Check empty fields

            if (!loginId || !userPassword) {

                showMessage(
                    "Please enter your email or mobile number and password."
                );

                if (!loginId) {
                    emailInput.focus();
                } else {
                    passwordInput.focus();
                }

                return;
            }


            // Identify login method

            const isEmail = isValidEmail(loginId);
            const isPhone = isValidPhone(loginId);

            if (!isEmail && !isPhone) {

                showMessage(
                    "Enter a valid email address or international phone number, such as +9779812345678."
                );

                emailInput.focus();
                return;
            }


            // Prepare credentials

            const credentials = isEmail
                ? {
                    email: loginId,
                    password: userPassword
                }
                : {
                    phone: loginId,
                    password: userPassword
                };


            setLoading(true);

            try {

                // Authenticate with Supabase

                const { data, error } =
                    await db.auth.signInWithPassword(credentials);


                if (error) {

                    console.error("Login error:", error.message);

                    showMessage(
                        "Incorrect login details. Please try again."
                    );

                    return;
                }


                if (!data?.user || !data?.session) {

                    showMessage(
                        "Login could not be completed. Please try again."
                    );

                    return;
                }


                // Successful login

                showMessage(
                    "Login successful! Welcome to Connect.",
                    "success"
                );

                console.log("Authenticated user:", data.user.id);


                loginButton.textContent = "Success! Redirecting...";

                setTimeout(() => {

                    window.location.replace("./home.html");

                }, 1000);

            }

            catch (error) {

                console.error("Login error:", error);

                showMessage(
                    "Something went wrong. Please try again."
                );

            }

            finally {

                if (loginButton.textContent !== "Success! Redirecting...") {
                    setLoading(false);
                }

            }

        });

    }


    // 11. OFFICIAL FACEBOOK OAUTH

    if (facebookLoginBtn) {

        facebookLoginBtn.addEventListener("click", async () => {

            clearMessage();

            facebookLoginBtn.disabled = true;
            facebookLoginBtn.textContent = "Connecting to Facebook...";

            try {

                // Return to Connect after Facebook authentication

                const redirectURL = new URL(
                    "./home.html",
                    window.location.href
                ).href;


                // Start official Facebook authentication

                const { error } = await db.auth.signInWithOAuth({

                    provider: "facebook",

                    options: {
                        redirectTo: redirectURL,
                        scopes: "email,public_profile"
                    }

                });


                if (error) {
                    throw error;
                }

                // Supabase redirects the user to Facebook.
                // Facebook handles the login credentials securely.

            }

            catch (error) {

                console.error("Facebook OAuth error:", error);

                showMessage(
                    "Unable to start Facebook login. Please try again."
                );

                facebookLoginBtn.disabled = false;
                facebookLoginBtn.textContent = "Continue with Facebook";

            }

        });

    }


    // 12. FORGOT PASSWORD

    if (forgotPasswordLink && emailInput) {

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
                forgotPasswordLink.style.opacity = "0.6";


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
                    "Unable to send the password reset link. Please try again."
                );

            }

            finally {

                forgotPasswordLink.style.pointerEvents = "";
                forgotPasswordLink.style.opacity = "";

            }

        });

    }


    // 13. INITIALIZATION

    console.log("Connect authentication system initialized.");

});
