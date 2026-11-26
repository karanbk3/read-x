
document.addEventListener("DOMContentLoaded", () => {

    // Supabase connection
    const supabaseClient = window.readxSupabase;

    // HTML elements
    const loginForm = document.getElementById("loginForm");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const errorMessage = document.getElementById("errorMessage");

    // Check required elements
    if (!loginForm || !emailInput || !passwordInput || !errorMessage) {
        console.error("Required HTML elements are missing.");
        return;
    }

    // Check Supabase connection
    if (!supabaseClient) {
        showError("Unable to connect to the server. Please try again.");
        console.error("Supabase connection not found.");
        return;
    }

    // Display error message
    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = "block";
        errorMessage.style.color = "#d93025";
    }

    // Display success message
    function showSuccess(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = "block";
        errorMessage.style.color = "#188038";
    }

    // Clear message
    function clearMessage() {
        errorMessage.textContent = "";
        errorMessage.style.display = "none";
    }

    // Validate email
    function isValidEmail(value) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    }

    // Validate international phone number
    function isValidPhone(value) {
        return /^\+[1-9]\d{7,14}$/.test(value);
    }

    // Login form
    loginForm.addEventListener("submit", async (event) => {

        event.preventDefault();

        clearMessage();

        // Get input values
        const loginId = emailInput.value.trim();
        const password = passwordInput.value;

        // Check empty fields
        if (!loginId && !password) {
            showError("Please enter your email or mobile number and password.");
            return;
        }

        if (!loginId) {
            showError("Please enter your email address or mobile number.");
            emailInput.focus();
            return;
        }

        if (!password) {
            showError("Please enter your password.");
            passwordInput.focus();
            return;
        }

        // Check whether input is email or phone
        const isEmail = isValidEmail(loginId);
        const isPhone = isValidPhone(loginId);

        if (!isEmail && !isPhone) {
            showError(
                "Enter a valid email or mobile number with country code, e.g. +9779812345678."
            );
            emailInput.focus();
            return;
        }

        // Find login button
        const loginButton = loginForm.querySelector(
            'button[type="submit"]'
        );

        if (!loginButton) {
            showError("Login button not found.");
            return;
        }

        // Loading state
        const originalText = loginButton.textContent;

        loginButton.disabled = true;
        loginButton.textContent = "Logging in...";

        try {

            // Prepare Supabase credentials
            const credentials = isEmail
                ? {
                    email: loginId,
                    password: password
                }
                : {
                    phone: loginId,
                    password: password
                };

            // Authenticate with Supabase
            const { data, error } =
                await supabaseClient.auth.signInWithPassword(credentials);

            // Handle login error
            if (error) {
                console.error("Supabase login error:", error.message);

                showError(
                    "Incorrect email/mobile number or password. Please try again."
                );

                return;
            }

            // Login successful
            showSuccess("Login successful! Welcome.");

            console.log("Authenticated user:", data.user.id);

            // Redirect to home page
            setTimeout(() => {
                window.location.href = "home.html";
            }, 1200);

        } catch (error) {

            console.error("Login error:", error);

            showError("Something went wrong. Please try again.");

        } finally {

            // Restore button
            loginButton.disabled = false;
            loginButton.textContent = originalText;

        }

    });

});
