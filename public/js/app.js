const API_URL = ["localhost", "127.0.0.1"].includes(window.location.hostname)
    ? "http://127.0.0.1:5000/api"
    : "/api";
const SERVER_URL = "";

function getToken() {
    return localStorage.getItem("findora_token");
}

function getUser() {
    try {
        return JSON.parse(localStorage.getItem("findora_user")) || null;
    } catch {
        return null;
    }
}

function escapeHTML(value = "") {
    return String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    }[character]));
}

function imageURL(image) {
    if (!image) return "";
    if (image.startsWith("http://") || image.startsWith("https://")) {
        return image;
    }
    return `${SERVER_URL}${image.startsWith("/") ? "" : "/"}${image}`;
}

async function apiRequest(endpoint, options = {}) {
    const headers = { ...(options.headers || {}) };
    const token = getToken();

    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data.message || `Request failed (${response.status})`);
    }

    return data;
}

function showToast(message) {
    let toast = document.querySelector(".toast");

    if (!toast) {
        toast = document.createElement("div");
        toast.className = "toast";
        document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.classList.remove("hidden");

    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.remove(), 3500);
}

function updateNavigation() {
    const actions = document.querySelector(".nav-actions");
    if (!actions) return;

    const user = getUser();
    const token = getToken();

    if (user && token) {
        actions.innerHTML = `
            <a class="btn btn-quiet" href="dashboard.html">Dashboard</a>
            ${user.role === "admin"
                ? '<a class="btn btn-outline" href="admin.html">Admin</a>'
                : ""}
            <button class="btn btn-primary" id="logoutButton" type="button">
                Logout
            </button>
        `;

        document.getElementById("logoutButton").addEventListener("click", () => {
            localStorage.removeItem("findora_token");
            localStorage.removeItem("findora_user");
            window.location.href = "index.html";
        });
    } else {
        actions.innerHTML = `
            <a class="btn btn-quiet" href="login.html">Login</a>
            <a class="btn btn-primary" href="register.html">Sign Up</a>
        `;
    }
}

function itemCard(item) {
    const id = item._id || item.id;
    const title = item.title || item.name || "Untitled item";
    const image = item.image
        ? `<img class="item-image" src="${escapeHTML(imageURL(item.image))}"
                alt="${escapeHTML(title)}" loading="lazy">`
        : "";

    return `
        <article class="item-card">
            ${image}
            <span class="item-type">${escapeHTML(item.type || "Item")}</span>
            <h3>${escapeHTML(title)}</h3>
            <p>${escapeHTML(item.category || "Uncategorised")}</p>
            <p class="item-meta">
                ${escapeHTML(item.location || "Location unavailable")}
                Â· ${escapeHTML(item.date ? new Date(item.date).toLocaleDateString() : "")}
            </p>
            <p class="item-meta">Status: ${escapeHTML(item.status || "Active")}</p>
            <a class="btn btn-outline"
               href="item.html?id=${encodeURIComponent(id)}">
                View Details
            </a>
        </article>
    `;
}

function renderItems(target, items) {
    if (!target) return;

    target.innerHTML = items.length
        ? items.map(itemCard).join("")
        : `<div class="empty-state" style="grid-column:1/-1">
               No items found.
           </div>`;
}

function initTubes() {
    const canvas = document.getElementById("tubes-canvas");
    if (!canvas) return;

    import("https://cdn.jsdelivr.net/npm/threejs-components@0.0.19/build/cursors/tubes1.min.js")
        .then(module => {
            module.default(canvas, {
                tubes: {
                    colors: ["#f967fb", "#53bc28", "#6958d5"],
                    lights: {
                        intensity: 160,
                        colors: ["#83f36e", "#fe8a2e", "#ff008a", "#60aed5"]
                    }
                }
            });
        })
        .catch(error => console.warn("Background animation unavailable:", error));
}

function initMenu() {
    const toggle = document.querySelector(".menu-toggle");
    const nav = document.querySelector(".nav");

    toggle?.addEventListener("click", () => nav?.classList.toggle("open"));
}

