
/* ==========================================
   READ-X | HOME PAGE
   Announcements and App Updates
========================================== */


/* ==========================================
   1. PAGE ELEMENTS
========================================== */

let db;

let announcementList;
let updateList;


/* ==========================================
   2. INITIALIZE HOME PAGE
========================================== */

function initializeHomePage() {

    // Get Supabase after the page is ready
    db = window.readxSupabase;

    announcementList = document.getElementById("announcementList");
    updateList = document.getElementById("updateList");

    // Check Supabase connection
    if (!db) {
        console.error("READ-X: Supabase connection not initialized.");

        if (announcementList) {
            announcementList.textContent =
                "Unable to connect. Please refresh the page.";
        }

        if (updateList) {
            updateList.textContent =
                "Unable to connect. Please refresh the page.";
        }

        return;
    }

    // Load both sections independently
    loadAnnouncements();
    loadAppUpdates();
}


/* ==========================================
   3. LOAD ANNOUNCEMENTS
========================================== */

async function loadAnnouncements() {

    if (!announcementList) {
        console.error("READ-X: announcementList element not found.");
        return;
    }

    announcementList.innerHTML = "<p>Loading announcements...</p>";

    try {

        const { data, error } = await db
            .from("announcements")
            .select("*")
            .eq("status", "published")
            .order("created_at", { ascending: false });

        if (error) {
            throw error;
        }

        if (!data || data.length === 0) {
            announcementList.innerHTML =
                "<p>No announcements available right now.</p>";
            return;
        }

        announcementList.innerHTML = "";

        data.forEach(item => {

            const card = document.createElement("article");
            card.className = "announcement-card";

            const title = document.createElement("h3");
            title.textContent = item.title || "Untitled announcement";

            const description = document.createElement("p");
            description.textContent = item.description || "";

            const publisher = document.createElement("small");
            publisher.textContent =
                `Published by ${item.published_by || "READ-X Team"}`;

            const button = document.createElement("button");
            button.type = "button";
            button.textContent = "Read announcement";

            button.addEventListener("click", () => {
                showDetails(item, "announcement");
            });

            card.append(
                title,
                description,
                publisher,
                button
            );

            announcementList.appendChild(card);
        });

    } catch (error) {

        console.error("READ-X Announcement Error:", error);

        announcementList.innerHTML =
            "<p>Announcements could not be loaded. Please try again later.</p>";
    }
}


/* ==========================================
   4. LOAD APP UPDATES
========================================== */

async function loadAppUpdates() {

    if (!updateList) {
        console.error("READ-X: updateList element not found.");
        return;
    }

    updateList.innerHTML = "<p>Loading latest updates...</p>";

    try {

        const { data, error } = await db
            .from("app_updates")
            .select("*")
            .eq("status", "published")
            .order("created_at", { ascending: false });

        if (error) {
            throw error;
        }

        if (!data || data.length === 0) {
            updateList.innerHTML =
                "<p>No new app updates available.</p>";
            return;
        }

        updateList.innerHTML = "";

        data.forEach(item => {

            const card = document.createElement("article");
            card.className = "update-card";

            const title = document.createElement("h3");
            title.textContent = item.title || "Untitled update";

            const description = document.createElement("p");
            description.textContent = item.description || "";

            const status = document.createElement("span");
            status.className = "update-status";
            status.textContent = item.update_status || "Update";

            const publisher = document.createElement("small");
            publisher.textContent =
                `Published by ${item.author_name || "READ-X Team"}`;

            const button = document.createElement("button");
            button.type = "button";
            button.textContent = "View update";

            button.addEventListener("click", () => {
                showDetails(item, "update");
            });

            card.append(
                title,
                description,
                status,
                publisher,
                button
            );

            updateList.appendChild(card);
        });

    } catch (error) {

        console.error("READ-X App Update Error:", error);

        updateList.innerHTML =
            "<p>Updates could not be loaded. Please try again later.</p>";
    }
}


/* ==========================================
   5. SHOW FULL DETAILS
========================================== */

function showDetails(item, type) {

    const overlay = document.createElement("div");
    overlay.className = "readx-details-overlay";

    const modal = document.createElement("div");
    modal.className = "readx-details-modal";

    const heading = document.createElement("h2");
    heading.textContent = item.title || "Details";

    const description = document.createElement("p");
    description.textContent = item.description || "";

    const content = document.createElement("div");
    content.className = "details-content";

    content.textContent =
        item.content || item.description || "No additional details available.";

    const publisher = document.createElement("p");
    publisher.className = "details-publisher";

    const publisherName =
        type === "update"
            ? item.author_name || "READ-X Team"
            : item.published_by || "READ-X Team";

    publisher.textContent = `Published by ${publisherName}`;

    const date = document.createElement("small");

    const publishedDate = item.published_at || item.created_at;

    if (publishedDate) {
        date.textContent =
            new Date(publishedDate).toLocaleDateString();
    }

    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.textContent = "Close";

    closeButton.addEventListener("click", () => {
        overlay.remove();
    });

    modal.append(
        heading,
        description,
        content,
        publisher,
        date,
        closeButton
    );

    overlay.appendChild(modal);

    overlay.addEventListener("click", event => {
        if (event.target === overlay) {
            overlay.remove();
        }
    });

    document.body.appendChild(overlay);
}


/* ==========================================
   6. START HOME PAGE
========================================== */

if (document.readyState === "loading") {

    document.addEventListener(
        "DOMContentLoaded",
        initializeHomePage,
        { once: true }
    );

} else {

    initializeHomePage();

}
