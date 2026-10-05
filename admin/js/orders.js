let orders = [];

async function loadOrders() {

try {

    const data =
        await apiFetch(
            "/api/admin/orders"
        );


    if (!data) return;


    orders =
        data.orders;


    renderOrders();


} catch (error) {

    showOrderMessage(
        error.message,
        true
    );

}


}

function renderOrders() {

const table =
    document.getElementById(
        "ordersTable"
    );


table.innerHTML = "";


if (!orders.length) {

    table.innerHTML = `
        <tr>
            <td colspan="6">
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
                ${escapeHtml(
                    order.city
                )}
            </td>

            <td>
                ${formatPrice(
                    order.total
                )}
            </td>

            <td>

                <select
                    onchange="changeOrderStatus(
                        ${order.id},
                        this.value
                    )"
                >

                    ${statusOptions(
                        order.status
                    )}

                </select>

            </td>

            <td>

                <button
                    class="btn btn-secondary btn-small"
                    onclick="viewOrder(${order.id})"
                >
                    Voir
                </button>

            </td>

        </tr>

    `;

});


}

function statusOptions(current) {

const statuses = {

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


return Object.entries(
    statuses
)
    .map(function ([value, label]) {

        return `

            <option
                value="${value}"
                ${value === current
                    ? "selected"
                    : ""}
            >
                ${label}
            </option>

        `;

    })
    .join("");


}

/* ==========================================
MODIFIER STATUT
========================================== */

async function changeOrderStatus(
id,
status
) {

try {

    const data =
        await apiFetch(
            `/api/admin/orders/${id}/status`,
            {
                method: "PATCH",

                body:
                    JSON.stringify({
                        status
                    })
            }
        );


    if (!data) return;


    showOrderMessage(
        data.message,
        false
    );


    await loadOrders();

    await loadDashboard();


} catch (error) {

    showOrderMessage(
        error.message,
        true
    );

    await loadOrders();

}


}

/* ==========================================
DÉTAIL COMMANDE
========================================== */

async function viewOrder(id) {

try {

    const data =
        await apiFetch(
            `/api/admin/orders/${id}`
        );


    if (!data) return;


    const order =
        data.order;


    document.getElementById(
        "orderModalNumber"
    ).textContent =
        order.orderNumber;


    const itemsHtml =
        order.items.map(
            function (item) {

                return `

                    <tr>

                        <td>
                            ${escapeHtml(
                                item.product_name
                            )}
                        </td>

                        <td>
                            ${item.quantity}
                        </td>

                        <td>
                            ${formatPrice(
                                item.price
                            )}
                        </td>

                        <td>
                            ${formatPrice(
                                item.subtotal
                            )}
                        </td>

                    </tr>

                `;

            }
        ).join("");


    document.getElementById(
        "orderDetails"
    ).innerHTML = `

        <div class="order-info">

            <h3>
                Client
            </h3>

            <p>
                <strong>
                    ${escapeHtml(
                        order.customer.firstName
                    )}
                    ${escapeHtml(
                        order.customer.lastName
                    )}
                </strong>
            </p>

            <p>
                ${escapeHtml(
                    order.customer.phone
                )}
            </p>

            <p>
                ${escapeHtml(
                    order.customer.city
                )}
            </p>

            <p>
                ${escapeHtml(
                    order.customer.address
                )}
            </p>

        </div>


        <div class="order-info">

            <h3>
                Livraison
            </h3>

            <p>
                Type :
                ${escapeHtml(
                    order.delivery.type
                )}
            </p>

            <p>
                Prix :
                ${formatPrice(
                    order.delivery.price
                )}
            </p>

        </div>


        <div class="table-wrapper">

            <table>

                <thead>

                    <tr>

                        <th>
                            Produit
                        </th>

                        <th>
                            Quantité
                        </th>

                        <th>
                            Prix
                        </th>

                        <th>
                            Sous-total
                        </th>

                    </tr>

                </thead>

                <tbody>

                    ${itemsHtml}

                </tbody>

            </table>

        </div>


        <div
            style="
                margin-top:20px;
                text-align:right;
            "
        >

            <p>
                Sous-total :
                <strong>
                    ${formatPrice(
                        order.subtotal
                    )}
                </strong>
            </p>

            <p>
                Total :
                <strong>
                    ${formatPrice(
                        order.total
                    )}
                </strong>
            </p>

        </div>

    `;


    document.getElementById(
        "orderModal"
    ).classList.remove(
        "hidden"
    );


} catch (error) {

    showOrderMessage(
        error.message,
        true
    );

}


}

document.getElementById(
"closeOrderModal"
).addEventListener(
"click",
function () {

    document.getElementById(
        "orderModal"
    ).classList.add(
        "hidden"
    );

}


);

function showOrderMessage(
message,
error
) {

const element =
    document.getElementById(
        "orderMessage"
    );


element.textContent =
    message;


element.className =
    error
        ? "message message-error"
        : "message message-success";


}