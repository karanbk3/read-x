/* ==========================================
   READ-X | ADMIN DASHBOARD
   Improved Authentication & Admin Verification
   Announcements, Updates & Activity
========================================== */


/* 1. SUPABASE CONNECTION */

const db = window.readxSupabase;


/* 2. PAGE ELEMENTS */

const adminLoading = document.getElementById("adminLoading");
const accessDenied = document.getElementById("accessDenied");
const adminDashboard = document.getElementById("adminDashboard");

const adminEmail = document.getElementById("adminEmail");
const pageTitle = document.getElementById("pageTitle");
const adminMessage = document.getElementById("adminMessage");

const sections = {
    overview: document.getElementById("overviewSection"),
    announcements: document.getElementById("announcementsSection"),
    updates: document.getElementById("updatesSection"),
    activity: document.getElementById("activitySection")
};

const announcementList = document.getElementById("announcementList");
const updateList = document.getElementById("updateList");
const activityList = document.getElementById("activityList");


/* 3. GLOBAL VARIABLES */

let currentAdmin = null;
let messageTimer = null;
let verificationInProgress = false;
let authSubscription = null;
let verificationNumber = 0;


/* 4. BASIC HELPERS */

function showMessage(message, isError = false) {

    if (!adminMessage) return;

    adminMessage.textContent = message;

    adminMessage.style.background = isError
        ? "#b83232"
        : "#10172a";

    adminMessage.classList.remove("hidden");

    clearTimeout(messageTimer);

    messageTimer = setTimeout(() => {
        adminMessage.classList.add("hidden");
    }, 4000);

}


function escapeHTML(value = "") {

    return String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[character]);

}


function formatDate(value) {

    if (!value) return "No date";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "No date";
    }

    return date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric"
    });

}


function showEmpty(container, title, description) {

    if (!container) return;

    container.innerHTML = `
        <div class="empty-state">
            <span>📂</span>
            <h3>${escapeHTML(title)}</h3>
            <p>${escapeHTML(description)}</p>
        </div>
    `;

}


function setLoading() {

    adminLoading?.classList.remove("hidden");
    accessDenied?.classList.add("hidden");
    adminDashboard?.classList.add("hidden");

}


function showDenied(message = "This page is only available to authorized READ-X administrators.") {

    currentAdmin = null;

    adminLoading?.classList.add("hidden");
    adminDashboard?.classList.add("hidden");
    accessDenied?.classList.remove("hidden");

    const description = accessDenied?.querySelector("p");

    if (description) {
        description.textContent = message;
    }

}


/* 5. PAGE NAVIGATION */

function openSection(sectionName) {

    if (!sections[sectionName]) return;

    Object.entries(sections).forEach(([name, section]) => {

        section?.classList.toggle(
            "hidden",
            name !== sectionName
        );

    });

    document.querySelectorAll("[data-section]").forEach(button => {

        button.classList.toggle(
            "active",
            button.dataset.section === sectionName
        );

    });

    const titles = {
        overview: "Dashboard Overview",
        announcements: "Announcements",
        updates: "Update Plans",
        activity: "Admin Activity"
    };

    if (pageTitle) {
        pageTitle.textContent = titles[sectionName];
    }

    if (sectionName === "announcements") loadAnnouncements();
    if (sectionName === "updates") loadUpdates();
    if (sectionName === "activity") loadActivity();

}


document.querySelectorAll("[data-section]").forEach(button => {

    button.addEventListener("click", () => {

        openSection(button.dataset.section);

    });

});


/* 6. LOGIN REDIRECTION */

function redirectToLogin() {

    window.location.replace(
        "./login.html?mode=login&returnTo=admin.html"
    );

}


/* 7. ADMIN VERIFICATION */

