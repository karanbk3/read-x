
/* ==========================================
   READ-X | SHARE SYSTEM
   Write, Sign Up, Login and Publish
========================================== */


/* 1. SUPABASE CONNECTION */

const db = window.readxSupabase;


/* 2. PAGE ELEMENTS */

const form = document.getElementById("publicationForm");

const titleInput = document.getElementById("articleTitle");
const categoryInput = document.getElementById("articleCategory");
const descriptionInput = document.getElementById("articleDescription");
const contentInput = document.getElementById("articleContent");

const imageInput = document.getElementById("articleImage");
const imagePreview = document.getElementById("imagePreview");
const previewImage = document.getElementById("previewImage");
const removeImage = document.getElementById("removeImage");

const publishButton = document.getElementById("publishButton");
const publishButtonText = document.getElementById("publishButtonText");

const formMessage = document.getElementById("formMessage");
const successMessage = document.getElementById("successMessage");


/* 3. SETTINGS */

const DRAFT_KEY = "readx_pending_publication";
const MAX_IMAGE_SIZE = 2 * 1024 * 1024;

let selectedImage = null;
let publishing = false;


/* 4. DISPLAY MESSAGE */

function showMessage(message, type = "error") {

    formMessage.textContent = message;
    formMessage.className = `form-message ${type}`;
    formMessage.hidden = false;

}

function hideMessage() {

    formMessage.hidden = true;

}


/* 5. BUTTON LOADING */

function setButtonLoading(isLoading, message = "") {

    publishButton.disabled = isLoading;

    publishButtonText.textContent = isLoading
        ? message
        : "Publish article →";

}


/* 6. IMAGE SELECTION */

imageInput.addEventListener("change", () => {

    const file = imageInput.files[0];

    if (!file) return;

    const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp"
    ];

    if (!allowedTypes.includes(file.type)) {

        showMessage("Please select a JPG, PNG or WEBP image.");
        imageInput.value = "";
        return;

    }

    if (file.size > MAX_IMAGE_SIZE) {

        showMessage("Please choose an image smaller than 2 MB.");
        imageInput.value = "";
        return;

    }

    selectedImage = file;

    previewImage.src = URL.createObjectURL(file);
    imagePreview.hidden = false;

    hideMessage();

});


/* 7. REMOVE IMAGE */

removeImage.addEventListener("click", () => {

    selectedImage = null;
    imageInput.value = "";

    previewImage.removeAttribute("src");
    imagePreview.hidden = true;

});


/* 8. GET ARTICLE DATA */

function getArticleData() {

    return {

        title: titleInput.value.trim(),
        category: categoryInput.value,
        description: descriptionInput.value.trim(),
        content: contentInput.value.trim()

    };

}


/* 9. CONVERT IMAGE */

function imageToDataURL(file) {

    return new Promise((resolve, reject) => {

        const reader = new FileReader();

        reader.onload = () => resolve(reader.result);

        reader.onerror = () => reject(
            new Error("Unable to save your selected image.")
        );

        reader.readAsDataURL(file);

    });

}


/* 10. SAVE ARTICLE BEFORE LOGIN */

async function savePendingArticle() {

    const article = getArticleData();

    let imageData = null;

    if (selectedImage) {

        imageData = selectedImage.dataURL ||
            await imageToDataURL(selectedImage);

    }

    const pendingArticle = {

        ...article,

        imageData,

        imageName: selectedImage
            ? selectedImage.name
            : null,

        imageType: selectedImage
            ? selectedImage.type
            : null

    };

    try {

        sessionStorage.setItem(
            DRAFT_KEY,
            JSON.stringify(pendingArticle)
        );

    } catch (error) {

        throw new Error(
            "Your article is too large to save temporarily. Please use a smaller image."
        );

    }

}


/* 11. RESTORE ARTICLE AFTER LOGIN */

function restorePendingArticle() {

    const savedArticle = sessionStorage.getItem(DRAFT_KEY);

    if (!savedArticle) return false;

    try {

        const article = JSON.parse(savedArticle);

        titleInput.value = article.title || "";
        categoryInput.value = article.category || "";
        descriptionInput.value = article.description || "";
        contentInput.value = article.content || "";

        if (article.imageData) {

            previewImage.src = article.imageData;
            imagePreview.hidden = false;

            selectedImage = {

                name: article.imageName || "article-image.jpg",
                type: article.imageType || "image/jpeg",
                dataURL: article.imageData

            };

        }

        return true;

    } catch (error) {

        console.error("READ-X draft restore error:", error);

        sessionStorage.removeItem(DRAFT_KEY);

        return false;

    }

}


/* 12. REDIRECT TO SIGN UP / LOGIN */

