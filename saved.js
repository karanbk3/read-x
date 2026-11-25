
/* ==========================================
   READ-X | SAVED ARTICLES
   Load, Search, Filter and Remove
========================================== */


/* 1. SUPABASE CONNECTION */

const db = window.readxSupabase;


/* 2. PAGE ELEMENTS */

const savedArticleList = document.getElementById("savedArticleList");

const savedCount = document.getElementById("savedCount");

const savedSearch = document.getElementById("savedSearch");

const emptyState = document.getElementById("emptyState");

const searchEmptyState = document.getElementById("searchEmptyState");

const filterButtons = document.querySelectorAll(".filter-button");

const signinButton = document.getElementById("signinButton");


/* 3. PAGE DATA */

let savedArticles = [];

let currentFilter = "all";

let currentUser = null;


/* 4. FORMAT DATE */

function formatDate(dateValue) {

    if (!dateValue) return "Saved recently";

    const date = new Date(dateValue);

    return "Saved " + date.toLocaleDateString();

}


/* 5. CREATE SAFE TEXT ELEMENT */

function createTextElement(tag, className, text) {

    const element = document.createElement(tag);

    element.className = className;

    element.textContent = text || "";

    return element;

}


/* 6. LOAD SAVED ARTICLES */

async function loadSavedArticles() {

    if (!db) {

        showEmptyMessage(
            "Database connection missing. Please refresh the page."
        );

        return;

    }


    try {

        const { data: userData, error: userError } =
            await db.auth.getUser();


        if (userError) throw userError;


        currentUser = userData.user;


        /* USER MUST BE LOGGED IN */

        if (!currentUser) {

            savedCount.textContent = "0 Saved";

            showEmptyMessage(
                "Please sign in to view your saved articles."
            );

            emptyState.querySelector("h3").textContent =
                "Sign in to see your library";

            emptyState.querySelector("p").textContent =
                "Your saved articles are connected to your READ-X account.";

            const exploreButton = emptyState.querySelector(".explore-button");

            exploreButton.textContent = "Sign In";

            exploreButton.href =
                "./login.html?returnTo=" +
                encodeURIComponent("./save.html");

            return;

        }


        /* LOAD USER'S SAVED RECORDS */

        const { data: savedData, error: savedError } =
            await db
                .from("saved_articles")
                .select("id, publication_id, is_read, created_at")
                .eq("user_id", currentUser.id)
                .order("created_at", { ascending: false });


        if (savedError) throw savedError;


        if (!savedData || savedData.length === 0) {

            savedArticles = [];

            renderSavedArticles();

            return;

        }


        /* GET ORIGINAL PUBLICATION IDS */

        const publicationIds = savedData.map(
            item => item.publication_id
        );


        /* LOAD ORIGINAL PUBLICATIONS */

        const { data: publications, error: publicationError } =
            await db
                .from("publications")
                .select(`
                    id,
                    title,
                    category,
                    description,
                    author_name,
                    image_url,
                    created_at
                `)
                .in("id", publicationIds)
                .eq("status", "published");


        if (publicationError) throw publicationError;


        /* COMBINE SAVED DATA WITH PUBLICATIONS */

        const publicationMap = new Map(
            publications.map(article => [article.id, article])
        );


        savedArticles = savedData
            .map(saved => {

                const article = publicationMap.get(
                    saved.publication_id
                );

                if (!article) return null;

                return {

                    ...article,

                    saved_id: saved.id,

                    is_read: saved.is_read,

                    saved_at: saved.created_at

                };

            })
            .filter(Boolean);


        renderSavedArticles();


    } catch (error) {

        console.error(
            "READ-X: Could not load saved articles:",
            error
        );

        savedCount.textContent = "Unavailable";

        showEmptyMessage(
            "We couldn't load your saved articles. Please try again."
        );

    }

}


/* 7. SHOW EMPTY MESSAGE */

function showEmptyMessage(message) {

    savedArticleList.innerHTML = "";

    emptyState.hidden = false;

    searchEmptyState.hidden = true;

    emptyState.querySelector("p").textContent = message;

}


/* 8. CREATE ARTICLE CARD */