function initAuth() {
    document.querySelectorAll("[data-auth]").forEach(form => {
        form.addEventListener("submit", async event => {
            event.preventDefault();

            const type = form.dataset.auth;
            const data = Object.fromEntries(new FormData(form));

            if (type === "register" && data.password !== data.confirmPassword) {
                showToast("Passwords do not match.");
                return;
            }

            delete data.confirmPassword;

            const button = form.querySelector('button[type="submit"]');
            const originalText = button?.textContent || "Submit";

            try {
                if (button) {
                    button.disabled = true;
                    button.textContent = "Please wait...";
                }

                const result = await apiRequest(`/auth/${type}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(data)
                });

                localStorage.setItem("findora_token", result.token);
                localStorage.setItem("findora_user", JSON.stringify(result.user));

                showToast(result.message || "Successful.");

                setTimeout(() => {
                    window.location.href = "dashboard.html";
                }, 600);
            } catch (error) {
                showToast(error.message);
            } finally {
                if (button) {
                    button.disabled = false;
                    button.textContent = originalText;
                }
            }
        });
    });
}

async function initHome() {
    const target = document.getElementById("homeItems");
    const search = document.getElementById("homeSearch");

    // Only run on the homepage, not on the admin dashboard.
    if (!target && !search) return;

    try {
        const result = await apiRequest("/items");
        const items = result.items || [];

        if (target) renderItems(target, items.slice(0, 3));

        document.querySelectorAll("[data-stat]").forEach(element => {
            const type = element.dataset.stat;

            element.textContent =
                type === "reported" ? items.length :
                type === "recovered"
                    ? items.filter(item => item.status === "Recovered").length :
                type === "active"
                    ? items.filter(item => item.status === "Active").length : 0;
        });
    } catch (error) {
        if (target) {
            target.innerHTML =
                `<div class="empty-state">Unable to load recent items.</div>`;
        }
        console.error("Homepage error:", error);
    }

    search?.addEventListener("submit", event => {
        event.preventDefault();
        const query = document.getElementById("homeQuery")?.value || "";
        window.location.href = `browse.html?q=${encodeURIComponent(query)}`;
    });
}

async function initBrowse() {
    const target = document.getElementById("browseItems");
    if (!target) return;

    const query = document.getElementById("browseQuery");
    const type = document.getElementById("typeFilter");
    const category = document.getElementById("categoryFilter");

    const params = new URLSearchParams(window.location.search);
    if (query) query.value = params.get("q") || "";

    target.innerHTML = "<p>Loading items...</p>";

    try {
        const result = await apiRequest("/items");
        const items = result.items || [];

        function applyFilters() {
            const term = (query?.value || "").toLowerCase().trim();
            const selectedType = type?.value || "all";
            const selectedCategory = category?.value || "all";

            const filtered = items.filter(item => {
                const searchable = [
                    item.title, item.category, item.location, item.description
                ].join(" ").toLowerCase();

                return (!term || searchable.includes(term)) &&
                    (selectedType === "all" || item.type === selectedType) &&
                    (selectedCategory === "all" || item.category === selectedCategory);
            });

            renderItems(target, filtered);
        }

        query?.addEventListener("input", applyFilters);
        type?.addEventListener("change", applyFilters);
        category?.addEventListener("change", applyFilters);

        applyFilters();
    } catch (error) {
        console.error("Browse error:", error);
        target.innerHTML = `<div class="empty-state">${escapeHTML(error.message)}</div>`;
    }
}

function initReport() {
    const form = document.getElementById("reportForm");
    if (!form) return;

    form.addEventListener("submit", async event => {
        event.preventDefault();

        if (!getToken()) {
            showToast("Please login before reporting an item.");
            setTimeout(() => window.location.href = "login.html", 700);
            return;
        }

        const button = form.querySelector('button[type="submit"]');
        const originalText = button?.textContent || "Submit Report";

        try {
            if (button) {
                button.disabled = true;
                button.textContent = "Submitting...";
            }

            const formData = new FormData(form);

            await apiRequest("/items", {
                method: "POST",
                body: formData
            });

            showToast("Your report was saved successfully.");
            form.reset();

            setTimeout(() => window.location.href = "dashboard.html", 700);
        } catch (error) {
            showToast(error.message);
        } finally {
            if (button) {
                button.disabled = false;
                button.textContent = originalText;
            }
        }
    });
}

async function initItem() {
    const target = document.getElementById("itemDetails");
    if (!target) return;

    const id = new URLSearchParams(window.location.search).get("id");

    if (!id) {
        target.innerHTML =
            `<div class="empty-state">No item was selected. <a href="browse.html">Browse items</a></div>`;
        return;
    }

    target.innerHTML = "<p>Loading item details...</p>";

    try {
        const result = await apiRequest(`/items/${encodeURIComponent(id)}`);
        const item = result.item;
        const user = getUser();

        const ownerId = item.reportedBy?._id || item.reportedBy;
        const userId = user?.id || user?._id;
        const isOwner = userId && String(ownerId) === String(userId);

        // Find whether this logged-in student already claimed this item.
        let myClaim = null;

        if (getToken()) {
            try {
                const claimsResult = await apiRequest("/claims");
                const claims = claimsResult.claims || [];

                myClaim = claims.find(claim => {
                    const claimItemId = claim.item?._id || claim.item;
                    const claimantId = claim.claimant?._id || claim.claimant;

                    return String(claimItemId) === String(item._id) &&
                        (!claimantId || String(claimantId) === String(userId));
                }) || null;
            } catch (claimError) {
                console.warn("Could not load existing claim:", claimError.message);
            }
        }

        const image = item.image
            ? `<img class="detail-image"
                    src="${escapeHTML(imageURL(item.image))}"
                    alt="${escapeHTML(item.title)}">`
            : "";

        let claimSection = "";

        if (!getToken()) {
            claimSection = `
                <p class="notice">
                    Login to submit a claim for this item.
                    <a href="login.html">Login here</a>.
                </p>`;
        } else if (isOwner) {
            claimSection = `<p class="notice">This is your own report.</p>`;
        } else if (myClaim) {
            claimSection = `
                <div class="notice">
                    <strong>You have already submitted a claim.</strong>
                    <p>Claim status: <strong>${escapeHTML(myClaim.status)}</strong></p>
                    <p>You cannot submit another claim for this item.</p>
                </div>`;
        } else if (item.status !== "Active") {
            claimSection = `
                <p class="notice">
                    This item is ${escapeHTML(item.status)} and is not accepting claims.
                </p>`;
        } else {
            const isLost = item.type === "Lost";

            const heading = isLost
                ? "I Found This Item"
                : "This Is My Item";

            const explanation = isLost
                ? "Tell the reporter where and when you found this item, and where it is currently being kept."
                : "Explain why this item belongs to you. Include identifying details that are not already visible in the listing.";

            const placeholder = isLost
                ? "Example: I found it near the library entrance yesterday afternoon..."
                : "Describe unique marks, contents, or other details that help verify ownership...";

            claimSection = `
                <form id="claimForm" class="claim-form">
                    <h2>${heading}</h2>
                    <p class="muted">${explanation}</p>
                    <div class="form-group">
                        <label for="claimMessage">Your message</label>
                        <textarea
                            id="claimMessage"
                            name="message"
                            maxlength="1000"
                            required
                            placeholder="${placeholder}"></textarea>
                    </div>
                    <button class="btn btn-primary" type="submit">
                        Submit Claim
                    </button>
                </form>`;
        }

        target.innerHTML = `
            <article class="form-card">
                ${image}
                <span class="item-type">${escapeHTML(item.type)}</span>
                <h1 class="page-title">${escapeHTML(item.title)}</h1>
                <p class="muted">
                    ${escapeHTML(item.category)} Â·
                    ${escapeHTML(item.location)} Â·
                    ${escapeHTML(new Date(item.date).toLocaleDateString())}
                </p>
                <p>${escapeHTML(item.description)}</p>
                <p class="muted">
                    Status: <strong>${escapeHTML(item.status)}</strong>
                </p>
                <p class="muted">
                    Reported by: ${escapeHTML(item.reportedBy?.name || "Campus user")}
                </p>
                ${claimSection}
                <p>
                    <a class="btn btn-outline" href="browse.html">Back to Browse</a>
                </p>
            </article>`;

        const claimForm = document.getElementById("claimForm");

        claimForm?.addEventListener("submit", async event => {
            event.preventDefault();

            const button = claimForm.querySelector('button[type="submit"]');
            const message =
                document.getElementById("claimMessage").value.trim();

            if (!message) {
                showToast("Please enter your claim message.");
                return;
            }

            button.disabled = true;
            button.textContent = "Submitting...";

            try {
                await apiRequest("/claims", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        itemId: item._id,
                        message
                    })
                });

                showToast("Claim submitted successfully.");

                // Reload item and claims so the pending state appears immediately.
                await initItem();
            } catch (error) {
                showToast(error.message);
                button.disabled = false;
                button.textContent = "Submit Claim";
            }
        });

    } catch (error) {
        target.innerHTML = `
            <div class="empty-state">
                ${escapeHTML(error.message)}
                <p><a href="browse.html">Return to Browse</a></p>
            </div>`;
    }
}

async function initDashboard() {
    const target = document.getElementById("dashboardItems");
    const claimsTarget = document.getElementById("myClaims");
    if (!target && !claimsTarget) return;

    if (!getToken()) {
        if (target) target.innerHTML = `<div class="empty-state">Please <a href="login.html">login</a> to view your dashboard.</div>`;
        if (claimsTarget) claimsTarget.innerHTML = "";
        return;
    }

    try {
        const [itemsResult, claimsResult] = await Promise.all([
            apiRequest("/items/mine"),
            apiRequest("/claims")
        ]);

        const items = itemsResult.items || [];
        const claims = claimsResult.claims || [];

        if (target) renderItems(target, items);

        if (claimsTarget) {
            claimsTarget.innerHTML = claims.length ? claims.map(claim => `
                <div class="claim-row">
                    <div>
                        <strong>${escapeHTML(claim.item?.title || "Item unavailable")}</strong>
                        <p class="muted">${escapeHTML(claim.message)}</p>
                    </div>
                    <span class="status-pill">${escapeHTML(claim.status)}</span>
                </div>
            `).join("") : `<div class="empty-state">You haven't submitted any claims yet.</div>`;
        }

        const reportCount = document.getElementById("myReportCount");
        const claimCount = document.getElementById("myClaimCount");

        if (reportCount) reportCount.textContent = items.length;
        if (claimCount) claimCount.textContent = claims.length;

        const notice = document.getElementById("dashboardNotice");
        if (notice) notice.textContent = `Showing ${items.length} report(s) and ${claims.length} submitted claim(s).`;
    } catch (error) {
        console.error("Dashboard error:", error);
        if (target) target.innerHTML = `<div class="empty-state">${escapeHTML(error.message)}</div>`;
        if (claimsTarget) claimsTarget.innerHTML = "";
    }
}

async function initAdmin() {
    const target = document.getElementById("adminItems");
    const claimsTarget = document.getElementById("adminClaims");
    if (!target && !claimsTarget) return;

    const user = getUser();

    if (!getToken() || user?.role !== "admin") {
        if (target) target.innerHTML = `<div class="empty-state">Administrator login required.</div>`;
        if (claimsTarget) claimsTarget.innerHTML = "";
        const notice = document.getElementById("adminNotice");
        if (notice) notice.textContent = "This page requires an administrator account.";
        return;
    }

    try {
        const [itemsResult, claimsResult] = await Promise.all([
            apiRequest("/items"),
            apiRequest("/claims")
        ]);

        const items = itemsResult.items || [];
        const claims = claimsResult.claims || [];

        const stats = {
            reported: items.length,
            active: items.filter(item => item.status === "Active").length,
            recovered: items.filter(item => item.status === "Recovered").length,
            pending: claims.filter(claim => claim.status === "Pending").length
        };

        document.querySelectorAll("[data-stat]").forEach(element => {
            element.textContent = stats[element.dataset.stat] ?? 0;
        });

        if (target) {
            target.innerHTML = items.length ? `
                <div class="table-wrap">
                    <table class="data-table">
                        <thead><tr>
                            <th>Item</th><th>Type</th><th>Reported by</th>
                            <th>Status</th><th>Update status</th>
                        </tr></thead>
                        <tbody>
                        ${items.map(item => `
                            <tr>
                                <td>${escapeHTML(item.title)}</td>
                                <td>${escapeHTML(item.type)}</td>
                                <td>${escapeHTML(item.reportedBy?.name || "Unknown")}</td>
                                <td>${escapeHTML(item.status)}</td>
                                <td>
                                    <select data-item-status="${escapeHTML(item._id)}">
                                        ${["Active", "Claimed", "Recovered", "Closed"].map(status =>
                                            `<option value="${status}" ${item.status === status ? "selected" : ""}>${status}</option>`
                                        ).join("")}
                                    </select>
                                </td>
                            </tr>
                        `).join("")}
                        </tbody>
                    </table>
                </div>
            ` : `<div class="empty-state">No reports found.</div>`;
        }

        if (claimsTarget) {
            claimsTarget.innerHTML = claims.length ? `
                <div class="table-wrap">
                    <table class="data-table">
                        <thead><tr>
                            <th>Item</th><th>Claimant</th><th>Message</th>
                            <th>Status</th><th>Review</th>
                        </tr></thead>
                        <tbody>
                        ${claims.map(claim => `
                            <tr>
                                <td>${escapeHTML(claim.item?.title || "Unavailable")}</td>
                                <td>${escapeHTML(claim.claimant?.name || "Unknown")}
                                    <br><small>${escapeHTML(claim.claimant?.email || "")}</small>
                                </td>
                                <td>${escapeHTML(claim.message)}</td>
                                <td>${escapeHTML(claim.status)}</td>
                                <td>
                                    ${claim.status === "Pending" ? `
                                        <button class="btn btn-primary"
                                            data-review-id="${escapeHTML(claim._id)}"
                                            data-review-status="Approved">Approve</button>
                                        <button class="btn btn-quiet"
                                            data-review-id="${escapeHTML(claim._id)}"
                                            data-review-status="Rejected">Reject</button>
                                    ` : "Reviewed"}
                                </td>
                            </tr>
                        `).join("")}
                        </tbody>
                    </table>
                </div>
            ` : `<div class="empty-state">No claims submitted yet.</div>`;
        }

        target?.querySelectorAll("[data-item-status]").forEach(select => {
            select.addEventListener("change", async () => {
                try {
                    await apiRequest(`/items/${select.dataset.itemStatus}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ status: select.value })
                    });
                    showToast("Item status updated.");
                } catch (error) {
                    showToast(error.message);
                    initAdmin();
                }
            });
        });

        claimsTarget?.querySelectorAll("[data-review-id]").forEach(button => {
            button.addEventListener("click", async () => {
                const decision = button.dataset.reviewStatus;
                if (!confirm(`${decision} this claim?`)) return;

                button.disabled = true;

                try {
                    await apiRequest(`/claims/${button.dataset.reviewId}/review`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ status: decision })
                    });

                    showToast(`Claim ${decision.toLowerCase()}.`);
                    initAdmin();
                } catch (error) {
                    showToast(error.message);
                    button.disabled = false;
                }
            });
        });

        const notice = document.getElementById("adminNotice");
        if (notice) notice.textContent = "Administrator controls connected to the FINDORA API.";
    } catch (error) {
        console.error("Admin dashboard error:", error);
        if (target) target.innerHTML = `<div class="empty-state">${escapeHTML(error.message)}</div>`;
        if (claimsTarget) claimsTarget.innerHTML = "";
    }
}

document.addEventListener("DOMContentLoaded", () => {
    updateNavigation();
    initMenu();
    initTubes();
    initAuth();

    initHome();
    initBrowse();
    initReport();
    initItem();
    initDashboard();
    initAdmin();
});
