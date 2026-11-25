
/* ==========================================
   READ-X | PUBLICATION SYSTEM
   Search, Categories, Reading and Saving
========================================== */


/* 1. SUPABASE CONNECTION */

const db = window.readxSupabase;


/* 2. PAGE ELEMENTS */

const searchInput = document.getElementById("searchInput");
const clearSearch = document.getElementById("clearSearch");

const categoryList = document.getElementById("categoryList");

const publicationList = document.getElementById("publicationList");
const publicationCount = document.getElementById("publicationCount");

const emptyState = document.getElementById("emptyState");
const emptyTitle = document.getElementById("emptyTitle");
const emptyDescription = document.getElementById("emptyDescription");
const resetFilters = document.getElementById("resetFilters");

const connectionMessage = document.getElementById("connectionMessage");

const articleReader = document.getElementById("articleReader");
const backToArticles = document.getElementById("backToArticles");

const readerCategory = document.getElementById("readerCategory");
const readerTitle = document.getElementById("readerTitle");
const readerAuthor = document.getElementById("readerAuthor");
const authorAvatar = document.getElementById("authorAvatar");
const readerImage = document.getElementById("readerImage");
const readerDescription = document.getElementById("readerDescription");
const readerArticleText = document.getElementById("readerArticleText");


/* 3. PAGE DATA */

let publications = [];

let selectedCategory = "All";
let searchTerm = "";

let currentUser = null;
let currentArticle = null;

let savedPublicationIds = new Set();

let loadingFailed = false;
let saveSystemAvailable = true;

let readerSaveButton = null;

const savingArticles = new Set();


/* 4. DEFAULT CATEGORIES */

const defaultCategories = [
    "All",
    "Technology",
    "Education",
    "Science",
    "Engineering",
    "Programming",
    "Innovation",
    "Environment",
    "Health",
    "Business",
    "Culture",
    "News",
    "General"
];


/* 5. CHECK REQUIRED PAGE ELEMENTS */

function checkPageElements() {

    const requiredElements = {
        searchInput,
        clearSearch,
        categoryList,
        publicationList,
        publicationCount,
        emptyState,
        emptyTitle,
        emptyDescription,
        resetFilters,
        connectionMessage,
        articleReader,
        backToArticles,
        readerCategory,
        readerTitle,
        readerAuthor,
        authorAvatar,
        readerImage,
        readerDescription,
        readerArticleText
    };

    const missing = Object.entries(requiredElements)
        .filter(([name, element]) => !element)
        .map(([name]) => name);

    if (missing.length > 0) {

        console.error(
            "READ-X: Missing HTML elements:",
            missing
        );

        return false;

    }

    return true;

}


/* 6. SHOW LOADING */

function showLoading() {

    publicationList.innerHTML = `
        <div class="loading-state">
            <div class="loader"></div>
            <p>Loading publications...</p>
        </div>
    `;

    emptyState.hidden = true;
    connectionMessage.hidden = true;

    publicationCount.textContent = "Loading...";

}


/* 7. SHOW ERROR */

function showError(message) {

    publicationList.innerHTML = "";

    emptyState.hidden = false;

    emptyTitle.textContent = "Unable to load publications";

    emptyDescription.textContent = message;

    resetFilters.hidden = true;

    publicationCount.textContent = "Error";

    connectionMessage.hidden = false;

    connectionMessage.textContent = message;

}


/* 8. LOAD CURRENT USER */

async function loadCurrentUser() {

    currentUser = null;

    if (!db) return;

    try {

        const { data, error } = await db.auth.getUser();

        if (error) throw error;

        currentUser = data.user || null;

    } catch (error) {

        console.error(
            "READ-X: User information could not be loaded:",
            error
        );

    }

}


/* 9. LOAD SAVED ARTICLE IDS */

async function loadSavedArticleIds() {

    savedPublicationIds.clear();

    saveSystemAvailable = true;

    if (!db || !currentUser) return;

    try {

        const { data, error } = await db
            .from("saved_articles")
            .select("publication_id")
            .eq("user_id", currentUser.id);

        if (error) throw error;

        (data || []).forEach(item => {

            savedPublicationIds.add(
                String(item.publication_id)
            );

        });

    } catch (error) {

        saveSystemAvailable = false;

        console.error(
            "READ-X: Could not load saved articles.",
            error
        );

    }

}


/* 10. LOAD PUBLICATIONS */

