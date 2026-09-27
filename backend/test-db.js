const db = require("./db");

async function testConnection() {
    try {
        const [rows] = await db.query("SELECT 1 AS test");

        console.log("Connexion à MariaDB réussie !");
        console.log(rows);

    } catch (error) {

        console.error(
            "Erreur de connexion à MariaDB :",
            error.message
        );

    } finally {

        await db.end();

    }
}

testConnection();
