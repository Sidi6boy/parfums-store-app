const API_URL = "http://localhost:3000";

const loginForm =
document.getElementById("loginForm");

const loginButton =
document.getElementById("loginButton");

const loginMessage =
document.getElementById("loginMessage");

loginForm.addEventListener("submit", async function (event) {

event.preventDefault();

const username =
    document.getElementById("username").value.trim();

const password =
    document.getElementById("password").value;


loginMessage.textContent = "";
loginMessage.className = "message";


loginButton.disabled = true;
loginButton.textContent = "Connexion...";


try {

    const response =
        await fetch(
            `${API_URL}/api/admin/login`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    username,
                    password
                })
            }
        );


    const data =
        await response.json();


    if (!response.ok) {

        throw new Error(
            data.message ||
            "Erreur de connexion."
        );

    }


    localStorage.setItem(
        "adminToken",
        data.token
    );


    localStorage.setItem(
        "admin",
        JSON.stringify(data.admin)
    );


    window.location.href =
        "dashboard.html";


} catch (error) {

    loginMessage.textContent =
        error.message;

    loginMessage.classList.add(
        "message-error"
    );

} finally {

    loginButton.disabled = false;
    loginButton.textContent = "Se connecter";

}


});