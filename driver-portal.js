// =====================================
// VALETHOLIC DRIVER PORTAL
// =====================================


// =====================================
// DOM READY
// =====================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        // =================================
        // ELEMENTS
        // =================================

        const loginTab =
            document.getElementById(
                "loginTab"
            );

        const registerTab =
            document.getElementById(
                "registerTab"
            );

        const loginForm =
            document.getElementById(
                "loginForm"
            );

        const registerForm =
            document.getElementById(
                "registerForm"
            );

        const loginBtn =
            document.getElementById(
                "loginBtn"
            );

        const registerBtn =
            document.getElementById(
                "registerBtn"
            );


        // =================================
        // SAFETY CHECK
        // =================================

        if (
            !loginTab ||
            !registerTab ||
            !loginForm ||
            !registerForm ||
            !loginBtn ||
            !registerBtn
        ) {

            console.error(
                "❌ Driver portal elements are missing."
            );

            return;

        }


        // =================================
        // LOGIN TAB
        // =================================

        loginTab.addEventListener(
            "click",
            () => {

                showLoginForm();

            }
        );


        // =================================
        // REGISTER TAB
        // =================================

        registerTab.addEventListener(
            "click",
            () => {

                showRegisterForm();

            }
        );


        // =================================
        // REGISTER BUTTON
        // =================================

        registerBtn.addEventListener(
            "click",
            registerDriver
        );


        // =================================
        // LOGIN BUTTON
        // =================================

        loginBtn.addEventListener(
            "click",
            loginDriver
        );


        // =================================
        // ENTER KEY
        // =================================

        document.addEventListener(
            "keydown",
            event => {

                if (
                    event.key !==
                    "Enter"
                ) {

                    return;

                }


                const registerVisible =
                    registerForm.style.display !==
                    "none";


                if (registerVisible) {

                    registerDriver();

                }

                else {

                    loginDriver();

                }

            }
        );


        // =================================
        // FORGOT PASSWORD
        // =================================

        const forgotPassword =
            document.getElementById(
                "forgotPassword"
            );


        if (forgotPassword) {

            forgotPassword.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    handleForgotPassword();

                }
            );

        }

    }
);


// =====================================
// SHOW LOGIN
// =====================================

function showLoginForm() {

    const loginTab =
        document.getElementById(
            "loginTab"
        );

    const registerTab =
        document.getElementById(
            "registerTab"
        );

    const loginForm =
        document.getElementById(
            "loginForm"
        );

    const registerForm =
        document.getElementById(
            "registerForm"
        );


    loginForm.style.display =
        "block";

    registerForm.style.display =
        "none";


    loginTab.classList.add(
        "active"
    );

    registerTab.classList.remove(
        "active"
    );


    loginTab.setAttribute(
        "aria-selected",
        "true"
    );

    registerTab.setAttribute(
        "aria-selected",
        "false"
    );


    loginTab.focus();

}


// =====================================
// SHOW REGISTER
// =====================================

function showRegisterForm() {

    const loginTab =
        document.getElementById(
            "loginTab"
        );

    const registerTab =
        document.getElementById(
            "registerTab"
        );

    const loginForm =
        document.getElementById(
            "loginForm"
        );

    const registerForm =
        document.getElementById(
            "registerForm"
        );


    loginForm.style.display =
        "none";

    registerForm.style.display =
        "block";


    registerTab.classList.add(
        "active"
    );

    loginTab.classList.remove(
        "active"
    );


    registerTab.setAttribute(
        "aria-selected",
        "true"
    );

    loginTab.setAttribute(
        "aria-selected",
        "false"
    );


    registerTab.focus();

}


// =====================================
// REGISTER DRIVER
// =====================================

async function registerDriver() {

    const registerBtn =
        document.getElementById(
            "registerBtn"
        );


    // =================================
    // GET VALUES
    // =================================

    const name =
        document
            .getElementById(
                "regName"
            )
            .value
            .trim();


    const mobile =
        document
            .getElementById(
                "regMobile"
            )
            .value
            .trim();


    const email =
        document
            .getElementById(
                "regEmail"
            )
            .value
            .trim();


    const license =
        document
            .getElementById(
                "regLicence"
            )
            .value
            .trim();


    const ownVehicle =
        document
            .getElementById(
                "regVehicle"
            )
            .value ===
        "Yes";


    const password =
        document
            .getElementById(
                "regPassword"
            )
            .value;


    const confirmPassword =
        document
            .getElementById(
                "regConfirmPassword"
            )
            .value;


    // =================================
    // VALIDATION
    // =================================

    if (
        !name ||
        !mobile ||
        !email ||
        !password ||
        !confirmPassword
    ) {

        alert(
            "Please complete all required fields."
        );

        return;

    }


    // =================================
    // EMAIL VALIDATION
    // =================================

    const emailPattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


    if (
        !emailPattern.test(
            email
        )
    ) {

        alert(
            "Please enter a valid email address."
        );

        return;

    }


    // =================================
    // PASSWORD MATCH
    // =================================

    if (
        password !==
        confirmPassword
    ) {

        alert(
            "Passwords do not match."
        );

        return;

    }


    // =================================
    // PASSWORD LENGTH
    // =================================

    if (
        password.length < 6
    ) {

        alert(
            "Password must be at least 6 characters."
        );

        return;

    }


    // =================================
    // DISABLE BUTTON
    // =================================

    setButtonLoading(
        registerBtn,
        true,
        "CREATING ACCOUNT..."
    );


    try {

        // =================================
        // CREATE SUPABASE AUTH ACCOUNT
        // =================================

        const {
            data,
            error
        } =
            await window.supabaseClient
                .auth
                .signUp({

                    email,

                    password

                });


        if (error) {

            console.error(
                "❌ Registration auth error:",
                error
            );

            alert(
                error.message
            );

            return;

        }


        const user =
            data?.user;


        // =================================
        // SAFETY CHECK
        // =================================

        if (!user) {

            alert(
                "Your account could not be created. Please try again."
            );

            return;

        }


        console.log(
            "👤 Driver auth account created:",
            user.id
        );


        // =================================
        // CREATE DRIVER PROFILE
        // =================================

        const {
            error: profileError
        } =
            await window.supabaseClient
                .from("Drivers")
                .insert({

                    auth_id:
                        user.id,

                    name:
                        name,

                    mobile:
                        mobile,

                    email:
                        email,

                    license:
                        license,

                    own_vehicle:
                        ownVehicle,

                    // =========================
                    // APPROVAL SYSTEM
                    // =========================

                    approved:
                        false,

                    approval_status:
                        "PENDING",

                    status:
                        "OFF DUTY"

                });


        // =================================
        // PROFILE ERROR
        // =================================

        if (profileError) {

            console.error(
                "❌ Driver profile creation error:",
                profileError
            );


            alert(
                "Your login account was created, " +
                "but your driver profile could not be created.\n\n" +
                profileError.message
            );

            return;

        }


        // =================================
        // SUCCESS
        // =================================

        console.log(
            "✅ Driver registration completed."
        );


        alert(
            "Registration successful! 🎉\n\n" +
            "Your driver application has been submitted " +
            "and is now waiting for Admin approval."
        );


        // =================================
        // GO TO DASHBOARD
        // =================================

        window.location.href =
            "dashboard.html";

    }

    catch (error) {

        console.error(
            "❌ Unexpected registration error:",
            error
        );


        alert(
            "Something went wrong during registration.\n\n" +
            "Please try again."
        );

    }

    finally {

        setButtonLoading(
            registerBtn,
            false,
            "CREATE ACCOUNT"
        );

    }

}


