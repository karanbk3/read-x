
/* ==========================================
   READ-X | AUTHENTICATION SYSTEM
   Login, Signup and Password Reset
   No Automatic Home Redirect
========================================== */


/* 1. SUPABASE CONNECTION */

const db = window.readxSupabase;


/* 2. PAGE ELEMENTS */

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


/* 3. SETTINGS */

let currentMode = "login";
let authenticationInProgress = false;

const params = new URLSearchParams(window.location.search);


/* 4. OPTIONAL RETURN DESTINATION */

function getReturnDestination() {

    const returnTo = params.get("returnTo");

    // Stay on login page if no destination was requested.

    if (!returnTo) return null;

    try {

        const destination = new URL(
            returnTo,
            window.location.href
        );

        // Only allow pages on this website.

        if (destination.origin !== window.location.origin) {
            return null;
        }

        // Never redirect back to login itself.

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


/* 5. REDIRECT ONLY WHEN REQUESTED */

function redirectAfterAuthentication() {

    const destination = getReturnDestination();

    if (destination) {
        window.location.replace(destination);
    }

}


/* 6. SHOW MESSAGE */

function showMessage(message, type = "error") {

    authMessage.textContent = message;
    authMessage.className = "auth-message " + type;
    authMessage.hidden = false;

}


/* 7. CLEAR MESSAGE */

function clearMessage() {

    authMessage.textContent = "";
    authMessage.className = "auth-message";
    authMessage.hidden = true;

}


/* 8. BUTTON LOADING */

function setLoading(isLoading, text = "") {

    submitButton.disabled = isLoading;

    submitButton.textContent = isLoading
        ? "Please wait..."
        : text;

}


/* 9. SWITCH LOGIN / SIGNUP */

function setAuthMode(mode) {

    currentMode = mode;

    clearMessage();
    authForm.reset();

    const isSignup = mode === "signup";

    loginTab.classList.toggle("active", !isSignup);
    signupTab.classList.toggle("active", isSignup);

    nameGroup.hidden = !isSignup;
    phoneGroup.hidden = !isSignup;
    confirmPasswordGroup.hidden = !isSignup;

    fullName.required = isSignup;
    phone.required = false;
    confirmPassword.required = isSignup;

    password.autocomplete = isSignup
        ? "new-password"
        : "current-password";

    forgotPassword.hidden = isSignup;

    authTitle.textContent = isSignup
        ? "Create Your Account"
        : "Welcome Back!";

    authDescription.textContent = isSignup
        ? "Join READ-X and start sharing your ideas."
        : "Login to continue your reading journey.";

    submitButton.textContent = isSignup
        ? "Create Account"
        : "Login";

    switchAuth.innerHTML = isSignup
        ? 'Already have an account? <button type="button" id="switchAuthButton">Login</button>'
        : 'Don\'t have an account? <button type="button" id="switchAuthButton">Sign Up</button>';

    const switchButton = document.getElementById("switchAuthButton");

    switchButton.addEventListener("click", () => {

        if (!authenticationInProgress) {
            setAuthMode(isSignup ? "login" : "signup");
        }

    });

}


/* 10. TAB EVENTS */

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


/* 11. REGISTER USER */

async function registerUser() {

    const name = fullName.value.trim();
    const userEmail = email.value.trim();
    const userPhone = phone.value.trim();
    const userPassword = password.value;
    const confirmValue = confirmPassword.value;

    if (!name) {
        showMessage("Please enter your full name.");
        return;
    }

    if (!userEmail) {
        showMessage("Please enter your email address.");
        return;
    }

    if (userPassword.length < 6) {
        showMessage("Password must contain at least 6 characters.");
        return;
    }

    if (userPassword !== confirmValue) {
        showMessage("Your passwords do not match.");
        return;
    }

    const metadata = {
        full_name: name
    };

    if (userPhone) {
        metadata.phone_number = userPhone;
    }

    authenticationInProgress = true;

    setLoading(true);

    loginTab.disabled = true;
    signupTab.disabled = true;

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

            authenticationInProgress = false;
            setLoading(false, "Create Account");

            loginTab.disabled = false;
            signupTab.disabled = false;

            // Redirect only if returnTo was provided.
            redirectAfterAuthentication();

        } else {

            showMessage(
                "Account created! Please check your email, confirm your account, and then log in.",
                "success"
            );

            authenticationInProgress = false;

            setLoading(false, "Create Account");

            loginTab.disabled = false;
            signupTab.disabled = false;

        }

    } catch (error) {

        console.error("READ-X signup error:", error);

        showMessage(error.message);

        authenticationInProgress = false;

        setLoading(false, "Create Account");

        loginTab.disabled = false;
        signupTab.disabled = false;

    }

}


/* 12. LOGIN USER */

async function loginUser() {

    const userEmail = email.value.trim();
    const userPassword = password.value;

    if (!userEmail || !userPassword) {
        showMessage("Please enter your email and password.");
        return;
    }

    authenticationInProgress = true;

    setLoading(true);

    loginTab.disabled = true;
    signupTab.disabled = true;

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

            authenticationInProgress = false;

            setLoading(false, "Login");

            loginTab.disabled = false;
            signupTab.disabled = false;

            // Stay on login page unless returnTo exists.
            redirectAfterAuthentication();

        }

    } catch (error) {

        console.error("READ-X login error:", error);

        showMessage(error.message);

        authenticationInProgress = false;

        setLoading(false, "Login");

        loginTab.disabled = false;
        signupTab.disabled = false;

    }

}


/* 13. FORM SUBMISSION */

authForm.addEventListener("submit", async event => {

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


/* 14. FORGOT PASSWORD */

forgotPasswordLink.addEventListener("click", async event => {

    event.preventDefault();

    clearMessage();

    const userEmail = email.value.trim();

    if (!userEmail) {

        showMessage("Enter your email address first.");

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

        console.error(error);
        showMessage(error.message);

    } finally {

        forgotPasswordLink.style.pointerEvents = "";

    }

});


/* 15. FACEBOOK BUTTON */

facebookButton.addEventListener("click", () => {

    showMessage("Facebook login is coming soon.");

});


/* 16. INITIALIZE AUTHENTICATION */

async function initializeAuthentication() {

    if (!db) {

        showMessage(
            "READ-X database connection is missing. Check supabase.js."
        );

        submitButton.disabled = true;

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

    console.log("READ-X authentication initialized.");

}


/* 17. START */

if (document.readyState === "loading") {

    document.addEventListener(
        "DOMContentLoaded",
        initializeAuthentication
    );

} else {

    initializeAuthentication();

}
