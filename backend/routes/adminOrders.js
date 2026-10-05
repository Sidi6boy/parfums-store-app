const express = require("express");
const db = require("../db");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// ==================================================
// TOUS LES STATUTS AUTORISÉS
// ==================================================

const allowedStatuses = [
"pending",
"confirmed",
"shipped",
"delivered",
"cancelled"
];

// ==================================================
// TOUTES LES COMMANDES
// GET /api/admin/orders
// ==================================================

router.get("/", authMiddleware, async function (req, res) {

try {

    const [orders] = await db.query(

        `SELECT
            id,
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
            created_at
         FROM orders
         ORDER BY id DESC`

    );


    res.status(200).json({

        count: orders.length,

        orders: orders

    });

} catch (error) {

    console.error(
        "Erreur lors de la récupération des commandes :",
        error
    );

    res.status(500).json({

        message:
            "Erreur serveur lors de la récupération des commandes."

    });

}


});

// ==================================================
// DÉTAIL D'UNE COMMANDE
// GET /api/admin/orders/:id
// ==================================================

router.get("/:id", authMiddleware, async function (req, res) {

try {

    const orderId =
        Number(req.params.id);


    if (
        !Number.isInteger(orderId) ||
        orderId <= 0
    ) {

        return res.status(400).json({

            message:
                "Identifiant de commande invalide."

        });

    }


    // ------------------------------------------
    // RÉCUPÉRER LA COMMANDE
    // ------------------------------------------

    const [orders] =
        await db.query(

            `SELECT
                id,
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
                created_at
             FROM orders
             WHERE id = ?
             LIMIT 1`,

            [orderId]

        );


    if (orders.length === 0) {

        return res.status(404).json({

            message:
                "Commande introuvable."

        });

    }


    const order =
        orders[0];


    // ------------------------------------------
    // RÉCUPÉRER LES PRODUITS
    // ------------------------------------------

    const [items] =
        await db.query(

            `SELECT
                id,
                product_id,
                product_name,
                price,
                quantity,
                subtotal,
                created_at
             FROM order_items
             WHERE order_id = ?
             ORDER BY id ASC`,

            [orderId]

        );


    // ------------------------------------------
    // RÉPONSE
    // ------------------------------------------

    res.status(200).json({

        order: {

            id:
                order.id,

            orderNumber:
                order.order_number,

            customer: {

                firstName:
                    order.first_name,

                lastName:
                    order.last_name,

                phone:
                    order.phone,

                city:
                    order.city,

                address:
                    order.address

            },

            delivery: {

                type:
                    order.delivery_type,

                price:
                    order.delivery_price

            },

            subtotal:
                order.subtotal,

            total:
                order.total,

            status:
                order.status,

            createdAt:
                order.created_at,

            items:
                items

        }

    });

} catch (error) {

    console.error(
        "Erreur lors de la récupération de la commande :",
        error
    );

    res.status(500).json({

        message:
            "Erreur serveur lors de la récupération de la commande."

    });

}


});

// ==================================================
// MODIFIER LE STATUT D'UNE COMMANDE
// PATCH /api/admin/orders/:id/status
// ==================================================

router.patch("/:id/status", authMiddleware, async function (req, res) {

try {

    const orderId =
        Number(req.params.id);

    const status =
        req.body.status;


    // ------------------------------------------
    // VÉRIFIER ID
    // ------------------------------------------

    if (
        !Number.isInteger(orderId) ||
        orderId <= 0
    ) {

        return res.status(400).json({

            message:
                "Identifiant de commande invalide."

        });

    }


    // ------------------------------------------
    // VÉRIFIER STATUT
    // ------------------------------------------

    if (
        typeof status !== "string" ||
        !allowedStatuses.includes(status)
    ) {

        return res.status(400).json({

            message:
                "Statut de commande invalide.",

            allowedStatuses:
                allowedStatuses

        });

    }


    // ------------------------------------------
    // VÉRIFIER QUE LA COMMANDE EXISTE
    // ------------------------------------------

    const [orders] =
        await db.query(

            `SELECT
                id,
                order_number,
                status
             FROM orders
             WHERE id = ?
             LIMIT 1`,

            [orderId]

        );


    if (orders.length === 0) {

        return res.status(404).json({

            message:
                "Commande introuvable."

        });

    }


    // ------------------------------------------
    // MODIFIER LE STATUT
    // ------------------------------------------

    await db.execute(

        `UPDATE orders
         SET status = ?
         WHERE id = ?`,

        [
            status,
            orderId
        ]

    );


    // ------------------------------------------
    // RÉCUPÉRER LA COMMANDE MODIFIÉE
    // ------------------------------------------

    const [updatedOrders] =
        await db.query(

            `SELECT
                id,
                order_number,
                status
             FROM orders
             WHERE id = ?
             LIMIT 1`,

            [orderId]

        );


    res.status(200).json({

        message:
            "Statut de la commande modifié avec succès.",

        order:
            updatedOrders[0]

    });

} catch (error) {

    console.error(
        "Erreur lors de la modification du statut :",
        error
    );

    res.status(500).json({

        message:
            "Erreur serveur lors de la modification du statut."

    });

}


});

module.exports = router;