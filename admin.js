
/* ==========================================
   READ-X | ADMIN DASHBOARD
   Authentication & Admin Verification
   Accounts, Announcements, Updates & Activity
========================================== */


/* ==========================================
   1. SUPABASE CONNECTION
========================================== */

const db = window.readxSupabase;


/* ==========================================
   2. PAGE ELEMENTS
========================================== */

const adminLoading = document.getElementById("adminLoading");
const accessDenied = document.getElementById("accessDenied");
const adminDashboard = document.getElementById("adminDashboard");

const adminEmail = document.getElementById("adminEmail");
const pageTitle = document.getElementById("pageTitle");
const adminMessage = document.getElementById("adminMessage");

const sections = {

    overview: document.getElementById("overviewSection"),
    accounts: document.getElementById("accountsSection"),
    announcements: document.getElementById("announcementsSection"),
    updates: document.getElementById("updatesSection"),
    activity: document.getElementById("activitySection")

};

const announcementList = document.getElementById("announcementList");
const updateList = document.getElementById("updateList");
const activityList = document.getElementById("activityList");


/* ==========================================
   3. GLOBAL VARIABLES
========================================== */

let currentAdmin = null;
let messageTimer = null;
let verificationInProgress = false;
let authSubscription = null;
let verificationNumber = 0;

let allAccounts = [];


/* ==========================================
   4. BASIC HELPERS
========================================== */

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


function formatDateTime(value) {

    if (!value) return "Not available";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Not available";
    }

    return date.toLocaleString();

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


function showDenied(
    message = "This page is only available to authorized READ-X administrators."
) {

    currentAdmin = null;

    adminLoading?.classList.add("hidden");

    adminDashboard?.classList.add("hidden");

    accessDenied?.classList.remove("hidden");

    const description = accessDenied?.querySelector("p");

    if (description) {
        description.textContent = message;
    }

}


/* ==========================================
   5. PAGE NAVIGATION
========================================== */

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
        accounts: "Account Management",
        announcements: "Announcements",
        updates: "Update Plans",
        activity: "Admin Activity"

    };

    if (pageTitle) {
        pageTitle.textContent = titles[sectionName];
    }

    if (sectionName === "accounts") {
        loadAccounts();
    }

    if (sectionName === "announcements") {
        loadAnnouncements();
    }

    if (sectionName === "updates") {
        loadUpdates();
    }

    if (sectionName === "activity") {
        loadActivity();
    }

}


document.querySelectorAll("[data-section]").forEach(button => {

    button.addEventListener("click", () => {

        openSection(button.dataset.section);

    });

});


/* ==========================================
   6. LOGIN REDIRECTION
========================================== */

function redirectToLogin() {

    window.location.replace(
        "./login.html?mode=login&returnTo=admin.html"
    );

}


/* ==========================================
   7. ADMIN VERIFICATION
========================================== */

async function checkAdminAccess() {

    if (verificationInProgress) return;

    verificationInProgress = true;

    const thisVerification = ++verificationNumber;

    try {

        if (!db || !db.auth) {

            throw new Error(
                "Supabase connection not found. Check your supabase.js file."
            );

        }

        setLoading();

        console.log("READ-X: Checking login session...");


        // STEP 1: Get current session.

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


        // STEP 2: Save current user.

        currentAdmin = session.user;

        console.log(
            "READ-X: Logged in account:",
            currentAdmin.email,
            currentAdmin.id
        );


        // STEP 3: Verify admin permission.

        console.log("READ-X: Checking administrator permission...");

        const {

            data: isAdmin,
            error: adminError

        } = await db.rpc("is_readx_admin");

        if (adminError) {

            console.error("READ-X ADMIN RPC ERROR:", adminError);

            throw new Error(
                "Admin verification failed: " + adminError.message
            );

        }


        // STEP 4: Reject unauthorized accounts.

        if (isAdmin !== true) {

            console.warn(
                "READ-X: Administrator permission denied."
            );

            showDenied(
                "Your account is logged in, but it is not registered as a READ-X administrator."
            );

            return;

        }


        // STEP 5: Display dashboard.

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

        console.error("READ-X ADMIN ACCESS ERROR:", error);

        showDenied(
            error.message ||
            "Could not verify administrator access."
        );

    } finally {

        if (thisVerification === verificationNumber) {
            verificationInProgress = false;
        }

    }

}


