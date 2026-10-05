const express = require("express");
const db = require("../db");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();


// ==================================================
// MIDDLEWARE D'AUTHENTIFICATION
// Toutes les routes de ce fichier sont protégées
// ==================================================

router.use(authMiddleware);


// ==================================================
// RÉCUPÉRER TOUS LES PRODUITS
// GET /api/admin/products
// ==================================================

router.get("/", async function (req, res) {

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
             ORDER BY id DESC`

        );

        res.status(200).json({

            products: products

        });

    } catch (error) {

        console.error(
            "Erreur lors de la récupération des produits admin :",
            error
        );

        res.status(500).json({

            message:
                "Erreur serveur lors de la récupération des produits."

        });

    }

});


// ==================================================
// RÉCUPÉRER UN PRODUIT
// GET /api/admin/products/:id
// ==================================================

router.get("/:id", async function (req, res) {

    try {

        const productId =
            Number(req.params.id);


        if (
            !Number.isInteger(productId) ||
            productId <= 0
        ) {

            return res.status(400).json({

                message:
                    "Identifiant produit invalide."

            });

        }


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
             WHERE id = ?
             LIMIT 1`,

            [productId]

        );


        if (products.length === 0) {

            return res.status(404).json({

                message:
                    "Produit introuvable."

            });

        }


        res.status(200).json({

            product:
                products[0]

        });

    } catch (error) {

        console.error(
            "Erreur lors de la récupération du produit :",
            error
        );

        res.status(500).json({

            message:
                "Erreur serveur lors de la récupération du produit."

        });

    }

});


// ==================================================
// AJOUTER UN PRODUIT
// POST /api/admin/products
// ==================================================

router.post("/", async function (req, res) {

    try {

        const {
            name,
            price,
            category,
            description,
            image
        } = req.body;


        // ------------------------------------------
        // VÉRIFICATION DU NOM
        // ------------------------------------------

        if (
            typeof name !== "string" ||
            name.trim() === ""
        ) {

            return res.status(400).json({

                message:
                    "Le nom du produit est obligatoire."

            });

        }


        if (name.trim().length > 150) {

            return res.status(400).json({

                message:
                    "Le nom du produit ne peut pas dépasser 150 caractères."

            });

        }


        // ------------------------------------------
        // VÉRIFICATION DU PRIX
        // ------------------------------------------

        const productPrice =
            Number(price);


        if (
            !Number.isInteger(productPrice) ||
            productPrice < 0
        ) {

            return res.status(400).json({

                message:
                    "Le prix doit être un nombre entier positif ou égal à zéro."

            });

        }


        // ------------------------------------------
        // VÉRIFICATION DE LA CATÉGORIE
        // ------------------------------------------

        if (
            typeof category !== "string" ||
            category.trim() === ""
        ) {

            return res.status(400).json({

                message:
                    "La catégorie du produit est obligatoire."

            });

        }


        if (category.trim().length > 50) {

            return res.status(400).json({

                message:
                    "La catégorie ne peut pas dépasser 50 caractères."

            });

        }


        // ------------------------------------------
        // VÉRIFICATION DE LA DESCRIPTION
        // ------------------------------------------

        if (
            typeof description !== "string" ||
            description.trim() === ""
        ) {

            return res.status(400).json({

                message:
                    "La description du produit est obligatoire."

            });

        }


        // ------------------------------------------
        // VÉRIFICATION DE L'IMAGE
        // ------------------------------------------

        if (
            typeof image !== "string" ||
            image.trim() === ""
        ) {

            return res.status(400).json({

                message:
                    "L'image du produit est obligatoire."

            });

        }


        if (image.trim().length > 255) {

            return res.status(400).json({

                message:
                    "Le chemin de l'image ne peut pas dépasser 255 caractères."

            });

        }


        // ------------------------------------------
        // INSERTION
        // ------------------------------------------

        const [result] = await db.execute(

            `INSERT INTO products (
                name,
                price,
                category,
                description,
                image
            )
            VALUES (?, ?, ?, ?, ?)`,

            [
                name.trim(),
                productPrice,
                category.trim(),
                description.trim(),
                image.trim()
            ]

        );


        // ------------------------------------------
        // RÉCUPÉRER LE PRODUIT CRÉÉ
        // ------------------------------------------

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
             WHERE id = ?
             LIMIT 1`,

            [result.insertId]

        );


        res.status(201).json({

            message:
                "Produit ajouté avec succès.",

            product:
                products[0]

        });

    } catch (error) {

        console.error(
            "Erreur lors de l'ajout du produit :",
            error
        );

        res.status(500).json({

            message:
                "Erreur serveur lors de l'ajout du produit."

        });

    }

});


// ==================================================
// MODIFIER UN PRODUIT
// PUT /api/admin/products/:id
// ==================================================

router.put("/:id", async function (req, res) {

    try {

        const productId =
            Number(req.params.id);


        // ------------------------------------------
        // VÉRIFICATION ID
        // ------------------------------------------

        if (
            !Number.isInteger(productId) ||
            productId <= 0
        ) {

            return res.status(400).json({

                message:
                    "Identifiant produit invalide."

            });

        }


        // ------------------------------------------
        // VÉRIFIER QUE LE PRODUIT EXISTE
        // ------------------------------------------

        const [existingProducts] =
            await db.query(

                `SELECT id
                 FROM products
                 WHERE id = ?
                 LIMIT 1`,

                [productId]

            );


        if (existingProducts.length === 0) {

            return res.status(404).json({

                message:
                    "Produit introuvable."

            });

        }


        const {
            name,
            price,
            category,
            description,
            image
        } = req.body;


        // ------------------------------------------
        // VÉRIFICATION DU NOM
        // ------------------------------------------

        if (
            typeof name !== "string" ||
            name.trim() === ""
        ) {

            return res.status(400).json({

                message:
                    "Le nom du produit est obligatoire."

            });

        }


        if (name.trim().length > 150) {

            return res.status(400).json({

                message:
                    "Le nom du produit ne peut pas dépasser 150 caractères."

            });

        }


        // ------------------------------------------
        // VÉRIFICATION DU PRIX
        // ------------------------------------------

        const productPrice =
            Number(price);


        if (
            !Number.isInteger(productPrice) ||
            productPrice < 0
        ) {

            return res.status(400).json({

                message:
                    "Le prix doit être un nombre entier positif ou égal à zéro."

            });

        }


        // ------------------------------------------
        // VÉRIFICATION CATÉGORIE
        // ------------------------------------------

        if (
            typeof category !== "string" ||
            category.trim() === ""
        ) {

            return res.status(400).json({

                message:
                    "La catégorie du produit est obligatoire."

            });

        }


        if (category.trim().length > 50) {

            return res.status(400).json({

                message:
                    "La catégorie ne peut pas dépasser 50 caractères."

            });

        }


        // ------------------------------------------
        // VÉRIFICATION DESCRIPTION
        // ------------------------------------------

        if (
            typeof description !== "string" ||
            description.trim() === ""
        ) {

            return res.status(400).json({

                message:
                    "La description du produit est obligatoire."

            });

        }


        // ------------------------------------------
        // VÉRIFICATION IMAGE
        // ------------------------------------------

        if (
            typeof image !== "string" ||
            image.trim() === ""
        ) {

            return res.status(400).json({

                message:
                    "L'image du produit est obligatoire."

            });

        }


        if (image.trim().length > 255) {

            return res.status(400).json({

                message:
                    "Le chemin de l'image ne peut pas dépasser 255 caractères."

            });

        }


        // ------------------------------------------
        // MODIFICATION
        // ------------------------------------------

        await db.execute(

            `UPDATE products
             SET
                name = ?,
                price = ?,
                category = ?,
                description = ?,
                image = ?
             WHERE id = ?`,

            [
                name.trim(),
                productPrice,
                category.trim(),
                description.trim(),
                image.trim(),
                productId
            ]

        );


        // ------------------------------------------
        // RÉCUPÉRER LE PRODUIT MODIFIÉ
        // ------------------------------------------

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
             WHERE id = ?
             LIMIT 1`,

            [productId]

        );


        res.status(200).json({

            message:
                "Produit modifié avec succès.",

            product:
                products[0]

        });

    } catch (error) {

        console.error(
            "Erreur lors de la modification du produit :",
            error
        );

        res.status(500).json({

            message:
                "Erreur serveur lors de la modification du produit."

        });

    }

});


