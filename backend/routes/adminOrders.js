const express = require("express");
const db = require("../db");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();


// ==================================================
// STATUTS DE COMMANDE AUTORISÉS
// ==================================================

const allowedStatuses = [
    "pending",
    "confirmed",
    "shipped",
    "delivered",
    "cancelled"
];


// ==================================================
// STATUTS DE PAIEMENT AUTORISÉS
// ==================================================

const allowedPaymentStatuses = [
    "pending",
    "paid",
    "failed",
    "cancelled"
];


// ==================================================
// MOYENS DE PAIEMENT AUTORISÉS
// ==================================================

const allowedPaymentMethods = [
    "mobile_money"
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
                payment_method,
                payment_status,
                payment_reference,
                paid_at,
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
            "Erreur lors de la récupération des commandes admin :",
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
                    payment_method,
                    payment_status,
                    payment_reference,
                    paid_at,
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


                payment: {

                    method:
                        order.payment_method,

                    status:
                        order.payment_status,

                    reference:
                        order.payment_reference,

                    paidAt:
                        order.paid_at

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
        // VÉRIFIER EXISTENCE
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
        // MODIFIER
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
        // RÉCUPÉRER
        // ------------------------------------------

        const [updatedOrders] =
            await db.query(

                `SELECT
                    id,
                    order_number,
                    status,
                    payment_status
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


// ==================================================
// MODIFIER LE STATUT DU PAIEMENT
// PATCH /api/admin/orders/:id/payment-status
// ==================================================

router.patch(
    "/:id/payment-status",
    authMiddleware,
    async function (req, res) {

        try {

            const orderId =
                Number(req.params.id);

            const paymentStatus =
                req.body.paymentStatus;


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
            // VÉRIFIER STATUT PAIEMENT
            // ------------------------------------------

            if (
                typeof paymentStatus !== "string" ||
                !allowedPaymentStatuses.includes(
                    paymentStatus
                )
            ) {

                return res.status(400).json({

                    message:
                        "Statut de paiement invalide.",

                    allowedPaymentStatuses:
                        allowedPaymentStatuses

                });

            }


            // ------------------------------------------
            // VÉRIFIER COMMANDE
            // ------------------------------------------

            const [orders] =
                await db.query(

                    `SELECT
                        id,
                        order_number,
                        payment_status
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
            // PRÉPARER paid_at
            // ------------------------------------------

            let paidAt = null;


            if (paymentStatus === "paid") {

                paidAt = new Date();

            }


            // ------------------------------------------
            // MODIFIER LE PAIEMENT
            // ------------------------------------------

            await db.execute(

                `UPDATE orders
                 SET
                    payment_status = ?,
                    paid_at = ?
                 WHERE id = ?`,

                [
                    paymentStatus,
                    paidAt,
                    orderId
                ]

            );


            // ------------------------------------------
            // RÉCUPÉRER
            // ------------------------------------------

            const [updatedOrders] =
                await db.query(

                    `SELECT
                        id,
                        order_number,
                        status,
                        payment_method,
                        payment_status,
                        payment_reference,
                        paid_at
                     FROM orders
                     WHERE id = ?
                     LIMIT 1`,

                    [orderId]

                );


            res.status(200).json({

                message:
                    "Statut du paiement modifié avec succès.",

                order:
                    updatedOrders[0]

            });

        } catch (error) {

            console.error(
                "Erreur lors de la modification du paiement :",
                error
            );

            res.status(500).json({

                message:
                    "Erreur serveur lors de la modification du paiement."

            });

        }

    }
);


module.exports = router;
