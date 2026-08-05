alert("CLICK HANDLER VERSION");
alert("driver-portal.js loaded");

document.addEventListener("DOMContentLoaded", () => {

    const btn = document.getElementById("registerBtn");

    console.log(btn);

    btn.addEventListener("click", registerDriver);

});

async function registerDriver() {

    const email = document.getElementById("regEmail").value.trim();

    const password = document.getElementById("regPassword").value;

    const confirmPassword = document.getElementById("regConfirmPassword").value;

    if (password !== confirmPassword) {

        alert("Passwords do not match.");

        return;

    }

    const { data, error } = await window.supabaseClient.auth.signUp({

        email: email,

        password: password

    });

    if (error) {

        alert(error.message);

        console.error(error);

        return;

    }

    alert("Driver account created successfully!");

    console.log(data);

}