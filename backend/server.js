const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("./db");
const authMiddleware = require("./middleware/authMiddleware");
const adminProductsRouter = require("./routes/adminProducts");
const adminOrdersRouter = require("./routes/adminOrders");
const adminDashboardRouter = require("./routes/adminDashboard");

const app = express();

const PORT = 3000;


// ==================================================
// MIDDLEWARE
// ==================================================

app.use(cors());

app.use(express.json());


// ==================================================
// ROUTE PRINCIPALE
// ==================================================

app.get("/", function (req, res) {

    res.json({
        message: "Bienvenue sur l'API de Parfums Store",
        status: "OK"
    });

});


// ==================================================
// RÉCUPÉRER LES PRODUITS
// ROUTE PUBLIQUE
// ==================================================

app.get("/api/products", async function (req, res) {

    try {

        const [products] = await db.query(

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

        res.status(200).json(products);

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

});


// ==================================================
// CONNEXION ADMINISTRATEUR
// ==================================================

app.post("/api/admin/login", async function (req, res) {

    try {

        const {
            username,
            password
        } = req.body;


        if (
            typeof username !== "string" ||
            typeof password !== "string" ||
            username.trim() === "" ||
            password.trim() === ""
        ) {

            return res.status(400).json({

                message:
                    "Nom d'utilisateur et mot de passe obligatoires."

            });

        }


        const [admins] = await db.query(

            `SELECT
                id,
                username,
                email,
                password_hash
             FROM admins
             WHERE username = ?
             LIMIT 1`,

            [username.trim()]

        );


        if (admins.length === 0) {

            return res.status(401).json({

                message:
                    "Identifiants incorrects."

            });

        }


        const admin = admins[0];


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


        if (!process.env.JWT_SECRET) {

            console.error(
                "JWT_SECRET n'est pas défini dans le fichier .env"
            );

            return res.status(500).json({

                message:
                    "Configuration serveur incomplète."

            });

        }


        const token =
            jwt.sign(

                {
                    id: admin.id,
                    username: admin.username,
                    email: admin.email
                },

                process.env.JWT_SECRET,

                {
                    expiresIn: "2h"
                }

            );


        res.status(200).json({

            message:
                "Connexion administrateur réussie.",

            token: token,

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

});


// ==================================================
// INFORMATIONS ADMINISTRATEUR CONNECTÉ
// ROUTE PROTÉGÉE
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
// ROUTES ADMINISTRATEUR - PRODUITS
// ==================================================

app.use(
    "/api/admin/products",
    adminProductsRouter
);

// ==================================================
// ROUTES ADMINISTRATEUR - COMMANDES
// ==================================================

app.use(
    "/api/admin/orders",
    adminOrdersRouter
);


// ==================================================
// ROUTE ADMINISTRATEUR - TABLEAU DE BORD
// ==================================================

app.use(
    "/api/admin/dashboard",
    adminDashboardRouter
);

// ==================================================
// CRÉER UNE COMMANDE
// ROUTE PUBLIQUE
// ==================================================

app.post("/api/orders", async function (req, res) {

    let connection;

    try {

        connection =
            await db.getConnection();


        const {
            customer,
            delivery,
            products
        } = req.body;


        // ------------------------------------------
        // VÉRIFICATION DES DONNÉES
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


        if (products.length === 0) {

            return res.status(400).json({

                message:
                    "La commande doit contenir au moins un produit."

            });

        }


        // ------------------------------------------
        // VÉRIFICATION CLIENT
        // ------------------------------------------

        const requiredCustomerFields = [
            "firstName",
            "lastName",
            "phone",
            "city",
            "address"
        ];


        for (const field of requiredCustomerFields) {

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
        // VÉRIFICATION LIVRAISON
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


        const deliveryPrice =
            Number(delivery.price);


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
        // RÉCUPÉRER LES PRODUITS
        // ------------------------------------------

        const productIds =
            products.map(function (product) {

                return Number(product.id);

            });


        if (
            productIds.some(function (id) {

                return !Number.isInteger(id) || id <= 0;

            })
        ) {

            return res.status(400).json({

                message:
                    "Identifiant produit invalide."

            });

        }


        const uniqueProductIds =
            new Set(productIds);


        if (
            uniqueProductIds.size !== productIds.length
        ) {

            return res.status(400).json({

                message:
                    "Un produit ne peut apparaître qu'une seule fois dans la commande."

            });

        }


        const placeholders =
            productIds
                .map(function () {

                    return "?";

                })
                .join(",");


        const [databaseProducts] =
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
        // CALCUL DU SOUS-TOTAL
        // ------------------------------------------

        let subtotal = 0;

        const orderItems = [];


        for (const product of products) {

            const productId =
                Number(product.id);

            const quantity =
                Number(product.quantity);


            if (
                !Number.isInteger(quantity) ||
                quantity <= 0
            ) {

                return res.status(400).json({

                    message:
                        "Quantité de produit invalide."

                });

            }


            const databaseProduct =
                databaseProducts.find(
                    function (item) {

                        return item.id === productId;

                    }
                );


            if (!databaseProduct) {

                return res.status(400).json({

                    message:
                        "Produit introuvable."

                });

            }


            const itemSubtotal =
                databaseProduct.price * quantity;


            subtotal += itemSubtotal;


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
        // CALCUL TOTAL
        // ------------------------------------------

        const total =
            subtotal + deliveryPrice;


        // ------------------------------------------
        // NUMÉRO COMMANDE
        // ------------------------------------------

        const orderNumber =
            "PS-" + Date.now();


        // ------------------------------------------
        // TRANSACTION
        // ------------------------------------------

        await connection.beginTransaction();


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
                    total
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,

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
                    total
                ]

            );


        const orderId =
            orderResult.insertId;


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


        await connection.commit();


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
                    total

            }

        });


    } catch (error) {

        if (connection) {

            try {

                await connection.rollback();

            } catch (rollbackError) {

                console.error(
                    "Erreur lors du rollback :",
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

});


// ==================================================
// ROUTE 404
// ==================================================

app.use(function (req, res) {

    res.status(404).json({

        message:
            "Route introuvable."

    });

});


// ==================================================
// GESTION DES ERREURS
// ==================================================

app.use(function (error, req, res, next) {

    console.error(
        "Erreur serveur :",
        error
    );

    res.status(500).json({

        message:
            "Erreur interne du serveur."

    });

});


// ==================================================
// DÉMARRAGE DU SERVEUR
// ==================================================

app.listen(PORT, function () {

    console.log(
        `Serveur démarré sur http://localhost:${PORT}`
    );

});