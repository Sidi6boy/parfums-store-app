const express = require("express");
const db = require("../db");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// ==================================================
// TABLEAU DE BORD ADMINISTRATEUR
// GET /api/admin/dashboard
// ==================================================

router.get("/", authMiddleware, async function (req, res) {

try {

    // ------------------------------------------
    // NOMBRE DE PRODUITS
    // ------------------------------------------

    const [productResult] =
        await db.query(

            `SELECT COUNT(*) AS total
             FROM products`

        );


    // ------------------------------------------
    // NOMBRE TOTAL DE COMMANDES
    // ------------------------------------------

    const [orderResult] =
        await db.query(

            `SELECT COUNT(*) AS total
             FROM orders`

        );


    // ------------------------------------------
    // COMMANDES EN ATTENTE
    // ------------------------------------------

    const [pendingResult] =
        await db.query(

            `SELECT COUNT(*) AS total
             FROM orders
             WHERE status = 'pending'`

        );


    // ------------------------------------------
    // COMMANDES CONFIRMÉES
    // ------------------------------------------

    const [confirmedResult] =
        await db.query(

            `SELECT COUNT(*) AS total
             FROM orders
             WHERE status = 'confirmed'`

        );


    // ------------------------------------------
    // COMMANDES EXPÉDIÉES
    // ------------------------------------------

    const [shippedResult] =
        await db.query(

            `SELECT COUNT(*) AS total
             FROM orders
             WHERE status = 'shipped'`

        );


    // ------------------------------------------
    // COMMANDES LIVRÉES
    // ------------------------------------------

    const [deliveredResult] =
        await db.query(

            `SELECT COUNT(*) AS total
             FROM orders
             WHERE status = 'delivered'`

        );


    // ------------------------------------------
    // COMMANDES ANNULÉES
    // ------------------------------------------

    const [cancelledResult] =
        await db.query(

            `SELECT COUNT(*) AS total
             FROM orders
             WHERE status = 'cancelled'`

        );


    // ------------------------------------------
    // CHIFFRE D'AFFAIRES TOTAL
    // ------------------------------------------

    const [revenueResult] =
        await db.query(

            `SELECT
                COALESCE(SUM(total), 0) AS total
             FROM orders
             WHERE status != 'cancelled'`

        );


    // ------------------------------------------
    // CHIFFRE D'AFFAIRES LIVRÉ
    // ------------------------------------------

    const [deliveredRevenueResult] =
        await db.query(

            `SELECT
                COALESCE(SUM(total), 0) AS total
             FROM orders
             WHERE status = 'delivered'`

        );


    // ------------------------------------------
    // DERNIÈRES COMMANDES
    // ------------------------------------------

    const [latestOrders] =
        await db.query(

            `SELECT
                id,
                order_number,
                first_name,
                last_name,
                total,
                status,
                created_at
             FROM orders
             ORDER BY id DESC
             LIMIT 10`

        );


    // ------------------------------------------
    // PRODUITS
    // ------------------------------------------

    const [products] =
        await db.query(

            `SELECT
                id,
                name,
                price,
                category
             FROM products
             ORDER BY id ASC`

        );


    // ------------------------------------------
    // RÉPONSE
    // ------------------------------------------

    res.status(200).json({

        statistics: {

            products:
                Number(productResult[0].total),

            orders:
                Number(orderResult[0].total),

            pending:
                Number(pendingResult[0].total),

            confirmed:
                Number(confirmedResult[0].total),

            shipped:
                Number(shippedResult[0].total),

            delivered:
                Number(deliveredResult[0].total),

            cancelled:
                Number(cancelledResult[0].total),

            revenue:
                Number(revenueResult[0].total),

            deliveredRevenue:
                Number(deliveredRevenueResult[0].total)

        },

        latestOrders:
            latestOrders,

        products:
            products

    });

} catch (error) {

    console.error(
        "Erreur lors de la récupération du tableau de bord :",
        error
    );

    res.status(500).json({

        message:
            "Erreur serveur lors de la récupération du tableau de bord."

    });

}


});

module.exports = router;