async function checkAdminAccess() {

    // Prevent two verification requests running together.
    if (verificationInProgress) return;

    verificationInProgress = true;

    const thisVerification = ++verificationNumber;

    try {

        if (!db) {

            throw new Error(
                "Supabase connection not found. Check your supabase.js file."
            );

        }

        setLoading();

        console.log("READ-X: Checking login session...");

        // STEP 1: Check the logged-in user.

        const {
            data: sessionData,
            error: sessionError
        } = await db.auth.getSession();

        if (sessionError) throw sessionError;

        const session = sessionData?.session;

        if (!session) {

            console.log("READ-X: No active login session.");

            redirectToLogin();

            return;

        }

        // STEP 2: Save the logged-in user.

        currentAdmin = session.user;

        console.log(
            "READ-X: Logged in account:",
            currentAdmin.email,
            currentAdmin.id
        );

        // STEP 3: Ask Supabase to verify admin access.

        console.log("READ-X: Checking administrator permission...");

        const {
            data: isAdmin,
            error: adminError
        } = await db.rpc("is_readx_admin");

        if (adminError) {

            console.error(
                "READ-X ADMIN RPC ERROR:",
                adminError
            );

            throw new Error(
                "Admin verification failed: " + adminError.message
            );

        }

        console.log(
            "READ-X: Admin verification result:",
            isAdmin
        );

        // STEP 4: Only allow verified administrators.

        if (isAdmin !== true) {

            console.warn(
                "READ-X: This account does not have admin permission."
            );

            showDenied(
                "Your account is logged in, but it is not registered as a READ-X administrator. Check the admin_users table in Supabase."
            );

            return;

        }

        // STEP 5: Show the admin dashboard.

        console.log("READ-X: Administrator access granted.");

        currentAdmin = session.user;

        if (adminEmail) {
            adminEmail.textContent =
                currentAdmin.email || "Admin account";
        }

        adminLoading?.classList.add("hidden");
        accessDenied?.classList.add("hidden");
        adminDashboard?.classList.remove("hidden");

        await loadDashboard();

        openSection("overview");

    } catch (error) {

        console.error(
            "READ-X ADMIN ACCESS ERROR:",
            error
        );

        showDenied(
            error.message ||
            "Could not verify administrator access. Please check your Supabase configuration."
        );

    } finally {

        if (thisVerification === verificationNumber) {
            verificationInProgress = false;
        }

    }

}


/* 8. ACCESS DENIED LOGIN BUTTON */

document.getElementById("deniedLoginBtn")
    ?.addEventListener("click", redirectToLogin);


/* 9. LOGOUT */

document.getElementById("logoutBtn")
    ?.addEventListener("click", async () => {

        if (!db) return;

        const confirmed = confirm(
            "Are you sure you want to sign out?"
        );

        if (!confirmed) return;

        const { error } = await db.auth.signOut();

        if (error) {

            showMessage(error.message, true);

            return;

        }

        currentAdmin = null;

        window.location.replace("./home.html");

    });


/* 10. AUTHENTICATION CHANGES */

if (db) {

    const { data } = db.auth.onAuthStateChange((event) => {

        console.log(
            "READ-X authentication event:",
            event
        );

        // Do not call Supabase auth methods directly
        // inside this callback. Run the check afterwards.

        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {

            setTimeout(() => {

                checkAdminAccess();

            }, 0);

        }

        if (event === "SIGNED_OUT") {

            currentAdmin = null;

            window.location.replace("./home.html");

        }

    });

    authSubscription = data.subscription;

}


/* 11. ADMIN ACTIVITY LOGGER */

async function recordActivity(action, details) {

    if (!currentAdmin || !db) return;

    const { error } = await db
        .from("admin_activity")
        .insert({

            admin_id: currentAdmin.id,
            action: action,
            details: details

        });

    if (error) {

        console.error(
            "Activity recording failed:",
            error
        );

    }

}


/* 12. DASHBOARD OVERVIEW */