async function goToLogin() {

    showMessage(
        "Your article is saved! Create your account or log in to publish.",
        "info"
    );

    setButtonLoading(true, "Preparing your article...");

    try {

        // Save the complete article first.
        await savePendingArticle();

        // Return destination after authentication.
        const returnURL = "./share.html?resume=publish";

        // Open Login page directly in SIGN UP mode.
        const loginURL =
            "./login.html?mode=signup&returnTo=" +
            encodeURIComponent(returnURL);

        window.location.assign(loginURL);

    } catch (error) {

        console.error("READ-X redirect error:", error);

        showMessage(error.message);

        setButtonLoading(false);

    }

}


/* 13. UPLOAD ARTICLE IMAGE */

async function uploadArticleImage(user) {

    if (!selectedImage) return null;

    const fileName = selectedImage.name
        .replace(/[^a-zA-Z0-9._-]/g, "_");

    const uniqueName = `${Date.now()}-${fileName}`;

    const filePath = `${user.id}/${uniqueName}`;

    let fileToUpload = selectedImage;

    if (selectedImage.dataURL) {

        const response = await fetch(selectedImage.dataURL);

        fileToUpload = await response.blob();

    }

    const { error } = await db.storage
        .from("readx-publications")
        .upload(filePath, fileToUpload, {

            contentType: selectedImage.type,
            upsert: false

        });

    if (error) {

        throw new Error("Image upload failed: " + error.message);

    }

    const { data } = db.storage
        .from("readx-publications")
        .getPublicUrl(filePath);

    return data.publicUrl;

}


/* 14. PUBLISH ARTICLE */

async function publishArticle() {

    if (publishing) return;

    publishing = true;

    setButtonLoading(true, "Publishing article...");

    hideMessage();

    let uploadedImagePath = null;

    try {

        if (!db) {

            throw new Error("Supabase connection is missing.");

        }


        // CHECK USER SESSION

        const {
            data: { user },
            error: authError
        } = await db.auth.getUser();

        if (authError) throw authError;

        if (!user) {

            publishing = false;

            await goToLogin();

            return;

        }


        // CHECK ARTICLE DETAILS

        const article = getArticleData();

        if (
            !article.title ||
            !article.category ||
            !article.description ||
            !article.content
        ) {

            throw new Error("Please complete all required fields.");

        }


        // UPLOAD PHOTO

        let imageURL = null;

        if (selectedImage) {

            setButtonLoading(true, "Uploading photo...");

            imageURL = await uploadArticleImage(user);

        }


        // AUTHOR INFORMATION

        const authorName =
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.user_metadata?.display_name ||
            user.email?.split("@")[0] ||
            "READ-X Author";


        // PUBLISH ARTICLE

        setButtonLoading(true, "Publishing article...");

        const { data, error } = await db
            .from("publications")
            .insert({

                author_id: user.id,
                author_name: authorName,
                title: article.title,
                category: article.category,
                description: article.description,
                content: article.content,
                image_url: imageURL,
                status: "published"

            })
            .select()
            .single();

        if (error) throw error;


        // CLEAR SAVED ARTICLE

        sessionStorage.removeItem(DRAFT_KEY);

        const currentURL = new URL(window.location.href);

        currentURL.searchParams.delete("resume");

        window.history.replaceState(
            {},
            "",
            currentURL.pathname
        );


        // SHOW SUCCESS

        form.hidden = true;
        successMessage.hidden = false;

        window.scrollTo({

            top: 0,
            behavior: "smooth"

        });

        console.log(
            "READ-X: Article published successfully.",
            data.id
        );

    } catch (error) {

        console.error("READ-X publishing error:", error);

        showMessage(
            error.message || "Unable to publish your article."
        );

        setButtonLoading(false);

    } finally {

        publishing = false;

    }

}


/* 15. PUBLISH BUTTON */

form.addEventListener("submit", async (event) => {

    event.preventDefault();

    hideMessage();

    if (!form.reportValidity()) return;

    if (publishing) return;

    await publishArticle();

});


/* 16. INITIALIZE SHARE PAGE */

async function initializeSharePage() {

    if (!db) {

        showMessage(
            "Supabase connection is missing. Check supabase.js."
        );

        return;

    }

    const parameters = new URLSearchParams(
        window.location.search
    );

    const shouldResume =
        parameters.get("resume") === "publish";


    if (!shouldResume) return;


    // RESTORE SAVED ARTICLE

    const restored = restorePendingArticle();

    if (!restored) {

        showMessage(
            "No saved article was found. Please write your article again."
        );

        return;

    }


    // CHECK LOGIN SESSION

    const {
        data: { user },
        error
    } = await db.auth.getUser();

    if (error) {

        console.error(error);

        showMessage(
            "Unable to verify your account. Please refresh the page."
        );

        return;

    }


    if (!user) {

        showMessage(
            "Please sign in or create an account to publish.",
            "info"
        );

        return;

    }


    // AUTOMATIC PUBLISH AFTER LOGIN

    await publishArticle();

}


/* 17. START SHARE SYSTEM */

document.addEventListener(
    "DOMContentLoaded",
    initializeSharePage
);

console.log("READ-X: Share system loaded.");
