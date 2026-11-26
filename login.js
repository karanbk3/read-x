
/* ==========================================
   READ-X | AUTHENTICATION SYSTEM
   Login, Signup and Password Reset
   Facebook Button → book.html
   No Automatic Home Redirect
========================================== */


/* 1. INITIALIZE AFTER HTML LOADS */

document.addEventListener("DOMContentLoaded", initializeAuthentication);


function initializeAuthentication() {


    /* 2. SUPABASE CONNECTION */

    const db = window.readxSupabase;


    /* 3. PAGE ELEMENTS */

    const authForm = document.getElementById("authForm");

    const loginTab = document.getElementById("loginTab");
    const signupTab = document.getElementById("signupTab");

    const authTitle = document.getElementById("authTitle");
    const authDescription = document.getElementById("authDescription");

    const nameGroup = document.getElementById("nameGroup");
    const phoneGroup = document.getElementById("phoneGroup");
    const confirmPasswordGroup = document.getElementById("confirmPasswordGroup");

    const fullName = document.getElementById("fullName");
    const email = document.getElementById("email");
    const phone = document.getElementById("phone");
    const password = document.getElementById("password");
    const confirmPassword = document.getElementById("confirmPassword");

    const forgotPassword = document.getElementById("forgotPassword");
    const forgotPasswordLink = document.getElementById("forgotPasswordLink");

    const submitButton = document.getElementById("submitButton");
    const authMessage = document.getElementById("authMessage");

    const switchAuth = document.getElementById("switchAuth");
    const facebookButton = document.getElementById("facebookButton");


    /* 4. CHECK REQUIRED ELEMENTS */

    if (
        !authForm ||
        !loginTab ||
        !signupTab ||
        !submitButton ||
        !authMessage ||
        !email ||
        !password
    ) {
        console.error("READ-X: Required authentication elements are missing.");
        return;
    }


    /* 5. SETTINGS */

    let currentMode = "login";
    let authenticationInProgress = false;

    const params = new URLSearchParams(window.location.search);


    /* 6. OPTIONAL RETURN DESTINATION */

    function getReturnDestination() {

        const returnTo = params.get("returnTo");

        if (!returnTo) return null;

        try {

            const destination = new URL(
                returnTo,
                window.location.href
            );

            if (destination.origin !== window.location.origin) {
                return null;
            }

            if (
                destination.pathname.endsWith("/login.html") ||
                destination.pathname.endsWith("/login")
            ) {
                return null;
            }

            return destination.href;

        } catch (error) {

            console.error("Invalid return destination:", error);

            return null;

        }

    }


    /* 7. REDIRECT ONLY WHEN REQUESTED */

    function redirectAfterAuthentication() {

        const destination = getReturnDestination();

        if (destination) {
            window.location.replace(destination);
        }

    }


    /* 8. SHOW MESSAGE */

    function showMessage(message, type = "error") {

        authMessage.textContent = message;
        authMessage.className = "auth-message " + type;
        authMessage.hidden = false;

    }


    /* 9. CLEAR MESSAGE */

    function clearMessage() {

        authMessage.textContent = "";
        authMessage.className = "auth-message";
        authMessage.hidden = true;

    }


    /* 10. BUTTON LOADING */

    function setLoading(isLoading, text = "") {

        submitButton.disabled = isLoading;

        submitButton.textContent = isLoading
            ? "Please wait..."
            : text;

        loginTab.disabled = isLoading;
        signupTab.disabled = isLoading;

        authenticationInProgress = isLoading;

    }


    /* 11. SWITCH LOGIN / SIGNUP */

    function setAuthMode(mode) {

        currentMode = mode;

        clearMessage();
        authForm.reset();

        const isSignup = mode === "signup";

        loginTab.classList.toggle("active", !isSignup);
        signupTab.classList.toggle("active", isSignup);

        if (nameGroup) nameGroup.hidden = !isSignup;
        if (phoneGroup) phoneGroup.hidden = !isSignup;

        if (confirmPasswordGroup) {
            confirmPasswordGroup.hidden = !isSignup;
        }

        if (fullName) fullName.required = isSignup;

        if (phone) phone.required = false;

        if (confirmPassword) {
            confirmPassword.required = isSignup;
        }

        password.autocomplete = isSignup
            ? "new-password"
            : "current-password";

        if (forgotPassword) {
            forgotPassword.hidden = isSignup;
        }

        authTitle.textContent = isSignup
            ? "Create Your Account"
            : "Welcome Back!";

        if (authDescription) {
            authDescription.textContent = isSignup
                ? "Join READ-X and start sharing your ideas."
                : "Login to continue your reading journey.";
        }

        submitButton.textContent = isSignup
            ? "Create Account"
            : "Login";

        if (switchAuth) {

            switchAuth.innerHTML = isSignup
                ? 'Already have an account? <button type="button" id="switchAuthButton">Login</button>'
                : 'Don\'t have an account? <button type="button" id="switchAuthButton">Sign Up</button>';

            const switchButton = document.getElementById("switchAuthButton");

            if (switchButton) {

                switchButton.addEventListener("click", () => {

                    if (!authenticationInProgress) {
                        setAuthMode(isSignup ? "login" : "signup");
                    }

                });

            }

        }

    }


    /* 12. TAB EVENTS */

    loginTab.addEventListener("click", () => {

        if (!authenticationInProgress) {
            setAuthMode("login");
        }

    });


    signupTab.addEventListener("click", () => {

        if (!authenticationInProgress) {
            setAuthMode("signup");
        }

    });


    /* 13. REGISTER USER */

    async function registerUser() {

        const name = fullName.value.trim();
        const userEmail = email.value.trim();
        const userPhone = phone ? phone.value.trim() : "";
        const userPassword = password.value;
        const confirmValue = confirmPassword
            ? confirmPassword.value
            : "";

        if (!name) {
            showMessage("Please enter your full name.");
            fullName.focus();
            return;
        }

        if (!userEmail) {
            showMessage("Please enter your email address.");
            email.focus();
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail)) {
            showMessage("Please enter a valid email address.");
            email.focus();
            return;
        }

        if (userPassword.length < 6) {
            showMessage("Password must contain at least 6 characters.");
            password.focus();
            return;
        }

        if (userPassword !== confirmValue) {
            showMessage("Your passwords do not match.");
            confirmPassword.focus();
            return;
        }

        const metadata = {
            full_name: name
        };

        if (userPhone) {
            metadata.phone_number = userPhone;
        }

        setLoading(true);

        try {

            const confirmationURL = new URL(
                "./login.html",
                window.location.href
            );

            confirmationURL.searchParams.set("confirmed", "true");

            const { data, error } = await db.auth.signUp({

                email: userEmail,
                password: userPassword,

                options: {
                    data: metadata,
                    emailRedirectTo: confirmationURL.href
                }

            });

            if (error) throw error;

            if (data.session) {

                showMessage(
                    "Account created successfully! You are now logged in.",
                    "success"
                );

                setLoading(false, "Create Account");

                redirectAfterAuthentication();

            } else {

                showMessage(
                    "Account created! Please check your email and confirm your account before logging in.",
                    "success"
                );

                setLoading(false, "Create Account");

            }

        } catch (error) {

            console.error("READ-X signup error:", error);

            showMessage(error.message || "Unable to create your account.");

            setLoading(false, "Create Account");

        }

    }


    /* 14. LOGIN USER */

    async function loginUser() {

        const userEmail = email.value.trim();
        const userPassword = password.value;

        if (!userEmail) {
            showMessage("Please enter your email address.");
            email.focus();
            return;
        }

        if (!userPassword) {
            showMessage("Please enter your password.");
            password.focus();
            return;
        }

        setLoading(true);

        try {

            const { data, error } = await db.auth.signInWithPassword({

                email: userEmail,
                password: userPassword

            });

            if (error) throw error;

            if (data.session) {

                showMessage(
                    "Login successful! Welcome to READ-X.",
                    "success"
                );

                setLoading(false, "Login");

                // No automatic home redirect.
                // Redirect only if returnTo was provided.
                redirectAfterAuthentication();

            }

        } catch (error) {

            console.error("READ-X login error:", error);

            showMessage(
                "Incorrect email or password. Please try again."
            );

            setLoading(false, "Login");

        }

    }


    /* 15. FORM SUBMISSION */

    authForm.addEventListener("submit", async (event) => {

        event.preventDefault();

        if (authenticationInProgress) return;

        clearMessage();

        if (!db) {

            showMessage(
                "Database connection missing. Please refresh the page."
            );

            return;

        }

        if (currentMode === "signup") {
            await registerUser();
        } else {
            await loginUser();
        }

    });


    /* 16. FORGOT PASSWORD */

    if (forgotPasswordLink) {

        forgotPasswordLink.addEventListener("click", async (event) => {

            event.preventDefault();

            clearMessage();

            if (!db) {
                showMessage("Database connection is unavailable.");
                return;
            }

            const userEmail = email.value.trim();

            if (!userEmail) {

                showMessage("Enter your email address first.");

                email.focus();

                return;

            }

            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail)) {

                showMessage("Please enter a valid email address.");

                email.focus();

                return;

            }

            try {

                forgotPasswordLink.style.pointerEvents = "none";

                const redirectURL = new URL(
                    "./login.html",
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

            } catch (error) {

                console.error("Password reset error:", error);

                showMessage("Unable to send the password reset email.");

            } finally {

                forgotPasswordLink.style.pointerEvents = "";

            }

        });

    }


    /* 17. FACEBOOK BUTTON */

    if (facebookButton) {

        facebookButton.addEventListener("click", () => {

            // Open book.html in the same browser tab.
            window.location.href = "./book.html";

        });

    }


    /* 18. INITIALIZE AUTHENTICATION */

    if (!db) {

        showMessage(
            "READ-X database connection is missing. Check supabase.js."
        );

        submitButton.disabled = true;

        console.error("READ-X Supabase connection not found.");

        return;

    }

    const requestedMode = params.get("mode");

    setAuthMode(
        requestedMode === "signup"
            ? "signup"
            : "login"
    );

    if (params.get("confirmed") === "true") {

        showMessage(
            "Email confirmed successfully! Please log in.",
            "success"
        );

    }

    console.log("READ-X authentication initialized successfully.");

}