async function loadDashboard() {

    if (!currentAdmin) return;

    const [announcements, updates, activities] =
        await Promise.all([

            db.from("announcements")
                .select("id", {
                    count: "exact",
                    head: true
                }),

            db.from("app_updates")
                .select("id", {
                    count: "exact",
                    head: true
                }),

            db.from("admin_activity")
                .select("id", {
                    count: "exact",
                    head: true
                })

        ]);

    const announcementCount =
        document.getElementById("announcementCount");

    const updateCount =
        document.getElementById("updateCount");

    const activityCount =
        document.getElementById("activityCount");

    if (announcementCount) {
        announcementCount.textContent =
            announcements.count ?? "—";
    }

    if (updateCount) {
        updateCount.textContent =
            updates.count ?? "—";
    }

    if (activityCount) {
        activityCount.textContent =
            activities.count ?? "—";
    }

    const errors = [
        announcements.error,
        updates.error,
        activities.error
    ].filter(Boolean);

    if (errors.length) {

        console.error("Dashboard loading errors:", errors);

        showMessage(
            "Some dashboard statistics could not load.",
            true
        );

    }

}


/* 13. ANNOUNCEMENT ELEMENTS */

const announcementForm =
    document.getElementById("announcementForm");

const announcementEditor =
    document.getElementById("announcementEditor");

const announcementId =
    document.getElementById("announcementId");

const announcementTitle =
    document.getElementById("announcementTitle");

const announcementDescription =
    document.getElementById("announcementDescription");

const announcementContent =
    document.getElementById("announcementContent");

const announcementStatus =
    document.getElementById("announcementStatus");


/* 14. CREATE ANNOUNCEMENT */

document.getElementById("newAnnouncementBtn")
    ?.addEventListener("click", () => {

        announcementEditor?.reset();

        if (announcementId) announcementId.value = "";

        const formTitle =
            document.getElementById("announcementFormTitle");

        if (formTitle) {
            formTitle.textContent = "Create Announcement";
        }

        announcementForm?.classList.remove("hidden");

        announcementForm?.scrollIntoView({
            behavior: "smooth"
        });

    });


/* 15. CANCEL ANNOUNCEMENT */

document.getElementById("cancelAnnouncementBtn")
    ?.addEventListener("click", () => {

        announcementForm?.classList.add("hidden");

        announcementEditor?.reset();

    });/* 16. SAVE ANNOUNCEMENT */

announcementEditor?.addEventListener("submit", async event => {

    event.preventDefault();

    if (!currentAdmin) return;

    const id = announcementId?.value || "";

    const announcement = {

        title: announcementTitle?.value.trim() || "",

        description:
            announcementDescription?.value.trim() || "",

        content:
            announcementContent?.value.trim() || "",

        status: announcementStatus?.value || "draft",

        author_name: "Team X",

        updated_at: new Date().toISOString()

    };

    if (!announcement.title || !announcement.description) {

        showMessage(
            "Please complete the required fields.",
            true
        );

        return;

    }

    const saveButton =
        document.getElementById("saveAnnouncementBtn");

    if (saveButton) {
        saveButton.disabled = true;
        saveButton.textContent = "Saving...";
    }

    try {

        let result;

        if (id) {

            result = await db
                .from("announcements")
                .update(announcement)
                .eq("id", id);

        } else {

            result = await db
                .from("announcements")
                .insert(announcement);

        }

        if (result.error) throw result.error;

        await recordActivity(
            id ? "Updated announcement" : "Created announcement",
            announcement.title
        );

        announcementForm?.classList.add("hidden");

        announcementEditor?.reset();

        showMessage("Announcement saved successfully!");

        await loadAnnouncements();

        await loadDashboard();

    } catch (error) {

        console.error(error);

        showMessage(
            error.message || "Could not save announcement.",
            true
        );

    } finally {

        if (saveButton) {
            saveButton.disabled = false;
            saveButton.textContent = "Save Announcement";
        }

    }

});


/* 17. LOAD ANNOUNCEMENTS */

