const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("./db");

const authMiddleware = require("./middleware/authMiddleware");

const adminProductsRouter =
    require("./routes/adminProducts");

const adminOrdersRouter =
    require("./routes/adminOrders");

const adminDashboardRouter =
    require("./routes/adminDashboard");


const app = express();


// ==================================================
// CONFIGURATION
// ==================================================

const PORT =
    process.env.PORT || 3000;


// ==================================================
// MIDDLEWARE
// ==================================================

app.use(
    cors({
        origin: true,
        credentials: true
    })
);

app.use(
    express.json({
        limit: "1mb"
    })
);

app.use(
    express.urlencoded({
        extended: true,
        limit: "1mb"
    })
);


// ==================================================
// ROUTE PRINCIPALE
// ==================================================

app.get("/", function (req, res) {

    res.status(200).json({

        message:
            "Bienvenue sur l'API de Parfums Store",

        status:
            "OK",

        environment:
            process.env.NODE_ENV || "development"

    });

});


// ==================================================
// HEALTH CHECK
// ==================================================

app.get("/api/health", async function (req, res) {

    try {

        await db.query("SELECT 1");

        res.status(200).json({

            status:
                "OK",

            database:
                "connected",

            timestamp:
                new Date().toISOString()

        });

    } catch (error) {

        console.error(
            "Erreur health check :",
            error
        );

        res.status(500).json({

            status:
                "ERROR",

            database:
                "disconnected"

        });

    }

});


// ==================================================
// RÉCUPÉRER LES PRODUITS
// GET /api/products
// ROUTE PUBLIQUE
// ==================================================

app.get(
    "/api/products",
    async function (req, res) {

        try {

            const [products] =
                await db.query(

                    `SELECT
                        id,
                        name,
                        price,
                        category,
                        description,
                        image,
                        created_at
                     FROM products
                     ORDER BY id ASC`

                );


            res.status(200).json(
                products
            );


        } catch (error) {

            console.error(
                "Erreur lors de la récupération des produits :",
                error
            );


            res.status(500).json({

                message:
                    "Erreur serveur lors de la récupération des produits."

            });

        }

    }
);


// ==================================================
// CONNEXION ADMINISTRATEUR
// POST /api/admin/login
// ==================================================

app.post(
    "/api/admin/login",
    async function (req, res) {

        try {

            const {
                username,
                password
            } = req.body;


            // ------------------------------------------
            // VALIDATION
            // ------------------------------------------

            if (
                typeof username !== "string" ||
                typeof password !== "string" ||
                username.trim() === "" ||
                password === ""
            ) {

                return res.status(400).json({

                    message:
                        "Nom d'utilisateur et mot de passe obligatoires."

                });

            }


            // ------------------------------------------
            // RECHERCHE ADMIN
            // ------------------------------------------

            const [admins] =
                await db.query(

                    `SELECT
                        id,
                        username,
                        email,
                        password_hash
                     FROM admins
                     WHERE username = ?
                     LIMIT 1`,

                    [
                        username.trim()
                    ]

                );


            if (admins.length === 0) {

                return res.status(401).json({

                    message:
                        "Identifiants incorrects."

                });

            }


            const admin =
                admins[0];


            // ------------------------------------------
            // VÉRIFICATION MOT DE PASSE
            // ------------------------------------------

            const passwordCorrect =
                await bcrypt.compare(
                    password,
                    admin.password_hash
                );


            if (!passwordCorrect) {

                return res.status(401).json({

                    message:
                        "Identifiants incorrects."

                });

            }


            // ------------------------------------------
            // JWT SECRET
            // ------------------------------------------

            if (
                !process.env.JWT_SECRET
            ) {

                console.error(
                    "JWT_SECRET n'est pas défini."
                );


                return res.status(500).json({

                    message:
                        "Configuration serveur incomplète."

                });

            }


            // ------------------------------------------
            // CRÉER TOKEN
            // ------------------------------------------

            const token =
                jwt.sign(

                    {
                        id:
                            admin.id,

                        username:
                            admin.username,

                        email:
                            admin.email

                    },

                    process.env.JWT_SECRET,

                    {
                        expiresIn:
                            "2h"
                    }

                );


            // ------------------------------------------
            // RÉPONSE
            // ------------------------------------------

            res.status(200).json({

                message:
                    "Connexion administrateur réussie.",

                token:
                    token,

                admin: {

                    id:
                        admin.id,

                    username:
                        admin.username,

                    email:
                        admin.email

                }

            });


        } catch (error) {

            console.error(
                "Erreur lors de la connexion administrateur :",
                error
            );


            res.status(500).json({

                message:
                    "Erreur serveur lors de la connexion administrateur."

            });

        }

    }
);


