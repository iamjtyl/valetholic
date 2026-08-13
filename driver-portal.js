document.addEventListener("DOMContentLoaded", () => {

    // =========================================
    // TABS
    // =========================================

    const loginTab =
        document.getElementById("loginTab");

    const registerTab =
        document.getElementById("registerTab");

    const loginForm =
        document.getElementById("loginForm");

    const registerForm =
        document.getElementById("registerForm");


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


    // =========================================
    // REGISTER BUTTON
    // =========================================

    document
        .getElementById("registerBtn")
        .addEventListener(
            "click",
            registerDriver
        );


    // =========================================
    // LOGIN BUTTON
    // =========================================

    document
        .getElementById("loginBtn")
        .addEventListener(
            "click",
            loginDriver
        );

});


// =========================================
// REGISTER DRIVER
// =========================================

async function registerDriver() {

    const email =
        document
            .getElementById("regEmail")
            .value
            .trim();


    const password =
        document
            .getElementById("regPassword")
            .value;


    const confirmPassword =
        document
            .getElementById("regConfirmPassword")
            .value;


    // =========================================
    // BASIC VALIDATION
    // =========================================

    if (!email || !password) {

        alert(
            "Please enter an email and password."
        );

        return;

    }


    if (password !== confirmPassword) {

        alert(
            "Passwords do not match."
        );

        return;

    }


    // =========================================
    // CREATE SUPABASE AUTH ACCOUNT
    // =========================================

    const {
        data,
        error
    } =
        await window.supabaseClient.auth.signUp({

            email,

            password

        });


    if (error) {

        alert(
            error.message
        );

        console.error(
            error
        );

        return;

    }


    const user =
        data.user;


    // =========================================
    // CREATE DRIVER PROFILE
    // =========================================

    const {
        error: profileError
    } =
        await window.supabaseClient
        .from("Drivers")
        .insert({

            auth_id:
                user.id,

            name:
                document
                    .getElementById("regName")
                    .value
                    .trim(),

            mobile:
                document
                    .getElementById("regMobile")
                    .value
                    .trim(),

            email:
                email,

            license:
                document
                    .getElementById("regLicence")
                    .value
                    .trim(),

            own_vehicle:
                document
                    .getElementById("regVehicle")
                    .value === "Yes",

            // =================================
            // APPROVAL SYSTEM
            // =================================

            approved:
                false,

            approval_status:
            "PENDING",

            status:
                "OFF DUTY"

            
        });


    // =========================================
    // PROFILE ERROR
    // =========================================

    if (profileError) {

        console.error(
            profileError
        );

        alert(
            profileError.message
        );

        return;

    }


    // =========================================
    // SUCCESS
    // =========================================

   alert(
    "Registration successful!\n\n" +
    "Your driver application has been submitted " +
    "and is now waiting for Admin approval."
    );

    window.location.href =
    "dashboard.html";

}


// =========================================
// LOGIN DRIVER
// =========================================

async function loginDriver() {

    const email =
        document
            .getElementById("loginEmail")
            .value
            .trim();


    const password =
        document
            .getElementById("loginPassword")
            .value;


    // =========================================
    // LOGIN
    // =========================================

    const {
        data,
        error
    } =
        await window.supabaseClient.auth
        .signInWithPassword({

            email,

            password

        });


    if (error) {

        alert(
            error.message
        );

        console.error(
            error
        );

        return;

    }


    // =========================================
    // CURRENTLY GO TO DASHBOARD
    // =========================================

    window.location.href =
        "dashboard.html";

}