async function loadPublications() {

    if (!db) {

        showError(
            "Supabase connection is missing. Check your supabase.js file."
        );

        return;

    }

    showLoading();

    try {

        /*
           Load publications FIRST.

           Saving problems should never stop
           published articles from appearing.
        */

        const { data, error } = await db
            .from("publications")
            .select(`
                id,
                title,
                author_name,
                category,
                description,
                content,
                image_url,
                status,
                created_at
            `)
            .eq("status", "published")
            .order("created_at", { ascending: false });

        if (error) throw error;

        publications = data || [];

        loadingFailed = false;

        /*
           Load account and saved article information
           separately after publications are loaded.
        */

        await loadCurrentUser();

        await loadSavedArticleIds();

        createCategoryButtons();

        displayPublications();

        connectionMessage.hidden = true;

        console.log(
            `READ-X: ${publications.length} published articles loaded.`
        );

        /*
           Reopen an article after returning from login.
        */

        openArticleFromURL();

    } catch (error) {

        console.error(
            "READ-X: Publication loading failed:",
            error
        );

        loadingFailed = true;

        showError(
            "Unable to load articles: " + error.message
        );

    }

}


/* 11. CREATE CATEGORY BUTTONS */

function createCategoryButtons() {

    const databaseCategories = publications
        .map(article => article.category)
        .filter(category =>
            typeof category === "string" &&
            category.trim() !== ""
        );

    const uniqueCategories = [
        ...new Set([
            ...defaultCategories,
            ...databaseCategories.map(category => category.trim())
        ])
    ];

    categoryList.innerHTML = "";

    uniqueCategories.forEach(category => {

        const button = document.createElement("button");

        button.type = "button";

        button.className = "category-button";

        button.textContent = category;

        button.dataset.category = category;

        button.classList.toggle(
            "active",
            category === selectedCategory
        );

        button.addEventListener("click", () => {

            selectedCategory = category;

            updateCategoryButtons();

            displayPublications();

        });

        categoryList.appendChild(button);

    });

}


/* 12. UPDATE ACTIVE CATEGORY */

function updateCategoryButtons() {

    categoryList
        .querySelectorAll(".category-button")
        .forEach(button => {

            button.classList.toggle(
                "active",
                button.dataset.category === selectedCategory
            );

        });

}


/* 13. SEARCH ARTICLES */

searchInput.addEventListener("input", () => {

    searchTerm = searchInput.value.trim().toLowerCase();

    clearSearch.hidden = searchTerm.length === 0;

    displayPublications();

});


/* 14. CLEAR SEARCH */

clearSearch.addEventListener("click", () => {

    searchInput.value = "";

    searchTerm = "";

    clearSearch.hidden = true;

    displayPublications();

});


/* 15. FILTER PUBLICATIONS */

