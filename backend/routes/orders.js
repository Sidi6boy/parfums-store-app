const express = require("express");
const db = require("../db");

const router = express.Router();


// ==================================================
// STATUTS DE COMMANDE
// ==================================================

const DEFAULT_ORDER_STATUS = "pending";


// ==================================================
// MOYENS DE PAIEMENT
// ==================================================

const allowedPaymentMethods = [
    "mobile_money"
];


// ==================================================
// CRÉER UNE COMMANDE
// POST /api/orders
// ==================================================

router.post("/", async function (req, res) {

    let connection;

    try {

        // ==================================================
        // RÉCUPÉRER LES DONNÉES
        // ==================================================

        const {
            customer,
            delivery,
            products
        } = req.body;


        // ==================================================
        // VÉRIFIER LES DONNÉES CLIENT
        // ==================================================

        if (
            !customer ||
            typeof customer !== "object"
        ) {

            return res.status(400).json({

                message:
                    "Les informations client sont obligatoires."

            });

        }


        const {
            firstName,
            lastName,
            phone,
            city,
            address
        } = customer;


        if (
            typeof firstName !== "string" ||
            firstName.trim() === ""
        ) {

            return res.status(400).json({

                message:
                    "Le prénom est obligatoire."

            });

        }


        if (
            typeof lastName !== "string" ||
            lastName.trim() === ""
        ) {

            return res.status(400).json({

                message:
                    "Le nom est obligatoire."

            });

        }


        if (
            typeof phone !== "string" ||
            phone.trim() === ""
        ) {

            return res.status(400).json({

                message:
                    "Le numéro de téléphone est obligatoire."

            });

        }


        if (
            typeof city !== "string" ||
            city.trim() === ""
        ) {

            return res.status(400).json({

                message:
                    "La ville est obligatoire."

            });

        }


        if (
            typeof address !== "string" ||
            address.trim().length < 5
        ) {

            return res.status(400).json({

                message:
                    "L'adresse est invalide."

            });

        }


        // ==================================================
        // VÉRIFIER LA LIVRAISON
        // ==================================================

        if (
            !delivery ||
            typeof delivery !== "object"
        ) {

            return res.status(400).json({

                message:
                    "Le mode de livraison est obligatoire."

            });

        }


        const deliveryType =
            delivery.type;


        if (
            deliveryType !== "standard" &&
            deliveryType !== "express"
        ) {

            return res.status(400).json({

                message:
                    "Mode de livraison invalide."

            });

        }


        // ==================================================
        // CALCULER LE PRIX DE LIVRAISON
        // CÔTÉ SERVEUR
        // ==================================================

        let deliveryPrice = 0;


        if (deliveryType === "express") {

            deliveryPrice = 2000;

        }


        // ==================================================
        // VÉRIFIER LES PRODUITS
        // ==================================================

        if (
            !Array.isArray(products) ||
            products.length === 0
        ) {

            return res.status(400).json({

                message:
                    "La commande doit contenir au moins un produit."

            });

        }


        // ==================================================
        // NETTOYER LES PRODUITS
        // ==================================================

        const cleanProducts = [];


        for (const product of products) {

            const productId =
                Number(product.id);

            const quantity =
                Number(product.quantity);


            if (
                !Number.isInteger(productId) ||
                productId <= 0
            ) {

                return res.status(400).json({

                    message:
                        "Identifiant produit invalide."

                });

            }


            if (
                !Number.isInteger(quantity) ||
                quantity <= 0 ||
                quantity > 100
            ) {

                return res.status(400).json({

                    message:
                        "Quantité de produit invalide."

                });

            }


            cleanProducts.push({

                id:
                    productId,

                quantity:
                    quantity

            });

        }


        // ==================================================
        // ÉVITER LES DOUBLONS DE PRODUITS
        // ==================================================

        const productIds =
            cleanProducts.map(
                function(product) {

                    return product.id;

                }
            );


        const uniqueProductIds =
            [...new Set(productIds)];


        if (
            uniqueProductIds.length !==
            productIds.length
        ) {

            return res.status(400).json({

                message:
                    "Un même produit ne peut pas apparaître plusieurs fois dans la commande."

            });

        }


        // ==================================================
        // CONNEXION TRANSACTIONNELLE
        // ==================================================

        connection =
            await db.getConnection();


        await connection.beginTransaction();


        // ==================================================
        // RÉCUPÉRER LES PRIX DEPUIS MYSQL
        // ==================================================

        const placeholders =
            uniqueProductIds
                .map(function() {

                    return "?";

                })
                .join(",");


        const [databaseProducts] =
            await connection.query(

                `SELECT
                    id,
                    name,
                    price,
                    category,
                    description,
                    image
                 FROM products
                 WHERE id IN (${placeholders})`,

                uniqueProductIds

            );


        // ==================================================
        // VÉRIFIER QUE TOUS LES PRODUITS EXISTENT
        // ==================================================

        if (
            databaseProducts.length !==
            uniqueProductIds.length
        ) {

            await connection.rollback();

            return res.status(400).json({

                message:
                    "Un ou plusieurs produits n'existent plus."

            });

        }


        // ==================================================
        // CALCULER LE SOUS-TOTAL
        // ==================================================

        let subtotal = 0;

        const orderItems = [];


        for (const requestedProduct of cleanProducts) {

            const databaseProduct =
                databaseProducts.find(
                    function(product) {

                        return product.id ===
                            requestedProduct.id;

                    }
                );


            if (!databaseProduct) {

                await connection.rollback();

                return res.status(400).json({

                    message:
                        "Produit introuvable."

                });

            }


            const itemSubtotal =
                Number(databaseProduct.price) *
                requestedProduct.quantity;


            subtotal += itemSubtotal;


            orderItems.push({

                productId:
                    databaseProduct.id,

                productName:
                    databaseProduct.name,

                price:
                    Number(databaseProduct.price),

                quantity:
                    requestedProduct.quantity,

                subtotal:
                    itemSubtotal

            });

        }


        // ==================================================
        // TOTAL
        // ==================================================

        const total =
            subtotal +
            deliveryPrice;


        // ==================================================
        // NUMÉRO DE COMMANDE
        // ==================================================

        const orderNumber =
            "CMD-" +
            Date.now() +
            "-" +
            Math.floor(
                1000 +
                Math.random() * 9000
            );


        // ==================================================
        // PAIEMENT
        // ==================================================

        const paymentMethod =
            "mobile_money";

        const paymentStatus =
            "pending";


        // ==================================================
        // CRÉER LA COMMANDE
        // ==================================================

        const [orderResult] =
            await connection.execute(

                `INSERT INTO orders (
                    order_number,
                    first_name,
                    last_name,
                    phone,
                    city,
                    address,
                    delivery_type,
                    delivery_price,
                    subtotal,
                    total,
                    status,
                    payment_method,
                    payment_status
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,

                [
                    orderNumber,
                    firstName.trim(),
                    lastName.trim(),
                    phone.trim(),
                    city.trim(),
                    address.trim(),
                    deliveryType,
                    deliveryPrice,
                    subtotal,
                    total,
                    DEFAULT_ORDER_STATUS,
                    paymentMethod,
                    paymentStatus
                ]

            );


        const orderId =
            orderResult.insertId;


        // ==================================================
        // CRÉER LES PRODUITS DE LA COMMANDE
        // ==================================================

        for (const item of orderItems) {

            await connection.execute(

                `INSERT INTO order_items (
                    order_id,
                    product_id,
                    product_name,
                    price,
                    quantity,
                    subtotal
                )
                VALUES (?, ?, ?, ?, ?, ?)`,

                [
                    orderId,
                    item.productId,
                    item.productName,
                    item.price,
                    item.quantity,
                    item.subtotal
                ]

            );

        }


        // ==================================================
        // VALIDER LA TRANSACTION
        // ==================================================

        await connection.commit();


        // ==================================================
        // RÉPONSE
        // ==================================================

        res.status(201).json({

            message:
                "Commande créée avec succès.",

            order: {

                id:
                    orderId,

                number:
                    orderNumber,

                subtotal:
                    subtotal,

                deliveryPrice:
                    deliveryPrice,

                total:
                    total,

                status:
                    DEFAULT_ORDER_STATUS,

                payment: {

                    method:
                        paymentMethod,

                    status:
                        paymentStatus

                }

            }

        });

    } catch (error) {

        // ==================================================
        // ANNULER LA TRANSACTION
        // ==================================================

        if (connection) {

            try {

                await connection.rollback();

            } catch (rollbackError) {

                console.error(
                    "Erreur rollback :",
                    rollbackError
                );

            }

        }


        console.error(
            "Erreur lors de la création de la commande :",
            error
        );


        res.status(500).json({

            message:
                "Erreur serveur lors de la création de la commande."

        });

    } finally {

        // ==================================================
        // LIBÉRER LA CONNEXION
        // ==================================================

        if (connection) {

            connection.release();

        }

    }

});


module.exports = router;

