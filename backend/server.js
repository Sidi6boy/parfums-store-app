const express = require("express");
const cors = require("cors");
const db = require("./db");

const app = express();

const PORT = 3000;

app.use(cors());

app.use(express.json());



// ==========================
// MIDDLEWARE
// ==========================

app.use(express.json());


// ==========================
// ROUTE PRINCIPALE
// ==========================

app.get("/", function (req, res) {

    res.json({
        message: "Bienvenue sur l'API de Parfums Store",
        status: "OK"
    });

});


// ==========================
// RÉCUPÉRER LES PRODUITS
// ==========================

app.get("/api/products", async function (req, res) {

    try {

        const [products] =
            await db.query(
                "SELECT * FROM products ORDER BY id ASC"
            );

        res.json(products);

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


// ==========================
// DÉMARRAGE DU SERVEUR
// ==========================

app.listen(PORT, function () {

    console.log(
        `Serveur démarré sur http://localhost:${PORT}`
    );

});