function createArticleCard(article) {

    const card = document.createElement("article");

    card.className = "saved-card";


    /* IMAGE */

    const image = document.createElement("img");

    image.className = "saved-card-image";

    image.alt = article.title || "Saved article";

    image.loading = "lazy";

    image.src = article.image_url || "";

    image.hidden = !article.image_url;

    image.onerror = () => {

        image.hidden = true;

    };

    card.appendChild(image);


    const content = document.createElement("div");

    content.className = "saved-card-content";


    /* CATEGORY */

    const category = createTextElement(
        "span",
        "article-category",
        article.category || "General"
    );

    content.appendChild(category);


    /* TITLE */

    const title = createTextElement(
        "h3",
        "",
        article.title
    );

    content.appendChild(title);


    /* DESCRIPTION */

    const description = createTextElement(
        "p",
        "article-description",
        article.description || "Open this article to explore more."
    );

    content.appendChild(description);


    /* ARTICLE INFORMATION */

    const meta = document.createElement("div");

    meta.className = "article-meta";


    const savedDate = createTextElement(
        "span",
        "",
        formatDate(article.saved_at)
    );

    const readStatus = createTextElement(
        "span",
        "",
        article.is_read ? "Read" : "Unread"
    );

    meta.append(savedDate, readStatus);

    content.appendChild(meta);


    /* ACTION BUTTONS */

    const actions = document.createElement("div");

    actions.className = "article-actions";


    const continueButton = createTextElement(
        "a",
        "continue-button",
        "Continue Reading →"
    );

    continueButton.href =
        "./read.html?id=" + encodeURIComponent(article.id);


    continueButton.addEventListener("click", async () => {

        await markArticleAsRead(article.saved_id);

    });


    const removeButton = createTextElement(
        "button",
        "remove-button",
        "×"
    );

    removeButton.type = "button";

    removeButton.title = "Remove from saved articles";

    removeButton.setAttribute(
        "aria-label",
        "Remove " + article.title + " from saved articles"
    );

    removeButton.addEventListener("click", async () => {

        await removeSavedArticle(article.saved_id);

    });


    actions.append(continueButton, removeButton);

    content.appendChild(actions);

    card.appendChild(content);

    return card;

}


/* 9. DISPLAY SAVED ARTICLES */

function renderSavedArticles() {

    savedArticleList.innerHTML = "";

    savedCount.textContent =
        savedArticles.length + " Saved";


    const searchTerm = savedSearch.value
        .trim()
        .toLowerCase();


    const filteredArticles = savedArticles.filter(article => {

        const matchesSearch =

            (article.title || "").toLowerCase().includes(searchTerm) ||

            (article.category || "").toLowerCase().includes(searchTerm) ||

            (article.author_name || "").toLowerCase().includes(searchTerm);


        const matchesFilter =

            currentFilter === "all" ||

            (currentFilter === "read" && article.is_read) ||

            (currentFilter === "unread" && !article.is_read);


        return matchesSearch && matchesFilter;

    });


    /* NO SAVED ARTICLES */

    if (savedArticles.length === 0) {

        emptyState.hidden = false;

        searchEmptyState.hidden = true;

        return;

    }


    emptyState.hidden = true;


    /* NO SEARCH RESULTS */

    if (filteredArticles.length === 0) {

        searchEmptyState.hidden = false;

        return;

    }


    searchEmptyState.hidden = true;


    /* DISPLAY CARDS */

    filteredArticles.forEach(article => {

        savedArticleList.appendChild(
            createArticleCard(article)
        );

    });

}


/* 10. SEARCH */

savedSearch.addEventListener("input", () => {

    renderSavedArticles();

});


/* 11. FILTER BUTTONS */

filterButtons.forEach(button => {

    button.addEventListener("click", () => {

        currentFilter = button.dataset.filter;


        filterButtons.forEach(item => {

            item.classList.remove("active");

        });


        button.classList.add("active");

        renderSavedArticles();

    });

});


/* 12. MARK ARTICLE AS READ */

async function markArticleAsRead(savedId) {

    if (!currentUser) return;


    const { error } = await db
        .from("saved_articles")
        .update({ is_read: true })
        .eq("id", savedId)
        .eq("user_id", currentUser.id);


    if (error) {

        console.error(
            "READ-X: Could not update reading status:",
            error
        );

        return;

    }


    const article = savedArticles.find(
        item => item.saved_id === savedId
    );

    if (article) {

        article.is_read = true;

    }

}


/* 13. REMOVE SAVED ARTICLE */

async function removeSavedArticle(savedId) {

    if (!currentUser) return;


    const confirmed = window.confirm(
        "Remove this article from your saved library?"
    );

    if (!confirmed) return;


    const { error } = await db
        .from("saved_articles")
        .delete()
        .eq("id", savedId)
        .eq("user_id", currentUser.id);


    if (error) {

        console.error(
            "READ-X: Could not remove saved article:",
            error
        );

        alert("Could not remove this article. Please try again.");

        return;

    }


    savedArticles = savedArticles.filter(
        article => article.saved_id !== savedId
    );


    renderSavedArticles();

}


/* 14. SIGN-IN BUTTON */

async function updateSignInButton() {

    if (!db) return;

    const { data } = await db.auth.getUser();

    if (data.user) {

        signinButton.textContent = "Signed in";

        signinButton.href = "./home.html";

    } else {

        signinButton.textContent = "Sign in";

        signinButton.href =
            "./login.html?returnTo=" +
            encodeURIComponent("./save.html");

    }

}


/* 15. INITIALIZE PAGE */

async function initializeSavedPage() {

    if (!db) {

        showEmptyMessage(
            "Database connection missing. Check supabase.js."
        );

        return;

    }


    await updateSignInButton();

    await loadSavedArticles();


    console.log(
        "READ-X: Saved articles page initialized."
    );

}


if (document.readyState === "loading") {

    document.addEventListener(
        "DOMContentLoaded",
        initializeSavedPage
    );

} else {

    initializeSavedPage();

}
