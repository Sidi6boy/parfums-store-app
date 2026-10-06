// ==================================================
// RÉCUPÉRER LE PANIER
// ==================================================

let cart =
    JSON.parse(localStorage.getItem("cart")) || [];


// ==================================================
// ÉLÉMENTS HTML
// ==================================================

const orderItems =
    document.getElementById("orderItems");

const subtotalElement =
    document.getElementById("subtotal");

const deliveryPriceElement =
    document.getElementById("deliveryPrice");

const orderTotalElement =
    document.getElementById("orderTotal");

const orderForm =
    document.getElementById("orderForm");


// ==================================================
// URL DU BACKEND
// ==================================================

const API_URL =
    "http://localhost:3000";


// ==================================================
// FORMATAGE DU PRIX
// ==================================================

function formatPrice(price) {

    return Number(price).toLocaleString("fr-FR")
        + " FCFA";

}


// ==================================================
// CALCULER LE SOUS-TOTAL
// ==================================================

function calculateSubtotal() {

    return cart.reduce(
        function(total, product) {

            return total +
                (
                    Number(product.price) *
                    Number(product.quantity)
                );

        },
        0
    );

}


// ==================================================
// RÉCUPÉRER LE PRIX DE LIVRAISON
// ==================================================

function getDeliveryPrice() {

    const selectedDelivery =
        document.querySelector(
            'input[name="delivery"]:checked'
        );


    if (!selectedDelivery) {

        return 0;

    }


    return Number(
        selectedDelivery.dataset.price
    );

}


// ==================================================
// VALIDATION DU NOM
// ==================================================

