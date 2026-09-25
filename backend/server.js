const express = require("express");

const app = express();

const PORT = 3000;


// Permet au serveur de comprendre les données JSON
app.use(express.json());


// Route principale
app.get("/", function (req, res) {

    res.json({
        message: "Bienvenue sur l'API de Parfums Store",
        status: "OK"
    });

});


// Démarrage du serveur
app.listen(PORT, function () {

    console.log(
        `Serveur démarré sur http://localhost:${PORT}`
    );

});
