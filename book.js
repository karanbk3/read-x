
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Connect | Login</title>
    <link rel="stylesheet" href="book.css">

    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    <script src="./supabase.js" defer></script>
    <script src="./book.js" defer></script>
</head>

<body>

    <main class="page">

        <!-- LEFT SIDE -->
        <section class="left-panel">

            <div class="brand">
                <span class="brand-icon">C</span>
                <span>Connect</span>
            </div>

            <div class="hero-content">
                <div class="illustration">
                    <div class="circle circle-one"></div>
                    <div class="circle circle-two"></div>

                    <div class="floating-card card-one">
                        <span>✦</span>
                        <div class="line"></div>
                        <div class="line short"></div>
                    </div>

                    <div class="floating-card card-two">
                        <div class="avatar">C</div>
                        <div class="line"></div>
                        <div class="line short"></div>
                    </div>

                    <div class="floating-icon">♥</div>
                </div>

                <h1>
                    Discover the
                    <br>
                    things that
                    <br>
                    <span>connect us.</span>
                </h1>

                <p>
                    Sign in to continue your journey and
                    stay connected with your community.
                </p>
            </div>

        </section>


        <!-- RIGHT SIDE -->
        <section class="right-panel">

            <div class="login-container">

                <div class="mobile-brand">CONNECT</div>

                <h2>Welcome back</h2>

                <p class="subtitle">
                    Enter your details to continue.
                </p>

                <form id="loginForm">

                    <label for="email">Email or mobile number</label>

                    <input
                        type="text"
                        id="email"
                        placeholder="Email address or mobile number"
                        autocomplete="username"
                        required
                    >

                    <label for="password">Password</label>

                    <input
                        type="password"
                        id="password"
                        placeholder="Enter your password"
                        autocomplete="current-password"
                        required
                    >

                    <p
                        id="errorMessage"
                        class="message"
                        aria-live="polite">
                    </p>

                    <a href="#" class="forgot-link">
                        Forgot password?
                    </a>

                    <button type="submit" class="login-button">
                        Log in
                    </button>

                </form>

                <div class="separator">
                    <span>OR</span>
                </div>

                <button
                    type="button"
                    class="create-button"
                    onclick="window.location.href='signup.html'">
                    Create new account
                </button>

                <p class="terms">
                    By continuing, you agree to our
                    <a href="#">Terms</a> and
                    <a href="#">Privacy Policy</a>.
                </p>

            </div>

        </section>

    </main>


    <footer>
        <div class="footer-links">
            <a href="#">About</a>
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
            <a href="#">Help</a>
            <a href="#">Contact</a>
        </div>

        <p>Connect © 2026. Learning project.</p>
    </footer>

</body>
</html>