function validateName(value) {

    const nameRegex =
        /^[A-Za-zÀ-ÿ\s'-]{2,}$/;

    return nameRegex.test(value);

}


// ==================================================
// VALIDATION DU TÉLÉPHONE
// ==================================================

function validatePhone(value) {

    const phoneRegex =
        /^[0-9\s+()-]{8,20}$/;

    return phoneRegex.test(value);

}


// ==================================================
// VALIDATION DE LA VILLE
// ==================================================

function validateCity(value) {

    const cityRegex =
        /^[A-Za-zÀ-ÿ\s'-]{2,}$/;

    return cityRegex.test(value);

}


// ==================================================
// VALIDATION DE L'ADRESSE
// ==================================================

function validateAddress(value) {

    return value.length >= 5;

}


// ==================================================
// AFFICHER UNE ERREUR
// ==================================================

function showError(
    input,
    errorElement,
    message
) {

    input.classList.add("error");

    input.classList.remove("valid");

    errorElement.textContent =
        message;

}


// ==================================================
// EFFACER UNE ERREUR
// ==================================================

function clearError(
    input,
    errorElement
) {

    input.classList.remove("error");

    input.classList.add("valid");

    errorElement.textContent = "";

}


// ==================================================
// METTRE À JOUR LES TOTAUX
// ==================================================

function updateTotals() {

    const subtotal =
        calculateSubtotal();

    const delivery =
        getDeliveryPrice();

    const total =
        subtotal + delivery;


    subtotalElement.textContent =
        formatPrice(subtotal);


    if (delivery === 0) {

        deliveryPriceElement.textContent =
            "Gratuit";

    } else {

        deliveryPriceElement.textContent =
            formatPrice(delivery);

    }


    orderTotalElement.textContent =
        formatPrice(total);

}


// ==================================================
// AFFICHER LE RÉCAPITULATIF
// ==================================================

function displayOrder() {

    orderItems.innerHTML = "";


    // ------------------------------------------------
    // PANIER VIDE
    // ------------------------------------------------

    if (cart.length === 0) {

        orderItems.innerHTML = `

            <div class="empty-order">

                <p>
                    Votre panier est vide.
                </p>

                <a href="index.html">
                    Retourner à la boutique
                </a>

            </div>

        `;


        subtotalElement.textContent =
            "0 FCFA";

        deliveryPriceElement.textContent =
            "Gratuit";

        orderTotalElement.textContent =
            "0 FCFA";

        return;

    }


    // ------------------------------------------------
    // AFFICHER LES PRODUITS
    // ------------------------------------------------

    cart.forEach(function(product) {

        const item =
            document.createElement("div");


        item.classList.add(
            "order-item"
        );


        const subtotal =
            Number(product.price) *
            Number(product.quantity);


        item.innerHTML = `

            <div class="order-item-image">

                <img
                    src="${product.image}"
                    alt="${product.name}"
                >

            </div>


            <div class="order-item-info">

                <h3>
                    ${product.name}
                </h3>

                <p>
                    Quantité :
                    ${product.quantity}
                </p>

            </div>


            <div class="order-item-price">

                ${formatPrice(subtotal)}

            </div>

        `;


        orderItems.appendChild(item);

    });


    updateTotals();

}


// ==================================================
// CHANGEMENT DU MODE DE LIVRAISON
// ==================================================

const deliveryInputs =
    document.querySelectorAll(
        'input[name="delivery"]'
    );


deliveryInputs.forEach(
    function(input) {

        input.addEventListener(
            "change",
            updateTotals
        );

    }
);


// ==================================================
// ENVOYER LA COMMANDE AU BACKEND
// ==================================================

async function sendOrder(orderData) {

    const response =
        await fetch(
            `${API_URL}/api/orders`,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body:
                    JSON.stringify(orderData)
            }
        );


    let data;


    try {

        data =
            await response.json();

    } catch (error) {

        throw new Error(
            "Le serveur a retourné une réponse invalide."
        );

    }


    if (!response.ok) {

        throw new Error(
            data.message ||
            "Impossible d'enregistrer la commande."
        );

    }


    return data;

}


// ==================================================
// SOUMISSION DU FORMULAIRE
// ==================================================

orderForm.addEventListener(
    "submit",
    async function(event) {

        event.preventDefault();


        // ------------------------------------------------
        // VÉRIFIER LE PANIER
        // ------------------------------------------------

        if (cart.length === 0) {

            alert(
                "Votre panier est vide."
            );

            window.location.href =
                "index.html";

            return;

        }


        // ------------------------------------------------
        // RÉCUPÉRER LES INPUTS
        // ------------------------------------------------

        const firstNameInput =
            document.getElementById("firstName");

        const lastNameInput =
            document.getElementById("lastName");

        const phoneInput =
            document.getElementById("phone");

        const cityInput =
            document.getElementById("city");

        const addressInput =
            document.getElementById("address");


        // ------------------------------------------------
        // RÉCUPÉRER LES ERREURS
        // ------------------------------------------------

        const firstNameError =
            document.getElementById(
                "firstNameError"
            );

        const lastNameError =
            document.getElementById(
                "lastNameError"
            );

        const phoneError =
            document.getElementById(
                "phoneError"
            );

        const cityError =
            document.getElementById(
                "cityError"
            );

        const addressError =
            document.getElementById(
                "addressError"
            );


        // ------------------------------------------------
        // VALEURS
        // ------------------------------------------------

        const firstName =
            firstNameInput.value.trim();

        const lastName =
            lastNameInput.value.trim();

        const phone =
            phoneInput.value.trim();

        const city =
            cityInput.value.trim();

        const address =
            addressInput.value.trim();


        // ------------------------------------------------
        // VALIDATION
        // ------------------------------------------------

        let isValid = true;


        // PRÉNOM

        if (!validateName(firstName)) {

            showError(
                firstNameInput,
                firstNameError,
                "Veuillez entrer un prénom valide."
            );

            isValid = false;

        } else {

            clearError(
                firstNameInput,
                firstNameError
            );

        }


        // NOM

        if (!validateName(lastName)) {

            showError(
                lastNameInput,
                lastNameError,
                "Veuillez entrer un nom valide."
            );

            isValid = false;

        } else {

            clearError(
                lastNameInput,
                lastNameError
            );

        }


        // TÉLÉPHONE

        if (!validatePhone(phone)) {

            showError(
                phoneInput,
                phoneError,
                "Veuillez entrer un numéro de téléphone valide."
            );

            isValid = false;

        } else {

            clearError(
                phoneInput,
                phoneError
            );

        }


        // VILLE

        if (!validateCity(city)) {

            showError(
                cityInput,
                cityError,
                "Veuillez entrer une ville valide."
            );

            isValid = false;

        } else {

            clearError(
                cityInput,
                cityError
            );

        }


        // ADRESSE

        if (!validateAddress(address)) {

            showError(
                addressInput,
                addressError,
                "L'adresse doit contenir au moins 5 caractères."
            );

            isValid = false;

        } else {

            clearError(
                addressInput,
                addressError
            );

        }


        // ------------------------------------------------
        // ARRÊTER S'IL Y A UNE ERREUR
        // ------------------------------------------------

        if (!isValid) {

            return;

        }


        // ------------------------------------------------
        // LIVRAISON
        // ------------------------------------------------

        const delivery =
            document.querySelector(
                'input[name="delivery"]:checked'
            );


        if (!delivery) {

            alert(
                "Veuillez sélectionner un mode de livraison."
            );

            return;

        }


        // ------------------------------------------------
        // PRIX DE LIVRAISON
        // ------------------------------------------------

        const deliveryPrice =
            Number(
                delivery.dataset.price
            );


        if (
            !Number.isFinite(deliveryPrice) ||
            deliveryPrice < 0
        ) {

            alert(
                "Le prix de livraison est invalide."
            );

            return;

        }


        // ------------------------------------------------
        // PRODUITS
        // ------------------------------------------------

        const orderProducts =
            cart.map(
                function(product) {

                    return {

                        id:
                            Number(product.id),

                        quantity:
                            Number(product.quantity)

                    };

                }
            );


        // ------------------------------------------------
        // VÉRIFIER LES QUANTITÉS
        // ------------------------------------------------

        const invalidQuantity =
            orderProducts.some(
                function(product) {

                    return (
                        !Number.isInteger(
                            product.id
                        ) ||
                        product.id <= 0 ||
                        !Number.isInteger(
                            product.quantity
                        ) ||
                        product.quantity <= 0
                    );

                }
            );


        if (invalidQuantity) {

            alert(
                "Une quantité de produit est invalide."
            );

            return;

        }


        // ------------------------------------------------
        // DONNÉES DE LA COMMANDE
        // ------------------------------------------------

        const orderData = {

            customer: {

                firstName:
                    firstName,

                lastName:
                    lastName,

                phone:
                    phone,

                city:
                    city,

                address:
                    address

            },

            delivery: {

                type:
                    delivery.value,

                price:
                    deliveryPrice

            },

            products:
                orderProducts

        };


        // ------------------------------------------------
        // BOUTON
        // ------------------------------------------------

        const submitButton =
            orderForm.querySelector(
                'button[type="submit"]'
            );


        if (submitButton) {

            submitButton.disabled = true;

            submitButton.textContent =
                "Enregistrement...";

        }


        // ------------------------------------------------
        // ENVOYER LA COMMANDE
        // ------------------------------------------------

        try {

            const result =
                await sendOrder(orderData);


            // ------------------------------------------------
            // VÉRIFIER LA RÉPONSE
            // ------------------------------------------------

            if (
                !result ||
                !result.order
            ) {

                throw new Error(
                    "Réponse du serveur invalide."
                );

            }


            // ------------------------------------------------
            // CRÉER LA COMMANDE LOCALE
            // ------------------------------------------------

            const order = {

                id:
                    result.order.id,

                number:
                    result.order.number,

                customer:
                    orderData.customer,

                delivery: {

                    type:
                        orderData.delivery.type,

                    price:
                        result.order.deliveryPrice

                },

                products:
                    cart,

                subtotal:
                    result.order.subtotal,

                total:
                    result.order.total,

                payment: {

                    method:
                        result.order.paymentMethod ||
                        "mobile_money",

                    status:
                        result.order.paymentStatus ||
                        "pending",

                    reference:
                        result.order.paymentReference ||
                        null

                },

                date:
                    new Date().toISOString()

            };


            // ------------------------------------------------
            // SAUVEGARDER LA COMMANDE
            // ------------------------------------------------

            localStorage.setItem(
                "lastOrder",
                JSON.stringify(order)
            );


            // ------------------------------------------------
            // VIDER LE PANIER
            // ------------------------------------------------

            localStorage.removeItem(
                "cart"
            );


            // Mettre à jour la variable locale

            cart = [];


            // ------------------------------------------------
            // REDIRECTION
            // ------------------------------------------------

            window.location.href =
                "confirmation.html";


        } catch (error) {

            console.error(
                "Erreur lors de l'envoi de la commande :",
                error
            );


            alert(
                error.message ||
                "Impossible d'enregistrer la commande. Vérifiez que le serveur est démarré puis réessayez."
            );


            // ------------------------------------------------
            // RÉACTIVER LE BOUTON
            // ------------------------------------------------

            if (submitButton) {

                submitButton.disabled = false;

                submitButton.textContent =
                    "Confirmer la commande";

            }

        }

    }
);


// ==================================================
// LANCEMENT
// ==================================================

displayOrder();