// ==================================================
// ADMIN CONNECTÉ
// GET /api/admin/me
// ==================================================

app.get(
    "/api/admin/me",
    authMiddleware,
    function (req, res) {

        res.status(200).json({

            message:
                "Authentification administrateur valide.",

            admin:
                req.admin

        });

    }
);


// ==================================================
// ROUTES ADMIN PRODUITS
// ==================================================

app.use(
    "/api/admin/products",
    adminProductsRouter
);


// ==================================================
// ROUTES ADMIN COMMANDES
// ==================================================

app.use(
    "/api/admin/orders",
    adminOrdersRouter
);


// ==================================================
// ROUTES ADMIN DASHBOARD
// ==================================================

app.use(
    "/api/admin/dashboard",
    adminDashboardRouter
);


// ==================================================
// CRÉER UNE COMMANDE
// POST /api/orders
// ROUTE PUBLIQUE
// ==================================================

app.post(
    "/api/orders",
    async function (req, res) {

        let connection;


        try {

            connection =
                await db.getConnection();


            const {
                customer,
                delivery,
                products,
                payment
            } = req.body;


            // ------------------------------------------
            // VALIDATION STRUCTURE
            // ------------------------------------------

            if (
                !customer ||
                typeof customer !== "object" ||

                !delivery ||
                typeof delivery !== "object" ||

                !Array.isArray(products)
            ) {

                return res.status(400).json({

                    message:
                        "Données de commande invalides."

                });

            }


            if (
                products.length === 0
            ) {

                return res.status(400).json({

                    message:
                        "La commande doit contenir au moins un produit."

                });

            }


            // ------------------------------------------
            // VALIDATION CLIENT
            // ------------------------------------------

            const requiredCustomerFields = [

                "firstName",
                "lastName",
                "phone",
                "city",
                "address"

            ];


            for (
                const field
                of requiredCustomerFields
            ) {

                if (
                    typeof customer[field] !== "string" ||
                    customer[field].trim() === ""
                ) {

                    return res.status(400).json({

                        message:
                            `Le champ client "${field}" est obligatoire.`

                    });

                }

            }


            // ------------------------------------------
            // VALIDATION LIVRAISON
            // ------------------------------------------

            if (
                delivery.type !== "standard" &&
                delivery.type !== "express"
            ) {

                return res.status(400).json({

                    message:
                        "Mode de livraison invalide."

                });

            }


            let deliveryPrice =
                Number(
                    delivery.price
                );


            if (
                !Number.isFinite(deliveryPrice) ||
                deliveryPrice < 0
            ) {

                return res.status(400).json({

                    message:
                        "Prix de livraison invalide."

                });

            }


            // ------------------------------------------
            // PRIX DE LIVRAISON SERVEUR
            // ------------------------------------------
            // Le client ne peut pas imposer son prix.
            // Le serveur définit les vrais tarifs.
            // ------------------------------------------

            const deliveryPrices = {

                standard:
                    0,

                express:
                    2000

            };


            deliveryPrice =
                deliveryPrices[
                    delivery.type
                ];


            // ------------------------------------------
            // VALIDATION PAIEMENT
            // ------------------------------------------

            let paymentMethod =
                "mobile_money";


            if (
                payment &&
                typeof payment === "object" &&
                typeof payment.method === "string"
            ) {

                paymentMethod =
                    payment.method.trim().toLowerCase();

            }


            const allowedPaymentMethods = [

                "mobile_money",
                "wave",
                "orange_money"

            ];


            if (
                !allowedPaymentMethods.includes(
                    paymentMethod
                )
            ) {

                return res.status(400).json({

                    message:
                        "Méthode de paiement invalide."

                });

            }


            // ------------------------------------------
            // POUR LE MOMENT :
            // PAS D'API DE PAIEMENT EXTERNE
            // ------------------------------------------

            const paymentStatus =
                "pending";


            // ------------------------------------------
            // RÉCUPÉRER LES PRODUITS
            // ------------------------------------------

            const productIds =
                products.map(
                    function (product) {

                        return Number(
                            product.id
                        );

                    }
                );


            // ------------------------------------------
            // VALIDATION IDS
            // ------------------------------------------

            if (
                productIds.some(
                    function (id) {

                        return (
                            !Number.isInteger(id) ||
                            id <= 0
                        );

                    }
                )
            ) {

                return res.status(400).json({

                    message:
                        "Identifiant produit invalide."

                });

            }


            // ------------------------------------------
            // PAS DE DOUBLON
            // ------------------------------------------

            const uniqueProductIds =
                new Set(
                    productIds
                );


            if (
                uniqueProductIds.size !==
                productIds.length
            ) {

                return res.status(400).json({

                    message:
                        "Un produit ne peut apparaître qu'une seule fois dans la commande."

                });

            }


            // ------------------------------------------
            // PLACEHOLDERS SQL
            // ------------------------------------------

            const placeholders =
                productIds
                    .map(
                        function () {

                            return "?";

                        }
                    )
                    .join(",");


            // ------------------------------------------
            // PRODUITS DE LA BASE
            // ------------------------------------------

            const [
                databaseProducts
            ] =
                await connection.query(

                    `SELECT
                        id,
                        name,
                        price
                     FROM products
                     WHERE id IN (${placeholders})`,

                    productIds

                );


            if (
                databaseProducts.length !==
                uniqueProductIds.size
            ) {

                return res.status(400).json({

                    message:
                        "Un ou plusieurs produits n'existent pas."

                });

            }


            // ------------------------------------------
            // CALCUL SOUS-TOTAL
            // ------------------------------------------

            let subtotal =
                0;


            const orderItems =
                [];


            for (
                const product
                of products
            ) {

                const productId =
                    Number(
                        product.id
                    );


                const quantity =
                    Number(
                        product.quantity
                    );


                // --------------------------------------
                // QUANTITÉ
                // --------------------------------------

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


                // --------------------------------------
                // PRODUIT DB
                // --------------------------------------

                const databaseProduct =
                    databaseProducts.find(
                        function (item) {

                            return (
                                item.id ===
                                productId
                            );

                        }
                    );


                if (!databaseProduct) {

                    return res.status(400).json({

                        message:
                            "Produit introuvable."

                    });

                }


                // --------------------------------------
                // SOUS-TOTAL PRODUIT
                // --------------------------------------

                const itemSubtotal =
                    databaseProduct.price *
                    quantity;


                subtotal +=
                    itemSubtotal;


                orderItems.push({

                    productId:
                        databaseProduct.id,

                    productName:
                        databaseProduct.name,

                    price:
                        databaseProduct.price,

                    quantity:
                        quantity,

                    subtotal:
                        itemSubtotal

                });

            }


            // ------------------------------------------
            // TOTAL
            // ------------------------------------------

            const total =
                subtotal +
                deliveryPrice;


            // ------------------------------------------
            // NUMÉRO COMMANDE
            // ------------------------------------------

            const orderNumber =
                "PS-" +
                Date.now();


            // ------------------------------------------
            // TRANSACTION DB
            // ------------------------------------------

            await connection.beginTransaction();


            // ------------------------------------------
            // CRÉER COMMANDE
            // ------------------------------------------

            const [
                orderResult
            ] =
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
                    VALUES (
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?
                    )`,

                    [

                        orderNumber,

                        customer.firstName.trim(),

                        customer.lastName.trim(),

                        customer.phone.trim(),

                        customer.city.trim(),

                        customer.address.trim(),

                        delivery.type,

                        deliveryPrice,

                        subtotal,

                        total,

                        "pending",

                        paymentMethod,

                        paymentStatus

                    ]

                );


            const orderId =
                orderResult.insertId;


            // ------------------------------------------
            // CRÉER LES LIGNES DE COMMANDE
            // ------------------------------------------

            for (
                const item
                of orderItems
            ) {

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


            // ------------------------------------------
            // VALIDATION TRANSACTION
            // ------------------------------------------

            await connection.commit();


            // ------------------------------------------
            // RÉPONSE
            // ------------------------------------------

            res.status(201).json({

                message:
                    "Commande enregistrée avec succès.",

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

                    paymentMethod:
                        paymentMethod,

                    paymentStatus:
                        paymentStatus

                }

            });


        } catch (error) {

            // ------------------------------------------
            // ROLLBACK
            // ------------------------------------------

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
                    "Erreur serveur lors de l'enregistrement de la commande."

            });


        } finally {

            if (connection) {

                connection.release();

            }

        }

    }
);


// ==================================================
// ROUTE 404
// ==================================================

app.use(
    function (req, res) {

        res.status(404).json({

            message:
                "Route introuvable."

        });

    }
);


// ==================================================
// GESTION DES ERREURS
// ==================================================

app.use(
    function (
        error,
        req,
        res,
        next
    ) {

        console.error(
            "Erreur serveur :",
            error
        );


        if (res.headersSent) {

            return next(error);

        }


        res.status(500).json({

            message:
                "Erreur interne du serveur."

        });

    }
);


// ==================================================
// DÉMARRAGE
// ==================================================

app.listen(
    PORT,
    function () {

        console.log(
            `Serveur démarré sur le port ${PORT}`
        );

    }
);