/* ==========================================
   8. ACCESS DENIED LOGIN BUTTON
========================================== */

document.getElementById("deniedLoginBtn")
    ?.addEventListener("click", redirectToLogin);


/* ==========================================
   9. LOGOUT
========================================== */

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


/* ==========================================
   10. AUTHENTICATION CHANGES
========================================== */

if (db?.auth) {

    const { data } = db.auth.onAuthStateChange(event => {

        console.log(
            "READ-X authentication event:",
            event
        );

        if (
            event === "SIGNED_IN" ||
            event === "TOKEN_REFRESHED"
        ) {

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


/* ==========================================
   11. ADMIN ACTIVITY LOGGER
========================================== */

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


/* ==========================================
   12. DASHBOARD OVERVIEW
========================================== */

async function loadDashboard() {

    if (!currentAdmin) return;

    const [

        announcements,
        updates,
        activities

    ] = await Promise.all([

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

        console.error(
            "Dashboard loading errors:",
            errors
        );

        showMessage(
            "Some dashboard statistics could not load.",
            true
        );

    }


    // Load account statistics too.

    await loadAccounts({
        silent: true
    });

}


/* ==========================================
   13. ACCOUNT MANAGEMENT
========================================== */


/* ACCOUNT ELEMENTS */

const accountsTableBody =
    document.getElementById("accountsTableBody");

const accountSearch =
    document.getElementById("accountSearch");

const accountProviderFilter =
    document.getElementById("accountProviderFilter");

const accountResultsCount =
    document.getElementById("accountResultsCount");

const accountDetailsModal =
    document.getElementById("accountDetailsModal");


/* LOAD ACCOUNTS */

async function loadAccounts(options = {}) {

    if (!currentAdmin || !db) return;

    if (!accountsTableBody) return;

    const silent = options.silent === true;

    if (!silent) {

        accountsTableBody.innerHTML = `

            <tr>

                <td colspan="6" class="empty-table">
                    Loading registered accounts...
                </td>

            </tr>

        `;

    }

    try {

        // Call the secure Supabase Edge Function.

        const {

            data,
            error

        } = await db.functions.invoke(
            "admin-list-users"
        );

        if (error) throw error;

        if (!data || !Array.isArray(data.users)) {

            throw new Error(
                "Invalid account information received."
            );

        }

        allAccounts = data.users;

        updateAccountStatistics();

        filterAccounts();

        console.log(
            "READ-X: Accounts loaded:",
            allAccounts.length
        );

    } catch (error) {

        console.error(
            "READ-X account loading error:",
            error
        );

        if (!silent) {

            accountsTableBody.innerHTML = `

                <tr>

                    <td colspan="6" class="empty-table">
                        Could not load accounts. Check your Edge Function.
                    </td>

                </tr>

            `;

            showMessage(
                error.message || "Unable to load accounts.",
                true
            );

        }

    }

}


/* ACCOUNT STATISTICS */

function updateAccountStatistics() {

    const total = allAccounts.length;

    const emailCount = allAccounts.filter(user =>
        user.provider === "email"
    ).length;

    const phoneCount = allAccounts.filter(user =>
        user.provider === "phone"
    ).length;

    const facebookCount = allAccounts.filter(user =>
        user.provider === "facebook"
    ).length;


    const statistics = {

        accountCount: total,
        totalUsersCount: total,
        emailUsersCount: emailCount,
        phoneUsersCount: phoneCount,
        facebookUsersCount: facebookCount

    };


    Object.entries(statistics).forEach(([id, value]) => {

        const element = document.getElementById(id);

        if (element) {

            element.textContent = value;

        }

    });

}


/* FILTER ACCOUNTS */

function filterAccounts() {

    const searchValue =
        accountSearch?.value.trim().toLowerCase() || "";

    const providerValue =
        accountProviderFilter?.value || "all";


    const filteredUsers = allAccounts.filter(user => {

        const searchableValues = [

            user.id,
            user.email,
            user.phone,
            user.provider

        ];

        const matchesSearch = searchableValues.some(value => {

            return String(value || "")
                .toLowerCase()
                .includes(searchValue);

        });


        const matchesProvider =
            providerValue === "all" ||
            user.provider === providerValue;


        return matchesSearch && matchesProvider;

    });


    renderAccounts(filteredUsers);

}


/* SEARCH EVENTS */

accountSearch?.addEventListener(
    "input",
    filterAccounts
);

accountProviderFilter?.addEventListener(
    "change",
    filterAccounts
);


/* DISPLAY ACCOUNT TABLE */

function renderAccounts(users) {

    if (!accountsTableBody) return;

    if (accountResultsCount) {

        accountResultsCount.textContent =
            `${users.length} account${users.length === 1 ? "" : "s"}`;

    }


    const emptyState =
        document.getElementById("accountsEmptyState");


    if (!users.length) {

        accountsTableBody.innerHTML = "";

        emptyState?.classList.remove("hidden");

        return;

    }


    emptyState?.classList.add("hidden");


    accountsTableBody.innerHTML = users.map(user => `

        <tr>

            <td>
                <strong>${escapeHTML(user.id)}</strong>
            </td>

            <td>
                ${escapeHTML(user.email || "Not provided")}
            </td>

            <td>
                ${escapeHTML(user.phone || "Not provided")}
            </td>

            <td>
                <span class="status">
                    ${escapeHTML(user.provider || "Unknown")}
                </span>
            </td>

            <td>
                ${escapeHTML(formatDate(user.created_at))}
            </td>

            <td>

                <button
                    class="secondary-btn"
                    data-action="view-account"
                    data-id="${escapeHTML(user.id)}">

                    View Details

                </button>

            </td>

        </tr>

    `).join("");

}


/* REFRESH ACCOUNTS */

document.getElementById("refreshAccountsBtn")
    ?.addEventListener("click", async () => {

        const button =
            document.getElementById("refreshAccountsBtn");

        if (button) {

            button.disabled = true;

            button.textContent = "Refreshing...";

        }

        await loadAccounts();

        if (button) {

            button.disabled = false;

            button.textContent = "↻ Refresh Accounts";

        }

        showMessage("Account list refreshed.");

    });


/* OPEN ACCOUNT DETAILS */

accountsTableBody?.addEventListener("click", event => {

    const button = event.target.closest(
        'button[data-action="view-account"]'
    );

    if (!button) return;

    const user = allAccounts.find(account =>
        account.id === button.dataset.id
    );

    if (!user) {

        showMessage("Account not found.", true);

        return;

    }


    const details = {

        detailUserId: user.id,

        detailEmail:
            user.email || "Not provided",

        detailPhone:
            user.phone || "Not provided",

        detailProvider:
            user.provider || "Unknown",

        detailCreatedAt:
            formatDateTime(user.created_at),

        detailLastSignIn:
            formatDateTime(user.last_sign_in_at),

        detailStatus:
            user.status || "Unknown"

    };


    Object.entries(details).forEach(([id, value]) => {

        const element = document.getElementById(id);

        if (element) {

            element.textContent = value;

        }

    });


    accountDetailsModal?.classList.remove("hidden");

});


/* CLOSE ACCOUNT DETAILS */

function closeAccountDetails() {

    accountDetailsModal?.classList.add("hidden");

}


document.getElementById("closeAccountModal")
    ?.addEventListener("click", closeAccountDetails);


document.getElementById("closeAccountDetailsBtn")
    ?.addEventListener("click", closeAccountDetails);


accountDetailsModal?.addEventListener("click", event => {

    if (event.target === accountDetailsModal) {

        closeAccountDetails();

    }

});


/* COPY ACCOUNT INFORMATION */

document.querySelectorAll(".copy-account-btn")
    .forEach(button => {

        button.addEventListener("click", async () => {

            const targetId = button.dataset.copy;

            const element =
                document.getElementById(targetId);

            const value =
                element?.textContent?.trim();


            if (!value || value === "—") {

                showMessage(
                    "No information available to copy.",
                    true
                );

                return;

            }


            try {

                await navigator.clipboard.writeText(value);

                showMessage(
                    "Account information copied."
                );

            } catch (error) {

                console.error("Copy error:", error);

                showMessage(
                    "Unable to copy information.",
                    true
                );

            }

        });

    });


/* ==========================================
   14. ANNOUNCEMENT ELEMENTS
========================================== */

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


/* ==========================================
   15. CREATE ANNOUNCEMENT
========================================== */

document.getElementById("newAnnouncementBtn")
    ?.addEventListener("click", () => {

        announcementEditor?.reset();

        if (announcementId) {
            announcementId.value = "";
        }

        const formTitle =
            document.getElementById("announcementFormTitle");

        if (formTitle) {

            formTitle.textContent =
                "Create Announcement";

        }

        announcementForm?.classList.remove("hidden");

        announcementForm?.scrollIntoView({
            behavior: "smooth"
        });

    });


/* ==========================================
   16. CANCEL ANNOUNCEMENT
========================================== */

document.getElementById("cancelAnnouncementBtn")
    ?.addEventListener("click", () => {

        announcementForm?.classList.add("hidden");

        announcementEditor?.reset();

    });


/* ==========================================
   17. SAVE ANNOUNCEMENT
========================================== */

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

        status:
            announcementStatus?.value || "draft",

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

            id
                ? "Updated announcement"
                : "Created announcement",

            announcement.title

        );


        announcementForm?.classList.add("hidden");

        announcementEditor?.reset();

        showMessage(
            "Announcement saved successfully!"
        );

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


/* ==========================================
   18. LOAD ANNOUNCEMENTS
========================================== */

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

                    <span>
                        ${formatDate(item.created_at)}
                    </span>

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


/* ==========================================
   19. ANNOUNCEMENT EDIT AND DELETE
========================================== */

announcementList?.addEventListener("click", async event => {

    const button =
        event.target.closest("button[data-action]");

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

        announcementDescription.value =
            data.description || "";

        announcementContent.value =
            data.content || "";

        announcementStatus.value =
            data.status || "draft";


        document.getElementById(
            "announcementFormTitle"
        ).textContent = "Edit Announcement";


        announcementForm.classList.remove("hidden");

        announcementForm.scrollIntoView({
            behavior: "smooth"
        });

    }


    if (action === "delete-announcement") {

        if (!confirm(
            "Delete this announcement permanently?"
        )) {
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


/* ==========================================
   20. UPDATE PLAN ELEMENTS
========================================== */

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

const updateDate =
    document.getElementById("updateDate");

const updatePublished =
    document.getElementById("updatePublished");


/* ==========================================
   21. CREATE UPDATE PLAN
========================================== */

document.getElementById("newUpdateBtn")
    ?.addEventListener("click", () => {

        updateEditor?.reset();

        if (updateId) {
            updateId.value = "";
        }

        const formTitle =
            document.getElementById("updateFormTitle");

        if (formTitle) {

            formTitle.textContent =
                "Create Update Plan";

        }

        updateForm?.classList.remove("hidden");

        updateForm?.scrollIntoView({
            behavior: "smooth"
        });

    });


/* ==========================================
   22. CANCEL UPDATE PLAN
========================================== */

document.getElementById("cancelUpdateBtn")
    ?.addEventListener("click", () => {

        updateForm?.classList.add("hidden");

        updateEditor?.reset();

        if (updateId) {
            updateId.value = "";
        }

    });


/* ==========================================
   23. SAVE UPDATE PLAN
========================================== */

updateEditor?.addEventListener("submit", async event => {

    event.preventDefault();

    if (!currentAdmin) {

        showMessage(
            "Please sign in as an administrator.",
            true
        );

        return;

    }


    const id = updateId?.value || "";

    const isPublished =
        updatePublished?.checked === true;

    const now = new Date().toISOString();


    if (
        !updateTitle?.value.trim() ||
        !updateDescription?.value.trim()
    ) {

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

        let previousPublishedAt = null;


        if (id) {

            const {

                data: existingUpdate,
                error: fetchError

            } = await db
                .from("app_updates")
                .select("published_at")
                .eq("id", id)
                .single();


            if (fetchError) throw fetchError;

            previousPublishedAt =
                existingUpdate?.published_at || null;

        }


        const update = {

            title: updateTitle.value.trim(),

            description:
                updateDescription.value.trim(),

            content:
                updateDetails?.value.trim() || "",

            update_status:
                updateStatus?.value || "planned",

            status:
                isPublished ? "published" : "draft",

            published_by:
                currentAdmin.id,

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

            id
                ? "Updated update plan"
                : "Created update plan",

            update.title

        );


        updateForm?.classList.add("hidden");

        updateEditor?.reset();

        if (updateId) {
            updateId.value = "";
        }


        showMessage(
            isPublished
                ? "Update plan saved and published successfully!"
                : "Update plan saved as a draft successfully!"
        );


        await loadUpdates();

        await loadDashboard();


    } catch (error) {

        console.error(
            "READ-X update plan save error:",
            error
        );

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


/* ==========================================
   24. LOAD UPDATE PLANS
========================================== */

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

        console.error(
            "READ-X update plan loading error:",
            error
        );

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

        const planStatus =
            item.update_status || "planned";

        const publishStatus =
            item.status || "draft";

        const author =
            item.author_name || "Karan BC";

        const dateToShow =
            item.published_at || item.created_at;


        return `

            <article class="data-card">

                <div class="data-card-main">

                    <span class="status ${escapeHTML(planStatus)}">
                        ${escapeHTML(planStatus)}
                    </span>

                    <h3>
                        ${escapeHTML(item.title || "Untitled update")}
                    </h3>

                    <p>
                        ${escapeHTML(item.description || "")}
                    </p>

                    <div class="data-meta">

                        <span>
                            By ${escapeHTML(author)}
                        </span>

                        <span>
                            ${publishStatus === "published"
                                ? "Published"
                                : "Last updated"}:
                            ${formatDate(dateToShow)}
                        </span>

                        <span>
                            ${publishStatus === "published"
                                ? "Public"
                                : "Draft"}
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

}


/* ==========================================
   25. UPDATE PLAN EDIT AND DELETE
========================================== */

updateList?.addEventListener("click", async event => {

    const button =
        event.target.closest("button[data-action]");

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


        if (updateId) {
            updateId.value = data.id;
        }

        if (updateTitle) {
            updateTitle.value = data.title || "";
        }

        if (updateDescription) {
            updateDescription.value = data.description || "";
        }

        if (updateDetails) {
            updateDetails.value = data.content || "";
        }

        if (updateStatus) {
            updateStatus.value =
                data.update_status || "planned";
        }

        if (updateDate) {
            updateDate.value = "";
        }

        if (updatePublished) {

            updatePublished.checked =
                data.status === "published";

        }


        const formTitle =
            document.getElementById("updateFormTitle");

        if (formTitle) {

            formTitle.textContent =
                "Edit Update Plan";

        }


        updateForm?.classList.remove("hidden");

        updateForm?.scrollIntoView({
            behavior: "smooth"
        });

        return;

    }


    if (action === "delete-update") {

        if (!confirm(
            "Delete this update plan permanently?"
        )) {
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


/* ==========================================
   26. ADMIN ACTIVITY HISTORY
========================================== */

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

                    <span>
                        ${formatDate(item.created_at)}
                    </span>

                </div>

            </div>

        </article>

    `).join("");

}


/* ==========================================
   27. START ADMIN DASHBOARD
========================================== */

async function initializeAdminDashboard() {

    console.log(
        "READ-X: Admin dashboard starting..."
    );

    if (!db || !db.auth) {

        showDenied(
            "Supabase connection is missing. Check your supabase.js file."
        );

        return;

    }

    await checkAdminAccess();

}


/* ==========================================
   28. INITIALIZATION
========================================== */

if (document.readyState === "loading") {

    document.addEventListener(
        "DOMContentLoaded",
        initializeAdminDashboard
    );

} else {

    initializeAdminDashboard();

}


console.log(
    "READ-X Admin Dashboard JavaScript loaded."
);
