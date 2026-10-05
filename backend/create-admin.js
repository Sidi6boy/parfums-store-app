const bcrypt = require("bcryptjs");
const db = require("./db");

async function createAdmin() {

    try {

        const username = "admin";
        const email = "admin@parfums-store.com";
        const password = "Admin12345";

        const passwordHash = await bcrypt.hash(password, 10);

        const [existingAdmins] = await db.query(
            "SELECT id FROM admins WHERE username = ? OR email = ?",
            [username, email]
        );

        if (existingAdmins.length > 0) {

            console.log("Un administrateur avec ce nom ou cet email existe déjà.");

            process.exit();

        }

        await db.execute(
            `INSERT INTO admins (
                username,
                email,
                password_hash
            )
            VALUES (?, ?, ?)`,
            [
                username,
                email,
                passwordHash
            ]
        );

        console.log("Administrateur créé avec succès.");
        console.log("Username :", username);
        console.log("Email :", email);
        console.log("Mot de passe :", password);

    } catch (error) {

        console.error(
            "Erreur lors de la création de l'administrateur :",
            error
        );

    } finally {

        await db.end();

    }

}

createAdmin();