async function loadAnnouncements() {

    if (!currentAdmin || !announcementList) return;

    announcementList.innerHTML =
        "<p>Loading announcements...</p>";

    const { data, error } = await db
        .from("announcements")
        .select("*")
        .order("created_at", {
            ascending: false
        });

    if (error) {

        console.error(error);

        showEmpty(
            announcementList,
            "Could not load announcements",
            error.message
        );

        return;

    }

    if (!data || data.length === 0) {

        showEmpty(
            announcementList,
            "No announcements yet",
            "Create your first READ-X announcement."
        );

        return;

    }

    announcementList.innerHTML = data.map(item => `

        <article class="data-card">

            <div class="data-card-main">

                <span class="status ${escapeHTML(item.status)}">
                    ${escapeHTML(item.status)}
                </span>

                <h3>${escapeHTML(item.title)}</h3>

                <p>${escapeHTML(item.description || "")}</p>

                <div class="data-meta">

                    <span>
                        By ${escapeHTML(item.author_name || "Team X")}
                    </span>

                    <span>${formatDate(item.created_at)}</span>

                </div>

            </div>

            <div class="data-actions">

                <button
                    class="secondary-btn"
                    data-action="edit-announcement"
                    data-id="${escapeHTML(item.id)}">
                    Edit
                </button>

                <button
                    class="danger-btn"
                    data-action="delete-announcement"
                    data-id="${escapeHTML(item.id)}">
                    Delete
                </button>

            </div>

        </article>

    `).join("");

}


/* 18. ANNOUNCEMENT EDIT AND DELETE */

announcementList?.addEventListener("click", async event => {

    const button = event.target.closest("button[data-action]");

    if (!button || !currentAdmin) return;

    const id = button.dataset.id;
    const action = button.dataset.action;

    if (action === "edit-announcement") {

        const { data, error } = await db
            .from("announcements")
            .select("*")
            .eq("id", id)
            .single();

        if (error) {
            showMessage(error.message, true);
            return;
        }

        announcementId.value = data.id;
        announcementTitle.value = data.title || "";
        announcementDescription.value = data.description || "";
        announcementContent.value = data.content || "";
        announcementStatus.value = data.status || "draft";

        document.getElementById(
            "announcementFormTitle"
        ).textContent = "Edit Announcement";

        announcementForm.classList.remove("hidden");

        announcementForm.scrollIntoView({
            behavior: "smooth"
        });

    }

    if (action === "delete-announcement") {

        if (!confirm("Delete this announcement permanently?")) {
            return;
        }

        const { error } = await db
            .from("announcements")
            .delete()
            .eq("id", id);

        if (error) {
            showMessage(error.message, true);
            return;
        }

        await recordActivity(
            "Deleted announcement",
            `Announcement ID: ${id}`
        );

        showMessage("Announcement deleted.");

        await loadAnnouncements();
        await loadDashboard();

    }

});


/* 19. UPDATE PLAN ELEMENTS */

const updateForm =
    document.getElementById("updateForm");

const updateEditor =
    document.getElementById("updateEditor");

const updateId =
    document.getElementById("updateId");

const updateTitle =
    document.getElementById("updateTitle");

const updateDescription =
    document.getElementById("updateDescription");

const updateDetails =
    document.getElementById("updateDetails");

const updateStatus =
    document.getElementById("updateStatus");

// Kept for compatibility with the existing HTML form.
// The current app_updates table has no target_date column,
// so this value is intentionally not sent to Supabase.
const updateDate =
    document.getElementById("updateDate");

const updatePublished =
    document.getElementById("updatePublished");


/* 20. CREATE UPDATE PLAN */

document.getElementById("newUpdateBtn")
    ?.addEventListener("click", () => {

        updateEditor?.reset();

        if (updateId) updateId.value = "";

        const formTitle =
            document.getElementById("updateFormTitle");

        if (formTitle) {
            formTitle.textContent = "Create Update Plan";
        }

        updateForm?.classList.remove("hidden");

        updateForm?.scrollIntoView({
            behavior: "smooth"
        });

    });


/* 21. CANCEL UPDATE PLAN */

