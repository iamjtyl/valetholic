    console.log("login.js loaded");
    function login(){

        const username = document.getElementById("username").value.trim();

        const password = document.getElementById("password").value;

        if(
            username === "admin" &&
            password === "valetholic2026"
        ){

            sessionStorage.setItem(
                "adminLoggedIn",
                "true"
            );

            window.location.href = "admin.html";

        }
        else{

            document.getElementById("error").textContent =
                "Invalid username or password.";

        }

    }