// =====================================
// LOGIN DRIVER
// =====================================

async function loginDriver() {

    const loginBtn =
        document.getElementById(
            "loginBtn"
        );


    // =================================
    // GET VALUES
    // =================================

    const email =
        document
            .getElementById(
                "loginEmail"
            )
            .value
            .trim();


    const password =
        document
            .getElementById(
                "loginPassword"
            )
            .value;


    // =================================
    // VALIDATION
    // =================================

    if (
        !email ||
        !password
    ) {

        alert(
            "Please enter your email and password."
        );

        return;

    }


    // =================================
    // DISABLE BUTTON
    // =================================

    setButtonLoading(
        loginBtn,
        true,
        "LOGGING IN..."
    );


    try {

        // =================================
        // SUPABASE LOGIN
        // =================================

        const {
            data,
            error
        } =
            await window.supabaseClient
                .auth
                .signInWithPassword({

                    email,

                    password

                });


        if (error) {

            console.error(
                "❌ Login error:",
                error
            );


            alert(
                getLoginErrorMessage(
                    error
                )
            );

            return;

        }


        // =================================
        // LOGIN SUCCESS
        // =================================

        console.log(
            "✅ Driver logged in:",
            data?.user?.id
        );


        // =================================
        // GO TO DASHBOARD
        // =================================

        window.location.href =
            "dashboard.html";

    }

    catch (error) {

        console.error(
            "❌ Unexpected login error:",
            error
        );


        alert(
            "Something went wrong while logging in.\n\n" +
            "Please try again."
        );

    }

    finally {

        setButtonLoading(
            loginBtn,
            false,
            "LOGIN"
        );

    }

}


// =====================================
// FORGOT PASSWORD
// =====================================

async function handleForgotPassword() {

    const emailInput =
        document.getElementById(
            "loginEmail"
        );


    const email =
        emailInput
            ?.value
            ?.trim();


    if (!email) {

        alert(
            "Enter your email address first, " +
            "then click Forgot Password."
        );

        emailInput?.focus();

        return;

    }


    try {

        const {
            error
        } =
            await window.supabaseClient
                .auth
                .resetPasswordForEmail(
                    email,
                    {
                        redirectTo:
                            `${window.location.origin}/reset-password.html`
                    }
                );


        if (error) {

            console.error(
                "❌ Password reset error:",
                error
            );

            alert(
                error.message
            );

            return;

        }


        alert(
            "Password reset email sent. 📧\n\n" +
            "Please check your inbox."
        );

    }

    catch (error) {

        console.error(
            "❌ Unexpected password reset error:",
            error
        );


        alert(
            "Unable to send the password reset email."
        );

    }

}


// =====================================
// LOGIN ERROR MESSAGE
// =====================================

function getLoginErrorMessage(
    error
) {

    const message =
        String(
            error?.message ||
            ""
        ).toLowerCase();


    if (
        message.includes(
            "invalid login credentials"
        )
    ) {

        return (
            "Incorrect email or password."
        );

    }


    if (
        message.includes(
            "email not confirmed"
        )
    ) {

        return (
            "Please confirm your email address before logging in."
        );

    }


    return (
        error?.message ||
        "Unable to log in."
    );

}


// =====================================
// BUTTON LOADING STATE
// =====================================

function setButtonLoading(
    button,
    loading,
    loadingText
) {

    if (!button) {

        return;

    }


    if (loading) {

        if (
            !button.dataset.originalText
        ) {

            button.dataset.originalText =
                button.textContent.trim();

        }


        button.disabled =
            true;

        button.textContent =
            loadingText;

        button.style.opacity =
            "0.65";

        button.style.cursor =
            "wait";

    }

    else {

        button.disabled =
            false;

        button.textContent =
            button.dataset.originalText ||
            button.textContent;

        button.style.opacity =
            "";

        button.style.cursor =
            "";

    }

}