document.getElementById("cancelUpdateBtn")
    ?.addEventListener("click", () => {

        updateForm?.classList.add("hidden");

        updateEditor?.reset();

        if (updateId) updateId.value = "";

    });/* 22. SAVE UPDATE PLAN */

updateEditor?.addEventListener("submit", async event => {

    event.preventDefault();

    if (!currentAdmin) {
        showMessage("Please sign in as an administrator.", true);
        return;
    }

    const id = updateId?.value || "";
    const isPublished = updatePublished?.checked === true;
    const now = new Date().toISOString();

    if (!updateTitle?.value.trim() || !updateDescription?.value.trim()) {
        showMessage(
            "Please complete the required fields.",
            true
        );
        return;
    }

    const saveButton =
        document.getElementById("saveUpdateBtn");

    if (saveButton) {
        saveButton.disabled = true;
        saveButton.textContent = "Saving...";
    }

    try {

        // Preserve the original publication date when editing
        // an update plan that is already published.
        let previousPublishedAt = null;

        if (id) {
            const { data: existingUpdate, error: fetchError } = await db
                .from("app_updates")
                .select("published_at")
                .eq("id", id)
                .single();

            if (fetchError) throw fetchError;

            previousPublishedAt = existingUpdate?.published_at || null;
        }

        // These field names match the actual app_updates table.
        const update = {
            title: updateTitle.value.trim(),
            description: updateDescription.value.trim(),
            content: updateDetails?.value.trim() || "",
            update_status: updateStatus?.value || "planned",
            status: isPublished ? "published" : "draft",
            published_by: currentAdmin.id,
            author_name: "Karan BC",
            published_at: isPublished
                ? (previousPublishedAt || now)
                : null,
            updated_at: now
        };

        let result;

        if (id) {
            result = await db
                .from("app_updates")
                .update(update)
                .eq("id", id);
        } else {
            result = await db
                .from("app_updates")
                .insert({
                    ...update,
                    created_at: now
                });
        }

        if (result.error) throw result.error;

        await recordActivity(
            id ? "Updated update plan" : "Created update plan",
            update.title
        );

        updateForm?.classList.add("hidden");
        updateEditor?.reset();

        if (updateId) updateId.value = "";

        showMessage(
            isPublished
                ? "Update plan saved and published successfully!"
                : "Update plan saved as a draft successfully!"
        );

        await loadUpdates();
        await loadDashboard();

    } catch (error) {

        console.error("READ-X update plan save error:", error);

        showMessage(
            error.message || "Could not save update plan.",
            true
        );

    } finally {

        if (saveButton) {
            saveButton.disabled = false;
            saveButton.textContent = "Save Update Plan";
        }

    }

});


/* 23. LOAD UPDATE PLANS */

async function loadUpdates() {

    if (!currentAdmin || !updateList) return;

    updateList.innerHTML =
        "<p>Loading update plans...</p>";

    const { data, error } = await db
        .from("app_updates")
        .select("*")
        .order("created_at", {
            ascending: false
        });

    if (error) {

        console.error("READ-X update plan loading error:", error);

        showEmpty(
            updateList,
            "Could not load update plans",
            error.message
        );

        return;

    }

    if (!data || data.length === 0) {

        showEmpty(
            updateList,
            "No update plans yet",
            "Create your first READ-X update plan."
        );

        return;

    }

    updateList.innerHTML = data.map(item => {

        const planStatus = item.update_status || "planned";
        const publishStatus = item.status || "draft";
        const author = item.author_name || "Karan BC";
        const dateToShow = item.published_at || item.created_at;

        return `
            <article class="data-card">

                <div class="data-card-main">

                    <span class="status ${escapeHTML(planStatus)}">
                        ${escapeHTML(planStatus)}
                    </span>

                    <h3>${escapeHTML(item.title || "Untitled update")}</h3>

                    <p>${escapeHTML(item.description || "")}</p>

                    <div class="data-meta">

                        <span>
                            By ${escapeHTML(author)}
                        </span>

                        <span>
                            ${publishStatus === "published" ? "Published" : "Last updated"}:
                            ${formatDate(dateToShow)}
                        </span>

                        <span>
                            ${publishStatus === "published" ? "Public" : "Draft"}
                        </span>

                    </div>

                </div>

                <div class="data-actions">

                    <button
                        class="secondary-btn"
                        data-action="edit-update"
                        data-id="${escapeHTML(item.id)}">
                        Edit
                    </button>

                    <button
                        class="danger-btn"
                        data-action="delete-update"
                        data-id="${escapeHTML(item.id)}">
                        Delete
                    </button>

                </div>

            </article>
        `;
    }).join("");

}/* 24. UPDATE PLAN EDIT AND DELETE */

