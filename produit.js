// ==========================
// RÉCUPÉRER LE PANIER
// ==========================

let cart =
    JSON.parse(localStorage.getItem("cart")) || [];


// ==========================
// RÉCUPÉRER L'ID
// ==========================

const params =
    new URLSearchParams(
        window.location.search
    );


const productId =
    Number(params.get("id"));


// ==========================
// RECHERCHER LE PRODUIT
// ==========================

const product =
    products.find(function(item) {

        return item.id === productId;

    });


// ==========================
// ÉLÉMENT HTML
// ==========================

const productDetail =
    document.getElementById("productDetail");


// ==========================
// VÉRIFIER LE PRODUIT
// ==========================

if (!product) {

    productDetail.innerHTML = `

        <div class="empty-order">

            <h2>
                Produit introuvable
            </h2>

            <p>
                Le parfum que vous recherchez
                n'existe pas ou n'est plus disponible.
            </p>

            <a href="index.html">
                Retourner à la boutique
            </a>

        </div>

    `;

} else {

    // ==========================
    // QUANTITÉ
    // ==========================

    let quantity = 1;


    // ==========================
    // AFFICHER LE PRODUIT
    // ==========================

    productDetail.innerHTML = `

        <div class="product-detail">

            <div class="product-image">

                <img
                    src="${product.image}"
                    alt="${product.name}"
                >

            </div>


            <div>

                <h2>
                    ${product.name}
                </h2>


                <p>
                    Catégorie :
                    ${product.category}
                </p>


                <p>
                    ${product.description}
                </p>


                <p class="price">
                    ${product.price.toLocaleString("fr-FR")}
                    FCFA
                </p>


                <div class="quantity-selector">

                    <button
                        id="decrease"
                        type="button"
                    >
                        -
                    </button>


                    <span id="quantity">
                        1
                    </span>


                    <button
                        id="increase"
                        type="button"
                    >
                        +
                    </button>

                </div>


                <button
                    id="addToCart"
                    type="button"
                >
                    Ajouter au panier
                </button>

            </div>

        </div>

    `;


    // ==========================
    // BOUTONS
    // ==========================

    const increaseButton =
        document.getElementById("increase");


    const decreaseButton =
        document.getElementById("decrease");


    const quantityDisplay =
        document.getElementById("quantity");


    const addToCartButton =
        document.getElementById("addToCart");


    // ==========================
    // AUGMENTER
    // ==========================

    increaseButton.addEventListener(
        "click",
        function() {

            quantity++;

            quantityDisplay.textContent =
                quantity;

        }
    );


    // ==========================
    // DIMINUER
    // ==========================

    decreaseButton.addEventListener(
        "click",
        function() {

            if (quantity > 1) {

                quantity--;

                quantityDisplay.textContent =
                    quantity;

            }

        }
    );


    // ==========================
    // AJOUTER AU PANIER
    // ==========================

    addToCartButton.addEventListener(
        "click",
        function() {

            const existingProduct =
                cart.find(function(item) {

                    return item.id === product.id;

                });


            if (existingProduct) {

                existingProduct.quantity += quantity;

            } else {

                cart.push({

                    ...product,

                    quantity: quantity

                });

            }


            // ==========================
            // SAUVEGARDER
            // ==========================

            localStorage.setItem(
                "cart",
                JSON.stringify(cart)
            );


            alert(
                "Produit ajouté au panier !"
            );

        }
    );

}
