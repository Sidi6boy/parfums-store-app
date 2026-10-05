const jwt = require("jsonwebtoken");

function authMiddleware(req, res, next) {

    try {

        // ==========================================
        // RÉCUPÉRER LE HEADER AUTHORIZATION
        // ==========================================

        const authorization =
            req.headers.authorization;


        if (!authorization) {

            return res.status(401).json({

                message:
                    "Accès refusé. Token d'authentification manquant."

            });

        }


        // ==========================================
        // VÉRIFIER LE FORMAT :
        // Bearer TOKEN
        // ==========================================

        const parts =
            authorization.split(" ");


        if (
            parts.length !== 2 ||
            parts[0] !== "Bearer" ||
            !parts[1]
        ) {

            return res.status(401).json({

                message:
                    "Format du token invalide."

            });

        }


        const token =
            parts[1];


        // ==========================================
        // VÉRIFIER LE JWT_SECRET
        // ==========================================

        if (!process.env.JWT_SECRET) {

            console.error(
                "JWT_SECRET n'est pas défini dans le fichier .env"
            );

            return res.status(500).json({

                message:
                    "Configuration serveur incomplète."

            });

        }


        // ==========================================
        // VÉRIFIER LE TOKEN
        // ==========================================

        const decoded =
            jwt.verify(
                token,
                process.env.JWT_SECRET
            );


        // ==========================================
        // STOCKER LES INFORMATIONS DE L'ADMIN
        // DANS LA REQUÊTE
        // ==========================================

        req.admin = decoded;


        // ==========================================
        // AUTORISER LA REQUÊTE
        // ==========================================

        next();

    } catch (error) {

        console.error(
            "Erreur d'authentification :",
            error.message
        );


        // ==========================================
        // TOKEN EXPIRÉ
        // ==========================================

        if (error.name === "TokenExpiredError") {

            return res.status(401).json({

                message:
                    "Session administrateur expirée. Veuillez vous reconnecter."

            });

        }


        // ==========================================
        // TOKEN INVALIDE
        // ==========================================

        if (error.name === "JsonWebTokenError") {

            return res.status(401).json({

                message:
                    "Token d'authentification invalide."

            });

        }


        // ==========================================
        // AUTRE ERREUR
        // ==========================================

        return res.status(500).json({

            message:
                "Erreur lors de la vérification de l'authentification."

        });

    }

}


module.exports = authMiddleware;