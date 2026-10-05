const API_URL = "http://localhost:3000";

const token =
localStorage.getItem("adminToken");

if (!token) {

window.location.href =
    "login.html";


}

const admin =
JSON.parse(
localStorage.getItem("admin") || "{}"
);

const adminUsername =
document.getElementById("adminUsername");

if (admin.username) {

adminUsername.textContent =
    admin.username;


}

function authHeaders() {

return {

    "Authorization":
        `Bearer ${token}`,

    "Content-Type":
        "application/json"

};


}

async function apiFetch(url, options = {}) {

const response =
    await fetch(
        `${API_URL}${url}`,
        {
            ...options,

            headers: {
                ...authHeaders(),
                ...(options.headers || {})
            }
        }
    );


if (response.status === 401) {

    localStorage.removeItem("adminToken");
    localStorage.removeItem("admin");

    window.location.href =
        "login.html";

    return null;

}


const data =
    await response.json();


if (!response.ok) {

    throw new Error(
        data.message ||
        "Erreur serveur."
    );

}


return data;


}

/* ==========================================
NAVIGATION
========================================== */

const navButtons =
document.querySelectorAll(
".nav-button"
);

const sections = {

dashboard:
    document.getElementById(
        "dashboardSection"
    ),

products:
    document.getElementById(
        "productsSection"
    ),

orders:
    document.getElementById(
        "ordersSection"
    )


};

const pageTitle =
document.getElementById(
"pageTitle"
);

navButtons.forEach(function (button) {

button.addEventListener(
    "click",
    function () {

        const section =
            button.dataset.section;


        showSection(section);

    }
);


});

function showSection(section) {

Object.values(sections)
    .forEach(function (element) {

        element.classList.add("hidden");

    });


sections[section]
    .classList.remove("hidden");


navButtons.forEach(function (button) {

    button.classList.remove("active");

    if (
        button.dataset.section ===
        section
    ) {

        button.classList.add("active");

    }

});


const titles = {

    dashboard:
        "Tableau de bord",

    products:
        "Produits",

    orders:
        "Commandes"

};


pageTitle.textContent =
    titles[section];


if (section === "products") {

    loadProducts();

}


if (section === "orders") {

    loadOrders();

}


}

/* ==========================================
DASHBOARD
========================================== */

async function loadDashboard() {

try {

    const data =
        await apiFetch(
            "/api/admin/dashboard"
        );


    if (!data) return;


    const stats =
        data.statistics;


    document.getElementById(
        "statProducts"
    ).textContent =
        stats.products;


    document.getElementById(
        "statOrders"
    ).textContent =
        stats.orders;


    document.getElementById(
        "statPending"
    ).textContent =
        stats.pending;


    document.getElementById(
        "statRevenue"
    ).textContent =
        formatPrice(
            stats.revenue
        );


    renderLatestOrders(
        data.latestOrders
    );


    renderDashboardProducts(
        data.products
    );


} catch (error) {

    console.error(error);

}


}

function renderLatestOrders(orders) {

const table =
    document.getElementById(
        "latestOrdersTable"
    );


table.innerHTML = "";


if (!orders.length) {

    table.innerHTML = `
        <tr>
            <td colspan="4">
                Aucune commande.
            </td>
        </tr>
    `;

    return;

}


orders.forEach(function (order) {

    table.innerHTML += `

        <tr>

            <td>
                <strong>
                    ${escapeHtml(
                        order.order_number
                    )}
                </strong>
            </td>

            <td>
                ${escapeHtml(
                    order.first_name
                )}
                ${escapeHtml(
                    order.last_name
                )}
            </td>

            <td>
                ${formatPrice(
                    order.total
                )}
            </td>

            <td>
                ${statusBadge(
                    order.status
                )}
            </td>

        </tr>

    `;

});


}

function renderDashboardProducts(products) {

const container =
    document.getElementById(
        "dashboardProducts"
    );


container.innerHTML = "";


products
    .slice(0, 5)
    .forEach(function (product) {

        container.innerHTML += `

            <div class="mini-product">

                <span class="mini-product-name">
                    ${escapeHtml(
                        product.name
                    )}
                </span>

                <span class="mini-product-price">
                    ${formatPrice(
                        product.price
                    )}
                </span>

            </div>

        `;

    });


}

function formatPrice(price) {

return Number(price).toLocaleString(
    "fr-FR"
) + " FCFA";


}

function statusBadge(status) {

const labels = {

    pending:
        "En attente",

    confirmed:
        "Confirmée",

    shipped:
        "Expédiée",

    delivered:
        "Livrée",

    cancelled:
        "Annulée"

};


return `

    <span class="status status-${status}">

        ${labels[status] || status}

    </span>

`;


}

function escapeHtml(value) {

return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");


}

/* ==========================================
BOUTONS DASHBOARD
========================================== */

document.getElementById(
"viewProductsButton"
).addEventListener(
"click",
function () {

    showSection("products");

}


);

document.getElementById(
"viewOrdersButton"
).addEventListener(
"click",
function () {

    showSection("orders");

}


);

/* ==========================================
DÉCONNEXION
========================================== */

document.getElementById(
"logoutButton"
).addEventListener(
"click",
function () {

    localStorage.removeItem(
        "adminToken"
    );

    localStorage.removeItem(
        "admin"
    );

    window.location.href =
        "login.html";

}


);

/* ==========================================
INITIALISATION
========================================== */

loadDashboard();