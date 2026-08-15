// =====================================
// VALETHOLIC ADMIN LOGIN
// =====================================

console.log(
    "login.js loaded"
);


// =====================================
// ADMIN LOGIN
// =====================================

async function login() {

    // =================================
    // GET ELEMENTS
    // =================================

    const usernameInput =
        document.getElementById(
            "username"
        );

    const passwordInput =
        document.getElementById(
            "password"
        );

    const errorBox =
        document.getElementById(
            "error"
        );


    // =================================
    // SAFETY CHECK
    // =================================

    if (
        !usernameInput ||
        !passwordInput ||
        !errorBox
    ) {

        console.error(
            "Login form elements not found."
        );

        return;

    }


    // =================================
    // GET VALUES
    // =================================

    const loginInput =
        usernameInput.value.trim();

    const password =
        passwordInput.value;


    // =================================
    // BASIC VALIDATION
    // =================================

    if (
        !loginInput ||
        !password
    ) {

        errorBox.textContent =
            "Please enter your email and password.";

        return;

    }


    // =================================
    // SHOW LOGIN STATUS
    // =================================

    errorBox.textContent =
        "Logging in...";


    // =================================
    // DISABLE LOGIN BUTTON
    // =================================

    const loginButton =
        document.querySelector(
            ".login-box button"
        );


    if (loginButton) {

        loginButton.disabled =
            true;

        loginButton.dataset.originalText =
            loginButton.textContent;

        loginButton.textContent =
            "LOGGING IN...";

    }


    try {

        // =================================
        // PREPARE EMAIL
        // =================================

        let email =
            loginInput;


        /*
            Allow either:

            admin
            jacq
            miaomiao

            or a full email:

            admin@valetholic.com
        */

        if (
            !email.includes("@")
        ) {

            email =
                `${email}@valetholic.com`;

        }


        // =================================
        // SUPABASE AUTH LOGIN
        // =================================

        const {
            data,
            error: authError
        } =
            await window.supabaseClient
                .auth
                .signInWithPassword({

                    email,

                    password

                });


        // =================================
        // AUTHENTICATION FAILED
        // =================================

        if (authError) {

            console.error(
                "Login error:",
                authError
            );

            errorBox.textContent =
                "Invalid email or password.";

            return;

        }


        // =================================
        // MAKE SURE USER EXISTS
        // =================================

        if (
            !data ||
            !data.user
        ) {

            console.error(
                "Supabase login returned no user."
            );

            errorBox.textContent =
                "Unable to sign in.";

            return;

        }


        console.log(
            "Supabase Auth user:",
            data.user
        );


        // =================================
        // GET ADMIN PROFILE
        // =================================

        const {
            data: admin,
            error: adminError
        } =
            await window.supabaseClient
                .from("Admins")
                .select(
                    "id, auth_id, username, name, email, role, is_active"
                )
                .eq(
                    "auth_id",
                    data.user.id
                )
                .maybeSingle();


        // =================================
        // ADMIN PROFILE ERROR
        // =================================

        if (adminError) {

            console.error(
                "Admin lookup error:",
                adminError
            );


            await window.supabaseClient
                .auth
                .signOut();


            errorBox.textContent =
                "Unable to verify admin account.";

            return;

        }


        // =================================
        // NOT AN ADMIN
        // =================================

        if (!admin) {

            console.error(
                "No Admins record found for:",
                data.user.id
            );


            await window.supabaseClient
                .auth
                .signOut();


            errorBox.textContent =
                "This account is not an authorised Valetholic Admin.";

            return;

        }


        // =================================
        // ACCOUNT DISABLED
        // =================================

        if (
            admin.is_active !== true
        ) {

            await window.supabaseClient
                .auth
                .signOut();


            errorBox.textContent =
                "This admin account is inactive.";

            return;

        }


        // =================================
        // SAVE ADMIN SESSION
        // =================================

        sessionStorage.setItem(
            "adminLoggedIn",
            "true"
        );


        sessionStorage.setItem(
            "adminId",
            admin.id
        );


        sessionStorage.setItem(
            "adminRole",
            admin.role || ""
        );


        sessionStorage.setItem(
            "adminUsername",
            admin.username || ""
        );


        sessionStorage.setItem(
            "adminName",
            admin.name || ""
        );


        console.log(
            "Admin login successful:",
            admin
        );


        // =================================
        // REDIRECT
        // =================================

        window.location.href =
            "admin.html";

    }


    catch (error) {

        console.error(
            "Unexpected login error:",
            error
        );


        errorBox.textContent =
            "Something went wrong. Please try again.";

    }


    finally {

        // =================================
        // RESTORE LOGIN BUTTON
        // =================================

        if (loginButton) {

            loginButton.disabled =
                false;

            loginButton.textContent =
                loginButton.dataset.originalText ||
                "LOGIN";

        }

    }

}