function getFilteredPublications() {

    return publications.filter(article => {

        const matchesCategory =
            selectedCategory === "All" ||
            article.category === selectedCategory;

        const searchableText = [
            article.title,
            article.author_name,
            article.category,
            article.description,
            article.content
        ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

        const matchesSearch =
            searchableText.includes(searchTerm);

        return matchesCategory && matchesSearch;

    });

}


/* 16. DISPLAY PUBLICATIONS */

function displayPublications() {

    if (loadingFailed) return;

    const filtered = getFilteredPublications();

    publicationList.innerHTML = "";

    publicationCount.textContent =
        `${filtered.length} ${filtered.length === 1 ? "article" : "articles"}`;

    emptyState.hidden = filtered.length !== 0;

    resetFilters.hidden = filtered.length !== 0;

    if (filtered.length === 0) {

        emptyTitle.textContent = "No publications found";

        emptyDescription.textContent =
            publications.length === 0
                ? "There are currently no published articles."
                : "Try another search or choose a different category.";

        return;

    }

    filtered.forEach(article => {

        publicationList.appendChild(
            createPublicationCard(article)
        );

    });

}


/* 17. IMAGE PLACEHOLDER */

function createImagePlaceholder() {

    const placeholder = document.createElement("div");

    placeholder.className = "publication-image-placeholder";

    placeholder.textContent = "READ-X";

    return placeholder;

}


/* 18. UPDATE SAVE BUTTON */

function updateSaveButton(button, article) {

    const isSaved = savedPublicationIds.has(
        String(article.id)
    );

    button.textContent = isSaved
        ? "♥ Saved"
        : "♡ Save";

    button.classList.toggle("saved", isSaved);

    button.setAttribute(
        "aria-pressed",
        String(isSaved)
    );

    button.disabled = savingArticles.has(
        String(article.id)
    );

}


/* 19. UPDATE ALL BUTTONS FOR ONE ARTICLE */

function updateArticleSaveButtons(article) {

    const articleId = String(article.id);

    document
        .querySelectorAll("[data-save-article]")
        .forEach(button => {

            if (button.dataset.saveArticle === articleId) {

                updateSaveButton(button, article);

            }

        });

}


/* 20. CREATE SAVE BUTTON */

function createSaveButton(article, readerMode = false) {

    const button = document.createElement("button");

    button.type = "button";

    button.className = readerMode
        ? "reader-save-button"
        : "publication-save-button";

    button.dataset.saveArticle = String(article.id);

    updateSaveButton(button, article);

    button.addEventListener("click", async event => {

        event.preventDefault();

        event.stopPropagation();

        await toggleSavedArticle(article);

    });

    return button;

}


/* 21. SAVE OR UNSAVE ARTICLE */

async function toggleSavedArticle(article) {

    const articleId = String(article.id);

    if (savingArticles.has(articleId)) return;

    if (!db) {

        alert("Database connection is unavailable.");

        return;

    }

    /*
       Check the user's login status.
    */

    try {

        const { data, error } = await db.auth.getUser();

        if (error) throw error;

        currentUser = data.user || null;

    } catch (error) {

        console.error("READ-X authentication error:", error);

        alert("Unable to check your account. Please try again.");

        return;

    }


    /*
       Login is required to save an article.
       Return the user to the same article after login.
    */

    if (!currentUser) {

        const destination = new URL(
            "./read.html",
            window.location.href
        );

        destination.searchParams.set("id", articleId);

        const loginURL = new URL(
            "./login.html",
            window.location.href
        );

        loginURL.searchParams.set("mode", "login");

        loginURL.searchParams.set(
            "returnTo",
            destination.href
        );

        window.location.assign(loginURL.href);

        return;

    }


    /*
       Prevent saving if the saved_articles
       database table is unavailable.
    */

    if (!saveSystemAvailable) {

        alert(
            "The saved articles system is not ready. Please check your saved_articles table and permissions."
        );

        return;

    }


    savingArticles.add(articleId);

    updateArticleSaveButtons(article);

    try {

        /*
           REMOVE SAVED ARTICLE
        */

        if (savedPublicationIds.has(articleId)) {

            const { error } = await db
                .from("saved_articles")
                .delete()
                .eq("user_id", currentUser.id)
                .eq("publication_id", article.id);

            if (error) throw error;

            savedPublicationIds.delete(articleId);

            console.log("READ-X: Article removed from saved articles.");

        }

        /*
           SAVE NEW ARTICLE
        */

        else {

            const { error } = await db
                .from("saved_articles")
                .insert({
                    user_id: currentUser.id,
                    publication_id: article.id
                });

            if (error) throw error;

            savedPublicationIds.add(articleId);

            console.log("READ-X: Article saved successfully.");

        }

    } catch (error) {

        console.error(
            "READ-X: Saving article failed:",
            error
        );

        alert(
            "Could not update saved articles: " + error.message
        );

    } finally {

        savingArticles.delete(articleId);

        updateArticleSaveButtons(article);

    }

}


/* 22. CREATE PUBLICATION CARD */

function createPublicationCard(article) {

    const card = document.createElement("article");

    card.className = "publication-card";

    card.setAttribute("tabindex", "0");

    card.setAttribute("aria-label", "Read " + article.title);


    /*
       ARTICLE IMAGE
    */

    if (article.image_url) {

        const image = document.createElement("img");

        image.className = "publication-image";

        image.src = article.image_url;

        image.alt = article.title || "Publication image";

        image.loading = "lazy";

        image.onerror = () => {

            image.replaceWith(createImagePlaceholder());

        };

        card.appendChild(image);

    } else {

        card.appendChild(createImagePlaceholder());

    }


    /*
       ARTICLE INFORMATION
    */

    const information = document.createElement("div");

    information.className = "publication-info";


    const category = document.createElement("span");

    category.className = "publication-category";

    category.textContent = article.category || "General";


    const title = document.createElement("h2");

    title.className = "publication-title";

    title.textContent = article.title || "Untitled publication";


    const author = document.createElement("p");

    author.className = "publication-author";

    author.textContent =
        "By " + (article.author_name || "READ-X Author");


    const description = document.createElement("p");

    description.className = "publication-description";

    description.textContent =
        article.description || "Open this article to read more.";


    const saveButton = createSaveButton(article);


    const hint = document.createElement("span");

    hint.className = "read-article-hint";

    hint.textContent = "Tap to read full article →";


    information.append(
        category,
        title,
        author,
        description,
        saveButton,
        hint
    );

    card.appendChild(information);


    /*
       OPEN ARTICLE
    */

    card.addEventListener("click", () => {

        openArticle(article);

    });

    card.addEventListener("keydown", event => {

        if (
            event.target === card &&
            (event.key === "Enter" || event.key === " ")
        ) {

            event.preventDefault();

            openArticle(article);

        }

    });

    return card;

}


/* 23. CREATE READER SAVE BUTTON */

function createReaderSaveButton(article) {

    const newButton = createSaveButton(article, true);

    newButton.id = "readerSaveButton";

    newButton.style.marginBottom = "22px";

    if (readerSaveButton && readerSaveButton.parentElement) {

        readerSaveButton.replaceWith(newButton);

    } else {

        readerArticleText.parentElement.insertBefore(
            newButton,
            readerArticleText
        );

    }

    readerSaveButton = newButton;

}


/* 24. OPEN FULL ARTICLE */

function openArticle(article) {

    currentArticle = article;

    readerCategory.textContent =
        article.category || "General";

    readerTitle.textContent =
        article.title || "Untitled publication";

    readerAuthor.textContent =
        article.author_name || "READ-X Author";

    authorAvatar.textContent =
        (article.author_name || "R")
            .trim()
            .charAt(0)
            .toUpperCase();

    readerDescription.textContent =
        article.description || "";

    readerArticleText.textContent =
        article.content || "No article content available.";


    /*
       ARTICLE IMAGE
    */

    readerImage.hidden = true;

    readerImage.removeAttribute("src");

    if (article.image_url) {

        readerImage.src = article.image_url;

        readerImage.alt =
            article.title || "Article image";

        readerImage.hidden = false;

        readerImage.onerror = () => {

            readerImage.hidden = true;

        };

    }


    /*
       READER SAVE BUTTON
    */

    createReaderSaveButton(article);


    /*
       SWITCH TO READER
    */

    document.querySelector(".read-header").hidden = true;

    document.querySelector(".search-section").hidden = true;

    document.querySelector(".category-section").hidden = true;

    document.querySelector(".publications-section").hidden = true;

    articleReader.hidden = false;


    /*
       UPDATE URL
    */

    const url = new URL(window.location.href);

    url.searchParams.set("id", String(article.id));

    window.history.replaceState({}, "", url.href);


    window.scrollTo({
        top: 0,
        behavior: "auto"
    });

}


/* 25. REOPEN ARTICLE FROM URL */

function openArticleFromURL() {

    const params = new URLSearchParams(
        window.location.search
    );

    const articleId = params.get("id");

    if (!articleId) return;

    const article = publications.find(
        item => String(item.id) === String(articleId)
    );

    if (article) {

        openArticle(article);

    } else {

        console.warn(
            "READ-X: Requested article was not found:",
            articleId
        );

    }

}


/* 26. CLOSE ARTICLE READER */

function closeArticle() {

    articleReader.hidden = true;

    document.querySelector(".read-header").hidden = false;

    document.querySelector(".search-section").hidden = false;

    document.querySelector(".category-section").hidden = false;

    document.querySelector(".publications-section").hidden = false;


    currentArticle = null;


    /*
       REMOVE ARTICLE ID FROM URL
    */

    const cleanURL = new URL(window.location.href);

    cleanURL.searchParams.delete("id");

    window.history.replaceState({}, "", cleanURL.href);


    window.scrollTo({
        top: 0,
        behavior: "auto"
    });

}


backToArticles.addEventListener("click", closeArticle);


/* 27. RESET FILTERS */

resetFilters.addEventListener("click", () => {

    selectedCategory = "All";

    searchTerm = "";

    searchInput.value = "";

    clearSearch.hidden = true;

    updateCategoryButtons();

    displayPublications();

});


/* 28. INITIALIZE READ-X */

document.addEventListener("DOMContentLoaded", async () => {

    console.log("READ-X: Starting publication system...");

    if (!checkPageElements()) {

        console.error(
            "READ-X: Please check the element IDs in read.html."
        );

        return;

    }

    if (!db) {

        showError(
            "Supabase is not connected. Check that supabase.js loads before read.js."
        );

        return;

    }

    await loadPublications();

});
