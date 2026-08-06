document.addEventListener("DOMContentLoaded", () => {

    // Tabs
    const loginTab = document.getElementById("loginTab");
    const registerTab = document.getElementById("registerTab");

    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");

    loginTab.addEventListener("click", () => {

        loginForm.style.display = "block";
        registerForm.style.display = "none";

        loginTab.classList.add("active");
        registerTab.classList.remove("active");

    });

    registerTab.addEventListener("click", () => {

        loginForm.style.display = "none";
        registerForm.style.display = "block";

        registerTab.classList.add("active");
        loginTab.classList.remove("active");

    });

    // Register Button
    document
        .getElementById("registerBtn")
        .addEventListener("click", registerDriver);

    document
    .getElementById("loginBtn")
    .addEventListener("click", loginDriver);

});

async function registerDriver() {

    const email = document.getElementById("regEmail").value.trim();

    const password = document.getElementById("regPassword").value;

    const confirmPassword = document.getElementById("regConfirmPassword").value;

    if (!email || !password) {
        alert("Please enter an email and password.");
        return;
    }

    if (password !== confirmPassword) {
        alert("Passwords do not match.");
        return;
    }

    const { data, error } =
        await window.supabaseClient.auth.signUp({

            email,
            password

        });

    if (error) {
        alert(error.message);
        console.error(error);
        return;
    }

    const user = data.user;

const { error: profileError } =
await window.supabaseClient
.from("Drivers")
.insert({

    auth_id: user.id,

    name: document.getElementById("regName").value,

    mobile: document.getElementById("regMobile").value,

    email: email,

    license: document.getElementById("regLicence").value,

    own_vehicle:
        document.getElementById("regVehicle").value === "Yes"

});

if(profileError){

    console.error(profileError);

    alert(profileError.message);

    return;

}

alert("Driver account created successfully!");

}
async function loginDriver() {

    const email = document.getElementById("loginEmail").value.trim();

    const password = document.getElementById("loginPassword").value;

    const { data, error } =
        await window.supabaseClient.auth.signInWithPassword({

            email,
            password

        });

    if (error) {

        alert(error.message);

        console.error(error);

        return;

    }

    window.location.href = "dashboard.html";

}