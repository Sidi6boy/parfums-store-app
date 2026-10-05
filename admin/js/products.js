let products = [];

async function loadProducts() {

try {

    const data =
        await apiFetch(
            "/api/admin/products"
        );


    if (!data) return;


    products =
        data.products;


    renderProducts();


} catch (error) {

    showProductMessage(
        error.message,
        true
    );

}


}

function renderProducts() {

const table =
    document.getElementById(
        "productsTable"
    );


table.innerHTML = "";


if (!products.length) {

    table.innerHTML = `
        <tr>
            <td colspan="5">
                Aucun produit.
            </td>
        </tr>
    `;

    return;

}


products.forEach(function (product) {

    table.innerHTML += `

        <tr>

            <td>
                ${product.id}
            </td>

            <td class="product-name">
                ${escapeHtml(
                    product.name
                )}
            </td>

            <td>
                ${escapeHtml(
                    product.category
                )}
            </td>

            <td>
                ${formatPrice(
                    product.price
                )}
            </td>

            <td>

                <div class="actions">

                    <button
                        class="btn btn-secondary btn-small"
                        onclick="editProduct(${product.id})"
                    >
                        Modifier
                    </button>

                    <button
                        class="btn btn-danger btn-small"
                        onclick="deleteProduct(${product.id})"
                    >
                        Supprimer
                    </button>

                </div>

            </td>

        </tr>

    `;

});


}

/* ==========================================
MODALE
========================================== */

const productModal =
document.getElementById(
"productModal"
);

document.getElementById(
"addProductButton"
).addEventListener(
"click",
function () {

    openProductModal();

}


);

document.getElementById(
"closeProductModal"
).addEventListener(
"click",
closeProductModal
);

document.getElementById(
"cancelProductButton"
).addEventListener(
"click",
closeProductModal
);

function openProductModal(product = null) {

productModal.classList.remove(
    "hidden"
);


document.getElementById(
    "productForm"
).reset();


document.getElementById(
    "productId"
).value = "";


if (product) {

    document.getElementById(
        "productModalTitle"
    ).textContent =
        "Modifier le produit";


    document.getElementById(
        "productId"
    ).value =
        product.id;


    document.getElementById(
        "productName"
    ).value =
        product.name;


    document.getElementById(
        "productPrice"
    ).value =
        product.price;


    document.getElementById(
        "productCategory"
    ).value =
        product.category;


    document.getElementById(
        "productDescription"
    ).value =
        product.description;


    document.getElementById(
        "productImage"
    ).value =
        product.image;

} else {

    document.getElementById(
        "productModalTitle"
    ).textContent =
        "Ajouter un produit";

}


}

function closeProductModal() {

productModal.classList.add(
    "hidden"
);


}

/* ==========================================
ENREGISTRER
========================================== */

document.getElementById(
"productForm"
).addEventListener(
"submit",
async function (event) {

    event.preventDefault();


    const id =
        document.getElementById(
            "productId"
        ).value;


    const product = {

        name:
            document.getElementById(
                "productName"
            ).value.trim(),

        price:
            Number(
                document.getElementById(
                    "productPrice"
                ).value
            ),

        category:
            document.getElementById(
                "productCategory"
            ).value.trim(),

        description:
            document.getElementById(
                "productDescription"
            ).value.trim(),

        image:
            document.getElementById(
                "productImage"
            ).value.trim()

    };


    try {

        let data;


        if (id) {

            data =
                await apiFetch(
                    `/api/admin/products/${id}`,
                    {
                        method: "PUT",

                        body:
                            JSON.stringify(
                                product
                            )
                    }
                );

        } else {

            data =
                await apiFetch(
                    "/api/admin/products",
                    {
                        method: "POST",

                        body:
                            JSON.stringify(
                                product
                            )
                    }
                );

        }


        if (!data) return;


        closeProductModal();


        showProductMessage(
            data.message,
            false
        );


        await loadProducts();


        await loadDashboard();


    } catch (error) {

        showProductMessage(
            error.message,
            true
        );

    }

}


);

/* ==========================================
MODIFIER
========================================== */

async function editProduct(id) {

try {

    const data =
        await apiFetch(
            `/api/admin/products/${id}`
        );


    if (!data) return;


    openProductModal(
        data.product
    );


} catch (error) {

    showProductMessage(
        error.message,
        true
    );

}


}

/* ==========================================
SUPPRIMER
========================================== */

async function deleteProduct(id) {

const product =
    products.find(function (item) {

        return item.id === id;

    });


if (!product) return;


const confirmed =
    confirm(
        `Voulez-vous vraiment supprimer "${product.name}" ?`
    );


if (!confirmed) return;


try {

    const data =
        await apiFetch(
            `/api/admin/products/${id}`,
            {
                method: "DELETE"
            }
        );


    if (!data) return;


    showProductMessage(
        data.message,
        false
    );


    await loadProducts();

    await loadDashboard();


} catch (error) {

    showProductMessage(
        error.message,
        true
    );

}


}

function showProductMessage(
message,
error
) {

const element =
    document.getElementById(
        "productMessage"
    );


element.textContent =
    message;


element.className =
    error
        ? "message message-error"
        : "message message-success";


}
