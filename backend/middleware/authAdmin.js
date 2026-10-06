const jwt = require("jsonwebtoken");

function authAdmin(req, res, next) {

    try {

        const authorization =
            req.headers.authorization;

        if (!authorization) {

            return res.status(401).json({
                message: "Authentification requise."
            });
  
        }

        const parts =
            authorization.split(" ");

        if (
            parts.length !== 2 ||
            parts[0] !== "Bearer"
        ) {

            return res.status(401).json({
                message: "Token d'authentification invalide."
            });

        }

        const token = parts[1];

        const decoded =
            jwt.verify(
                token,
                process.env.JWT_SECRET
            );

        req.admin = decoded;

        next();

    } catch (error) {

        return res.status(401).json({
            message: "Session administrateur invalide ou expirée."
        });

    }

}

module.exports = authAdmin;

