// ==========================
// PRODUITS
// ==========================

let products = [];


// ==========================
// ÉLÉMENTS HTML
// ==========================

const productsContainer =
    document.getElementById("products");

const cartItems =
    document.getElementById("cartItems");

const cartTotal =
    document.getElementById("cartTotal");

const cartCount =
    document.getElementById("cartCount");

const searchInput =
    document.getElementById("searchInput");

const categoryFilter =
    document.getElementById("categoryFilter");

const cartPanel =
    document.getElementById("cartPanel");

const cartOverlay =
    document.getElementById("cartOverlay");

const openCartButton =
    document.getElementById("openCart");

const closeCartButton =
    document.getElementById("closeCart");

const checkoutButton =
    document.getElementById("checkoutButton");


// ==========================
// FORMAT PRIX
// ==========================

function formatPrice(price) {

    return Number(price).toLocaleString("fr-FR")
        + " FCFA";

}


// ==========================
// METTRE À JOUR LE NOMBRE
// D'ARTICLES DU PANIER
// ==========================

function updateCartCount() {

    cartCount.textContent =
        getCartCount();

}


// ==========================
// OUVRIR LE PANIER
// ==========================

function openCart() {

    cartPanel.classList.add("active");

    cartOverlay.classList.add("active");

    document.body.style.overflow = "hidden";

}


// ==========================
// FERMER LE PANIER
// ==========================

function closeCart() {

    cartPanel.classList.remove("active");

    cartOverlay.classList.remove("active");

    document.body.style.overflow = "";

}


// ==========================
// AFFICHER LES PRODUITS
// ==========================

function displayProducts(productsToDisplay) {

    productsContainer.innerHTML = "";


    // ==========================
    // AUCUN PRODUIT
    // ==========================

    if (productsToDisplay.length === 0) {

        productsContainer.innerHTML = `

            <p class="no-products">
                Aucun produit trouvé.
            </p>

        `;

        return;

    }


    // ==========================
    // AFFICHER CHAQUE PRODUIT
    // ==========================

    productsToDisplay.forEach(function(product) {

        const article =
            document.createElement("article");


        article.classList.add("product");


        article.innerHTML = `

            <div class="product-image">

                <img
                    src="${product.image}"
                    alt="${product.name}"
                >

            </div>


            <h2>
                ${product.name}
            </h2>


            <p>
                ${product.description}
            </p>


            <p>
                Catégorie :
                ${product.category}
            </p>


            <p class="price">
                ${formatPrice(product.price)}
            </p>


            <button
                class="add-to-cart"
                type="button"
            >
                Ajouter au panier
            </button>


            <button
                class="view-product"
                type="button"
            >
                Voir le produit
            </button>

        `;


        // ==========================
        // BOUTON AJOUTER AU PANIER
        // ==========================

        const addButton =
            article.querySelector(".add-to-cart");


        addButton.addEventListener(
            "click",
            function() {

                addProductToCart(product);

            }
        );


        // ==========================
        // BOUTON VOIR LE PRODUIT
        // ==========================

        const viewButton =
            article.querySelector(".view-product");


        viewButton.addEventListener(
            "click",
            function() {

                window.location.href =
                    `produit.html?id=${product.id}`;

            }
        );


        productsContainer.appendChild(article);

    });

}


// ==========================
// AJOUTER UN PRODUIT
// AU PANIER
// ==========================

function addProductToCart(product) {

    addToCart(product);

    displayCart();

    updateCartCount();

    openCart();

}


// ==========================
// FILTRER LES PRODUITS
// ==========================

function filterProducts() {

    const searchValue =
        searchInput.value
            .trim()
            .toLowerCase();


    const selectedCategory =
        categoryFilter.value;


    const filteredProducts =
        products.filter(function(product) {

            const text = `
                ${product.name}
                ${product.description}
                ${product.category}
            `.toLowerCase();


            const matchesSearch =
                text.includes(searchValue);


            const matchesCategory =
                selectedCategory === "all" ||
                product.category === selectedCategory;


            return (
                matchesSearch &&
                matchesCategory
            );

        });


    displayProducts(filteredProducts);

}


// ==========================
// AFFICHER LE PANIER
// ==========================