// ==================================================
// SUPPRIMER UN PRODUIT
// DELETE /api/admin/products/:id
// ==================================================

router.delete("/:id", async function (req, res) {

    try {

        const productId =
            Number(req.params.id);


        // ------------------------------------------
        // VÉRIFICATION ID
        // ------------------------------------------

        if (
            !Number.isInteger(productId) ||
            productId <= 0
        ) {

            return res.status(400).json({

                message:
                    "Identifiant produit invalide."

            });

        }


        // ------------------------------------------
        // VÉRIFIER QUE LE PRODUIT EXISTE
        // ------------------------------------------

        const [products] =
            await db.query(

                `SELECT
                    id,
                    name
                 FROM products
                 WHERE id = ?
                 LIMIT 1`,

                [productId]

            );


        if (products.length === 0) {

            return res.status(404).json({

                message:
                    "Produit introuvable."

            });

        }


        // ------------------------------------------
        // VÉRIFIER SI LE PRODUIT EST DANS
        // UNE COMMANDE
        // ------------------------------------------

        const [orderItems] =
            await db.query(

                `SELECT id
                 FROM order_items
                 WHERE product_id = ?
                 LIMIT 1`,

                [productId]

            );


        if (orderItems.length > 0) {

            return res.status(409).json({

                message:
                    "Ce produit ne peut pas être supprimé car il est associé à une ou plusieurs commandes."

            });

        }


        // ------------------------------------------
        // SUPPRESSION
        // ------------------------------------------

        await db.execute(

            `DELETE FROM products
             WHERE id = ?`,

            [productId]

        );


        res.status(200).json({

            message:
                "Produit supprimé avec succès."

        });

    } catch (error) {

        console.error(
            "Erreur lors de la suppression du produit :",
            error
        );

        res.status(500).json({

            message:
                "Erreur serveur lors de la suppression du produit."

        });

    }

});


module.exports = router;