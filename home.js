
/* ==========================================
   READ-X | HOME PAGE
   Announcements and App Updates
   Official Publisher: Team X
========================================== */


/* ==========================================
   1. SUPABASE CONNECTION
========================================== */

const db = window.readxSupabase;

const OFFICIAL_PUBLISHER = "Team X";


/* ==========================================
   2. PAGE ELEMENTS
========================================== */

const announcementList = document.getElementById("announcementList");
const updateList = document.getElementById("updateList");


/* ==========================================
   3. LOAD ANNOUNCEMENTS
========================================== */

async function loadAnnouncements() {

    if (!db || !announcementList) {
        console.error("READ-X: Supabase or announcement section missing.");
        return;
    }

    announcementList.innerHTML = "<p>Loading announcements...</p>";

    const { data, error } = await db
        .from("announcements")
        .select("*")
        .eq("status", "published")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Announcement loading error:", error);
        announcementList.innerHTML =
            "<p>Announcements could not be loaded. Please try again later.</p>";
        return;
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
        title.textContent = item.title;

        const description = document.createElement("p");
        description.textContent = item.description || "";

        const publisher = document.createElement("small");
        publisher.textContent = `Published by ${OFFICIAL_PUBLISHER}`;

        const button = document.createElement("button");
        button.type = "button";
        button.textContent = "Read announcement";
        button.addEventListener("click", () => {
            showDetails(item, "announcement");
        });

        card.append(title, description, publisher, button);
        announcementList.appendChild(card);
    });
}


/* ==========================================
   4. LOAD APP UPDATES
========================================== */

async function loadAppUpdates() {

    if (!db || !updateList) {
        console.error("READ-X: Supabase or update section missing.");
        return;
    }

    updateList.innerHTML = "<p>Loading latest updates...</p>";

    const { data, error } = await db
        .from("app_updates")
        .select("*")
        .eq("status", "published")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("App update loading error:", error);
        updateList.innerHTML =
            "<p>Updates could not be loaded. Please try again later.</p>";
        return;
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
        title.textContent = item.title;

        const description = document.createElement("p");
        description.textContent = item.description || "";

        const status = document.createElement("span");
        status.className = "update-status";
        status.textContent = item.update_status || "Update";

        const publisher = document.createElement("small");
        publisher.textContent = `Published by ${OFFICIAL_PUBLISHER}`;

        const button = document.createElement("button");
        button.type = "button";
        button.textContent = "View update";
        button.addEventListener("click", () => {
            showDetails(item, "update");
        });

        card.append(title, description, status, publisher, button);
        updateList.appendChild(card);
    });
}


/* ==========================================
   5. SHOW FULL DETAILS
========================================== */

function showDetails(item, type) {

    // Create the details window
    const overlay = document.createElement("div");
    overlay.className = "readx-details-overlay";

    const modal = document.createElement("div");
    modal.className = "readx-details-modal";

    const heading = document.createElement("h2");
    heading.textContent = item.title;

    const description = document.createElement("p");
    description.textContent = item.description || "";

    const content = document.createElement("div");
    content.className = "details-content";
    content.textContent = item.content || item.details || item.description || "";

    const publisher = document.createElement("p");
    publisher.className = "details-publisher";
    publisher.textContent = `Officially published by ${OFFICIAL_PUBLISHER}`;

    const date = document.createElement("small");

    if (item.created_at) {
        date.textContent = new Date(item.created_at).toLocaleDateString();
    }

    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.textContent = "Close";
    closeButton.addEventListener("click", () => overlay.remove());

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
   6. LOAD HOME PAGE CONTENT
========================================== */

async function loadHomePage() {

    await Promise.all([
        loadAnnouncements(),
        loadAppUpdates()
    ]);

}


/* ==========================================
   7. START HOME PAGE
========================================== */

document.addEventListener("DOMContentLoaded", loadHomePage);