updateList?.addEventListener("click", async event => {

    const button = event.target.closest("button[data-action]");

    if (!button || !currentAdmin) return;

    const id = button.dataset.id;
    const action = button.dataset.action;

    if (action === "edit-update") {

        const { data, error } = await db
            .from("app_updates")
            .select("*")
            .eq("id", id)
            .single();

        if (error) {
            showMessage(error.message, true);
            return;
        }

        if (updateId) updateId.value = data.id;
        if (updateTitle) updateTitle.value = data.title || "";
        if (updateDescription) updateDescription.value = data.description || "";
        if (updateDetails) updateDetails.value = data.content || "";
        if (updateStatus) updateStatus.value = data.update_status || "planned";

        // target_date is not a column in the current database.
        if (updateDate) updateDate.value = "";

        if (updatePublished) {
            updatePublished.checked = data.status === "published";
        }

        const formTitle =
            document.getElementById("updateFormTitle");

        if (formTitle) {
            formTitle.textContent = "Edit Update Plan";
        }

        updateForm?.classList.remove("hidden");

        updateForm?.scrollIntoView({
            behavior: "smooth"
        });

        return;
    }

    if (action === "delete-update") {

        if (!confirm("Delete this update plan permanently?")) {
            return;
        }

        const { error } = await db
            .from("app_updates")
            .delete()
            .eq("id", id);

        if (error) {
            showMessage(error.message, true);
            return;
        }

        await recordActivity(
            "Deleted update plan",
            `Update ID: ${id}`
        );

        showMessage("Update plan deleted.");

        await loadUpdates();
        await loadDashboard();

    }

});


/* 25. ADMIN ACTIVITY HISTORY */

async function loadActivity() {

    if (!currentAdmin || !activityList) return;

    activityList.innerHTML =
        "<p>Loading admin activity...</p>";

    const { data, error } = await db
        .from("admin_activity")
        .select("*")
        .order("created_at", {
            ascending: false
        })
        .limit(100);

    if (error) {

        console.error(error);

        showEmpty(
            activityList,
            "Could not load activity",
            error.message
        );

        return;

    }

    if (!data || data.length === 0) {

        showEmpty(
            activityList,
            "No activity recorded yet",
            "Your admin actions will appear here."
        );

        return;

    }

    activityList.innerHTML = data.map(item => `

        <article class="data-card activity-card">

            <div class="activity-icon">📋</div>

            <div class="data-card-main">

                <h3>${escapeHTML(item.action)}</h3>

                <p>
                    ${escapeHTML(
                        item.details || "No additional details"
                    )}
                </p>

                <div class="data-meta">

                    <span>
                        Admin ID: ${escapeHTML(item.admin_id)}
                    </span>

                    <span>${formatDate(item.created_at)}</span>

                </div>

            </div>

        </article>

    `).join("");

}


/* 26. START ADMIN DASHBOARD */

async function initializeAdminDashboard() {

    console.log("READ-X: Admin dashboard starting...");

    if (!db) {

        showDenied(
            "Supabase connection is missing. Check your supabase.js file."
        );

        return;

    }

    await checkAdminAccess();

}


// Start after the HTML has loaded.

if (document.readyState === "loading") {

    document.addEventListener(
        "DOMContentLoaded",
        initializeAdminDashboard
    );

} else {

    initializeAdminDashboard();

}
