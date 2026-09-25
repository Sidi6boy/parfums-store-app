// ==========================
// RÉCUPÉRER LE PANIER
// ==========================

let cart =
    JSON.parse(localStorage.getItem("cart")) || [];


// ==========================
// SAUVEGARDER LE PANIER
// ==========================

function saveCart() {

    localStorage.setItem(
        "cart",
        JSON.stringify(cart)
    );

}


// ==========================
// AJOUTER AU PANIER
// ==========================

function addToCart(product, quantity = 1) {

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


    saveCart();

}


// ==========================
// SUPPRIMER DU PANIER
// ==========================

function removeFromCart(productId) {

    cart =
        cart.filter(function(product) {

            return product.id !== productId;

        });


    saveCart();

}


// ==========================
// AUGMENTER LA QUANTITÉ
// ==========================

function increaseQuantity(productId) {

    const product =
        cart.find(function(item) {

            return item.id === productId;

        });


    if (!product) {

        return;

    }


    product.quantity++;

    saveCart();

}


// ==========================
// DIMINUER LA QUANTITÉ
// ==========================

function decreaseQuantity(productId) {

    const product =
        cart.find(function(item) {

            return item.id === productId;

        });


    if (!product) {

        return;

    }


    product.quantity--;


    if (product.quantity <= 0) {

        removeFromCart(productId);

        return;

    }


    saveCart();

}


// ==========================
// CALCULER LE TOTAL
// ==========================

function getCartTotal() {

    return cart.reduce(
        function(total, product) {

            return total +
                (
                    product.price *
                    product.quantity
                );

        },
        0
    );

}


// ==========================
// CALCULER LE NOMBRE
// D'ARTICLES
// ==========================

function getCartCount() {

    return cart.reduce(
        function(total, product) {

            return total +
                product.quantity;

        },
        0
    );

}
