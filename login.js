console.log("login.js loaded");

// =====================================
// ADMIN LOGIN
// =====================================

async function login() {

    const loginInput =
        document.getElementById("username")
            .value
            .trim();

    const password =
        document.getElementById("password")
            .value;

    const errorBox =
        document.getElementById("error");


    // =====================================
    // BASIC VALIDATION
    // =====================================

    if (!loginInput || !password) {

        errorBox.textContent =
            "Please enter your email and password.";

        return;

    }


    // =====================================
    // SHOW LOGIN STATUS
    // =====================================

    errorBox.textContent =
        "Logging in...";


    try {

        // =================================
        // SUPABASE AUTH
        // =================================

        let email = loginInput;


        // Allow username such as:
        // admin
        // jacq
        // etc.
        //
        // Convert it to:
        // admin@valetholic.com

        if (!email.includes("@")) {

            email =
                `${email}@valetholic.com`;

        }


        const {
            data,
            error: authError
        } =
            await window.supabaseClient.auth
                .signInWithPassword({

                    email: email,

                    password: password

                });


        // =================================
        // LOGIN FAILED
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

        if (!data.user) {

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

            await window.supabaseClient.auth
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

            await window.supabaseClient.auth
                .signOut();

            errorBox.textContent =
                "This account is not an authorised Valetholic Admin.";

            return;

        }


        // =================================
        // ACCOUNT DISABLED
        // =================================

        if (admin.is_active !== true) {

            await window.supabaseClient.auth
                .signOut();

            errorBox.textContent =
                "This admin account is inactive.";

            return;

        }


        // =================================
        // SAVE ADMIN SESSION INFO
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
            admin.role
        );

        sessionStorage.setItem(
            "adminUsername",
            admin.username
        );

        sessionStorage.setItem(
            "adminName",
            admin.name
        );


        console.log(
            "Admin login successful:",
            admin
        );


        // =================================
        // GO TO ADMIN PORTAL
        // =================================

        window.location.href =
            "admin.html";


    } catch (error) {

        console.error(
            "Unexpected login error:",
            error
        );

        errorBox.textContent =
            "Something went wrong. Please try again.";

    }

}