function displayCart() {

    cartItems.innerHTML = "";


    // ==========================
    // PANIER VIDE
    // ==========================

    if (cart.length === 0) {

        cartItems.innerHTML = `

            <div class="empty-cart">

                <div class="empty-cart-icon">
                    🛒
                </div>

                <p>
                    Votre panier est actuellement vide.
                </p>

            </div>

        `;


        cartTotal.textContent =
            "0 FCFA";


        updateCartCount();

        return;

    }


    // ==========================
    // PRODUITS DU PANIER
    // ==========================

    cart.forEach(function(product) {

        const item =
            document.createElement("div");


        item.classList.add("cart-item");


        const subtotal =
            Number(product.price) *
            product.quantity;


        item.innerHTML = `

            <h3>
                ${product.name}
            </h3>


            <p>
                Prix unitaire :
                ${formatPrice(product.price)}
            </p>


            <div class="quantity-controls">

                <button
                    class="decrease"
                    type="button"
                    aria-label="Diminuer la quantité"
                >
                    −
                </button>


                <span>
                    ${product.quantity}
                </span>


                <button
                    class="increase"
                    type="button"
                    aria-label="Augmenter la quantité"
                >
                    +
                </button>

            </div>


            <p>
                Sous-total :
                ${formatPrice(subtotal)}
            </p>


            <button
                class="remove"
                type="button"
            >
                Supprimer
            </button>

        `;


        // ==========================
        // AUGMENTER
        // ==========================

        const increaseButton =
            item.querySelector(".increase");


        increaseButton.addEventListener(
            "click",
            function() {

                increaseQuantity(product.id);

                displayCart();

                updateCartCount();

            }
        );


        // ==========================
        // DIMINUER
        // ==========================

        const decreaseButton =
            item.querySelector(".decrease");


        decreaseButton.addEventListener(
            "click",
            function() {

                decreaseQuantity(product.id);

                displayCart();

                updateCartCount();

            }
        );


        // ==========================
        // SUPPRIMER
        // ==========================

        const removeButton =
            item.querySelector(".remove");


        removeButton.addEventListener(
            "click",
            function() {

                removeFromCart(product.id);

                displayCart();

                updateCartCount();

            }
        );


        cartItems.appendChild(item);

    });


    // ==========================
    // TOTAL
    // ==========================

    cartTotal.textContent =
        formatPrice(getCartTotal());


    updateCartCount();

}


// ==========================
// RÉCUPÉRER LES PRODUITS
// DEPUIS L'API
// ==========================

async function loadProducts() {

    try {

        const response =
            await fetch(
                "http://localhost:3000/api/products"
            );


        if (!response.ok) {

            throw new Error(
                `Erreur HTTP : ${response.status}`
            );

        }


        const data =
            await response.json();


        // ==========================
        // STOCKER LES PRODUITS
        // ==========================

        products = data;


        // ==========================
        // AFFICHER LES PRODUITS
        // ==========================

        displayProducts(products);


    } catch (error) {

        console.error(
            "Erreur lors du chargement des produits :",
            error
        );


        productsContainer.innerHTML = `

            <p class="no-products">

                Impossible de charger les produits.

                <br>

                Vérifiez que le serveur est démarré.

            </p>

        `;

    }

}


// ==========================
// ÉVÉNEMENTS DU PANIER
// ==========================

openCartButton.addEventListener(
    "click",
    openCart
);


closeCartButton.addEventListener(
    "click",
    closeCart
);


cartOverlay.addEventListener(
    "click",
    closeCart
);


// ==========================
// TOUCHE ESCAPE
// ==========================

document.addEventListener(
    "keydown",
    function(event) {

        if (event.key === "Escape") {

            closeCart();

        }

    }
);


// ==========================
// RECHERCHE
// ==========================

searchInput.addEventListener(
    "input",
    filterProducts
);


// ==========================
// FILTRE CATÉGORIE
// ==========================

categoryFilter.addEventListener(
    "change",
    filterProducts
);


// ==========================
// BOUTON PASSER LA COMMANDE
// ==========================

checkoutButton.addEventListener(
    "click",
    function() {

        if (cart.length === 0) {

            alert(
                "Votre panier est vide."
            );

            return;

        }


        window.location.href =
            "commande.html";

    }
);


// ==========================
// LANCEMENT
// ==========================

displayCart();

updateCartCount();

loadProducts();