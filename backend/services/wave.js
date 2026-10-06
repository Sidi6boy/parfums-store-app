const axios = require("axios");

// ==================================================
// CONFIGURATION WAVE
// ==================================================

const WAVE_API_URL =
    "https://api.wave.com";


// ==================================================
// CRÉER UNE SESSION DE PAIEMENT WAVE
// ==================================================

async function createWaveCheckout({
    amount,
    orderNumber,
    successUrl,
    errorUrl
}) {

    // ------------------------------------------
    // VÉRIFIER LA CLÉ API
    // ------------------------------------------

    if (!process.env.WAVE_API_KEY) {

        throw new Error(
            "WAVE_API_KEY n'est pas configurée dans le fichier .env"
        );

    }


    // ------------------------------------------
    // VÉRIFIER LE MONTANT
    // ------------------------------------------

    const numericAmount =
        Number(amount);


    if (
        !Number.isInteger(numericAmount) ||
        numericAmount <= 0
    ) {

        throw new Error(
            "Montant Wave invalide."
        );

    }


    // ------------------------------------------
    // VÉRIFIER LA RÉFÉRENCE
    // ------------------------------------------

    if (
        typeof orderNumber !== "string" ||
        orderNumber.trim() === ""
    ) {

        throw new Error(
            "Numéro de commande invalide."
        );

    }


    // ------------------------------------------
    // VÉRIFIER LES URL
    // ------------------------------------------

    if (
        typeof successUrl !== "string" ||
        typeof errorUrl !== "string"
    ) {

        throw new Error(
            "Les URL de paiement sont invalides."
        );

    }


    // ------------------------------------------
    // DONNÉES ENVOYÉES À WAVE
    // ------------------------------------------

    const payload = {

        amount:
            String(numericAmount),

        currency:
            "XOF",

        client_reference:
            orderNumber,

        success_url:
            successUrl,

        error_url:
            errorUrl

    };


    // ------------------------------------------
    // APPEL API WAVE
    // ------------------------------------------

    const response =
        await axios.post(

            `${WAVE_API_URL}/checkout/sessions`,

            payload,

            {
                headers: {

                    Authorization:
                        `Bearer ${process.env.WAVE_API_KEY}`,

                    "Content-Type":
                        "application/json"

                },

                timeout: 15000

            }

        );


    // ------------------------------------------
    // VÉRIFIER LA RÉPONSE
    // ------------------------------------------

    if (
        !response.data ||
        !response.data.id ||
        !response.data.wave_launch_url
    ) {

        throw new Error(
            "Réponse Wave invalide."
        );

    }


    // ------------------------------------------
    // RETOURNER LES INFORMATIONS UTILES
    // ------------------------------------------

    return {

        id:
            response.data.id,

        launchUrl:
            response.data.wave_launch_url,

        checkoutStatus:
            response.data.checkout_status,

        paymentStatus:
            response.data.payment_status,

        transactionId:
            response.data.transaction_id || null

    };

}


// ==================================================
// RÉCUPÉRER UNE SESSION WAVE
// ==================================================

async function getWaveCheckout(checkoutId) {

    if (!process.env.WAVE_API_KEY) {

        throw new Error(
            "WAVE_API_KEY n'est pas configurée dans le fichier .env"
        );

    }


    if (
        typeof checkoutId !== "string" ||
        checkoutId.trim() === ""
    ) {

        throw new Error(
            "Identifiant de session Wave invalide."
        );

    }


    const response =
        await axios.get(

            `${WAVE_API_URL}/checkout/sessions/${encodeURIComponent(checkoutId)}`,

            {
                headers: {

                    Authorization:
                        `Bearer ${process.env.WAVE_API_KEY}`

                },

                timeout: 15000

            }

        );


    return response.data;

}


// ==================================================
// EXPORT
// ==================================================

module.exports = {

    createWaveCheckout,

    getWaveCheckout

};
