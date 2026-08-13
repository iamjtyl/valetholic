// =====================================
// VALETHOLIC ADMIN
// =====================================

// =====================================
// LOGIN CHECK
// =====================================

if (
    sessionStorage.getItem("adminLoggedIn") !== "true"
) {

    window.location.href = "login.html";

}


// =====================================
// GLOBAL VARIABLES
// =====================================

let currentBookingId = null;

let currentAdmin = null;

let adminPermissions = [];


// =====================================
// LOAD CURRENT ADMIN
// =====================================

async function loadCurrentAdmin() {

    const {
        data: admin,
        error
    } =
        await window.supabaseClient
            .from("Admins")
            .select("*")
            .eq(
                "username",
                "admin"
            )
            .single();


    if (error) {

        console.error(
            "Admin loading error:",
            error
        );

        return;

    }


    currentAdmin = admin;


    // =================================
    // LOAD CURRENT ADMIN PERMISSIONS
    // =================================

    const {
        data: permissions,
        error: permissionError
    } =
        await window.supabaseClient
            .from("AdminPermissions")
            .select("permission")
            .eq(
                "admin_id",
                admin.id
            );


    if (permissionError) {

        console.error(
            "Permission loading error:",
            permissionError
        );

        return;

    }


    adminPermissions =
        (permissions || [])
            .map(
                item => item.permission
            );


    console.log(
        "Current admin:",
        currentAdmin
    );


    console.log(
        "Permissions:",
        adminPermissions
    );


    applyAdminPermissions();


    // Load admin management table
    await loadAdmins();

}


// =====================================
// CHECK PERMISSION
// =====================================

function hasPermission(
    permission
) {

    // Master always has access

    if (
        currentAdmin &&
        currentAdmin.role === "MASTER"
    ) {

        return true;

    }


    return adminPermissions.includes(
        permission
    );

}


// =====================================
// SHOW / HIDE ADMIN MANAGEMENT
// =====================================

function applyAdminPermissions() {

    const adminManagement =
        document.getElementById(
            "adminManagement"
        );


    if (!adminManagement) {

        return;

    }


    if (
        hasPermission(
            "manage_admins"
        )
    ) {

        adminManagement.style.display =
            "block";

    } else {

        adminManagement.style.display =
            "none";

    }

}


// =====================================
// LOAD DASHBOARD
// =====================================

async function loadDashboard() {


    // =================================
    // LOAD BOOKINGS
    // =================================

    const {
        data: bookings,
        error
    } =
        await window.supabaseClient
            .from("Bookings")
            .select("*")
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


    if (error) {

        console.error(
            "Booking loading error:",
            error
        );

        return;

    }


    const bookingData =
        bookings || [];


    // =================================
    // SEARCH
    // =================================

    const keyword =
        document
            .getElementById(
                "searchBooking"
            )
            ?.value
            .toLowerCase()
            .trim() || "";


    const statusFilter =
        document
            .getElementById(
                "statusFilter"
            )
            ?.value || "All";


    // =================================
    // DASHBOARD COUNTS
    // =================================

    const totalBookings =
        document.getElementById(
            "totalBookings"
        );

    const pendingBookings =
        document.getElementById(
            "pendingBookings"
        );

    const completedBookings =
        document.getElementById(
            "completedBookings"
        );

    const todayBookings =
        document.getElementById(
            "todayBookings"
        );


    if (totalBookings) {

        totalBookings.textContent =
            bookingData.length;

    }


    if (pendingBookings) {

        pendingBookings.textContent =
            bookingData.filter(
                booking =>
                    booking.status ===
                    "Pending"
            ).length;

    }


    if (completedBookings) {

        completedBookings.textContent =
            bookingData.filter(
                booking =>
                    booking.status ===
                    "Completed"
            ).length;

    }


    // =================================
    // TODAY'S BOOKINGS
    // =================================

    const today =
        new Date()
            .toISOString()
            .split("T")[0];


    if (todayBookings) {

        todayBookings.textContent =
            bookingData.filter(
                booking =>
                    booking.created_at &&
                    booking.created_at.startsWith(
                        today
                    )
            ).length;

    }


    // =================================
    // BOOKING TABLE
    // =================================

    const table =
        document.getElementById(
            "bookingTable"
        );


    if (table) {

        table.innerHTML = "";


        const filteredBookings =
            bookingData.filter(
                booking => {

                    const customer =
                        (
                            booking.customer_name ||
                            ""
                        )
                            .toLowerCase();


                    const mobile =
                        (
                            booking.mobile ||
                            ""
                        )
                            .toLowerCase();


                    const reference =
                        (
                            "VH-" +
                            (
                                booking.reference_no ||
                                ""
                            )
                        )
                            .toLowerCase();


                    const matchSearch =
                        customer.includes(
                            keyword
                        ) ||
                        mobile.includes(
                            keyword
                        ) ||
                        reference.includes(
                            keyword
                        );


                    const matchStatus =
                        statusFilter ===
                            "All" ||
                        booking.status ===
                            statusFilter;


                    return (
                        matchSearch &&
                        matchStatus
                    );

                }
            );


        if (
            filteredBookings.length ===
            0
        ) {

            table.innerHTML = `
                <tr>
                    <td colspan="8">
                        No bookings found.
                    </td>
                </tr>
            `;

        } else {

            filteredBookings.forEach(
                booking => {


                    let pickup = "-";

                    let destination = "-";


                    // -----------------------------
                    // PICKUP
                    // -----------------------------

                    try {

                        if (
                            Array.isArray(
                                booking.pickups
                            )
                        ) {

                            pickup =
                                booking.pickups.join(
                                    "<br>"
                                );

                        }

                        else if (
                            booking.pickups
                        ) {

                            pickup =
                                JSON.parse(
                                    booking.pickups
                                )[0];

                        }

                    } catch {

                        pickup =
                            booking.pickups ||
                            "-";

                    }


                    // -----------------------------
                    // DESTINATION
                    // -----------------------------

                    try {

                        if (
                            Array.isArray(
                                booking.destinations
                            )
                        ) {

                            destination =
                                booking.destinations.join(
                                    "<br>"
                                );

                        }

                        else if (
                            booking.destinations
                        ) {

                            destination =
                                JSON.parse(
                                    booking.destinations
                                )[0];

                        }

                    } catch {

                        destination =
                            booking.destinations ||
                            "-";

                    }


                    table.innerHTML += `

                        <tr>

                            <td>
                                VH-${
                                    booking.reference_no ||
                                    "----"
                                }
                            </td>

                            <td>
                                ${
                                    booking.customer_name ||
                                    "-"
                                }
                            </td>

                            <td>
                                ${
                                    booking.mobile ||
                                    "-"
                                }
                            </td>

                            <td>
                                ${pickup}
                            </td>

                            <td>
                                ${destination}
                            </td>

                            <td>
                                ${
                                    booking.booking_date ||
                                    "-"
                                }
                            </td>

                            <td>
                                ${
                                    booking.status ||
                                    "-"
                                }
                            </td>

                            <td>

                                <button
                                    class="view-btn"
                                    onclick="
                                        viewBooking(
                                            '${booking.id}'
                                        )
                                    "
                                >
                                    OPEN
                                </button>

                            </td>

                        </tr>

                    `;

                }
            );

        }

    }


    // =================================
    // LOAD DRIVER APPLICATIONS
    // =================================

    const {
        data: drivers,
        error: driverError
    } =
        await window.supabaseClient
            .from("Drivers")
            .select(
                "id, approved, approval_status"
            );


    const pendingDrivers =
        (drivers || [])
            .filter(
                driver =>
                    driver.approval_status ===
                    "PENDING"
            ).length;


    const pendingDriverCount =
        document.getElementById(
            "pendingDrivers"
        );


    if (pendingDriverCount) {

        pendingDriverCount.textContent =
            pendingDrivers;

    }


    if (driverError) {

        console.error(
            "Driver loading error:",
            driverError
        );

        return;

    }


    // =================================
    // DRIVER APPLICATION LIST
    // =================================

    const {
        data: driverApplications,
        error: applicationsError
    } =
        await window.supabaseClient
            .from("Drivers")
            .select("*")
            .eq(
                "approval_status",
                "PENDING"
            )
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


    const driverTable =
        document.getElementById(
            "driverTable"
        );


    if (!driverTable) {

        return;

    }


    if (applicationsError) {

        console.error(
            "Driver applications error:",
            applicationsError
        );

        driverTable.innerHTML = `
            <tr>
                <td colspan="6">
                    Unable to load driver applications.
                </td>
            </tr>
        `;

        return;

    }


    if (
        !driverApplications ||
        driverApplications.length === 0
    ) {

        driverTable.innerHTML = `
            <tr>
                <td colspan="6">
                    No pending driver applications.
                </td>
            </tr>
        `;

        return;

    }


    driverTable.innerHTML = "";


    driverApplications.forEach(
        driver => {

            driverTable.innerHTML += `

                <tr>

                    <td>
                        ${
                            driver.name ||
                            "-"
                        }
                    </td>

                    <td>
                        ${
                            driver.mobile ||
                            "-"
                        }
                    </td>

                    <td>
                        ${
                            driver.license ||
                            "-"
                        }
                    </td>

                    <td>
                        ${
                            driver.own_vehicle
                                ? "Yes"
                                : "No"
                        }
                    </td>

                    <td>
                        <span class="pending-status">
                            PENDING
                        </span>
                    </td>

                    <td>

                        <button
                            onclick="
                                approveDriver(
                                    '${driver.id}'
                                )
                            "
                        >
                            APPROVE
                        </button>

                        <button
                            class="reject-btn"
                            onclick="
                                rejectDriver(
                                    '${driver.id}'
                                )
                            "
                        >
                            REJECT
                        </button>

                    </td>

                </tr>

            `;

        }
    );

}


// =====================================
// LOAD ALL ADMINS
// =====================================

async function loadAdmins() {

    const adminTable =
        document.getElementById(
            "adminTable"
        );


    if (!adminTable) {

        console.error(
            "adminTable not found."
        );

        return;

    }


    try {

        // =================================
        // LOAD ADMINS
        // =================================

        const {
            data: admins,
            error: adminError
        } =
            await window.supabaseClient
                .from("Admins")
                .select(
                    "id, username, name, email, role, is_active"
                )
                .order(
                    "created_at",
                    {
                        ascending: true
                    }
                );


        if (adminError) {

            console.error(
                "Admin loading error:",
                adminError
            );

            adminTable.innerHTML = `
                <tr>
                    <td colspan="5">
                        Unable to load admins.
                    </td>
                </tr>
            `;

            return;

        }


        console.log(
            "ADMINS LOADED:",
            admins
        );


        if (
            !admins ||
            admins.length === 0
        ) {

            adminTable.innerHTML = `
                <tr>
                    <td colspan="5">
                        No admins found.
                    </td>
                </tr>
            `;

            return;

        }


        // =================================
        // LOAD ALL PERMISSIONS AT ONCE
        // =================================

        const {
            data: allPermissions,
            error: permissionError
        } =
            await window.supabaseClient
                .from("AdminPermissions")
                .select(
                    "admin_id, permission"
                );


        if (permissionError) {

            console.error(
                "Permission loading error:",
                permissionError
            );

            adminTable.innerHTML = `
                <tr>
                    <td colspan="5">
                        Unable to load permissions.
                    </td>
                </tr>
            `;

            return;

        }


        console.log(
            "ALL PERMISSIONS LOADED:",
            allPermissions
        );


        // =================================
        // CLEAR TABLE
        // =================================

        adminTable.innerHTML = "";


        // =================================
        // RENDER ADMINS
        // =================================

        admins.forEach(
            admin => {


                // =================================
                // MASTER
                // =================================

                if (
                    admin.role ===
                    "MASTER"
                ) {

                    adminTable.innerHTML += `

                        <tr>

                            <td>
                                ${
                                    admin.name ||
                                    "-"
                                }
                            </td>

                            <td>
                                ${
                                    admin.username ||
                                    "-"
                                }
                            </td>

                            <td>
                                👑 MASTER
                            </td>

                            <td>
                                Full Access
                            </td>

                            <td>
                                MASTER
                            </td>

                        </tr>

                    `;

                    return;

                }


                // =================================
                // MATCH PERMISSIONS BY ADMIN ID
                // =================================

                const adminPermissionsForRow =
                    (allPermissions || [])
                        .filter(
                            permissionRow =>
                                String(
                                    permissionRow.admin_id
                                ).trim() ===
                                String(
                                    admin.id
                                ).trim()
                        )
                        .map(
                            permissionRow =>
                                permissionRow.permission
                        );


                console.log(
                    "ADMIN:",
                    admin.username,
                    "ID:",
                    admin.id,
                    "PERMISSIONS:",
                    adminPermissionsForRow
                );


                // =================================
                // FORMAT PERMISSIONS
                // =================================

                let permissionText =
                    "No Permissions";


                if (
                    adminPermissionsForRow.length >
                    0
                ) {

                    permissionText =
                        adminPermissionsForRow
                            .map(
                                permission =>
                                    permission
                                        .replaceAll(
                                            "_",
                                            " "
                                        )
                                        .replace(
                                            /\b\w/g,
                                            letter =>
                                                letter.toUpperCase()
                                        )
                            )
                            .join(
                                ", "
                            );

                }


                // =================================
                // ROLE DISPLAY
                // =================================

                let roleDisplay =
                    admin.role ||
                    "-";


                if (
                    admin.role ===
                    "SEMI-MASTER"
                ) {

                    roleDisplay =
                        "🛡️ SEMI-MASTER";

                }

                else if (
                    admin.role ===
                    "ADMIN"
                ) {

                    roleDisplay =
                        "ADMIN";

                }


                // =================================
                // ADD ROW
                // =================================

                adminTable.innerHTML += `

                    <tr>

                        <td>
                            ${
                                admin.name ||
                                "-"
                            }
                        </td>

                        <td>
                            ${
                                admin.username ||
                                "-"
                            }
                        </td>

                        <td>
                            ${roleDisplay}
                        </td>

                        <td>
                            ${permissionText}
                        </td>

                        <td>
                            VIEW
                        </td>

                    </tr>

                `;

            }
        );


        console.log(
            "ADMIN TABLE RENDERED:",
            admins.length
        );


    } catch (error) {

        console.error(
            "Unexpected admin loading error:",
            error
        );

        adminTable.innerHTML = `
            <tr>
                <td colspan="5">
                    Unable to load admins.
                </td>
            </tr>
        `;

    }

}


// =====================================
// OPEN ADD ADMIN MODAL
// =====================================

function openAddAdmin() {

    const modal =
        document.getElementById(
            "addAdminModal"
        );


    if (!modal) {

        console.error(
            "Add Admin modal not found."
        );

        return;

    }


    document.getElementById(
        "newAdminName"
    ).value = "";


    document.getElementById(
        "newAdminUsername"
    ).value = "";


    document.getElementById(
        "newAdminPassword"
    ).value = "";


    document.getElementById(
        "newAdminConfirmPassword"
    ).value = "";


    document.getElementById(
        "newAdminRole"
    ).value = "ADMIN";


    setAdminPermissions(
        "ADMIN"
    );


    modal.style.display =
        "flex";

}


// =====================================
// CLOSE ADD ADMIN MODAL
// =====================================

function closeAddAdmin() {

    const modal =
        document.getElementById(
            "addAdminModal"
        );


    if (!modal) {

        return;

    }


    modal.style.display =
        "none";

}


// =====================================
// ROLE → PERMISSIONS
// =====================================

function setAdminPermissions(
    role
) {

    const viewBookings =
        document.getElementById(
            "permViewBookings"
        );

    const manageBookings =
        document.getElementById(
            "permManageBookings"
        );

    const approveDrivers =
        document.getElementById(
            "permApproveDrivers"
        );

    const viewDrivers =
        document.getElementById(
            "permViewDrivers"
        );

    const viewGPS =
        document.getElementById(
            "permViewGPS"
        );

    const manageAdmins =
        document.getElementById(
            "permManageAdmins"
        );

    const systemSettings =
        document.getElementById(
            "permSystemSettings"
        );


    // =================================
    // NORMAL ADMIN
    // =================================

    if (
        role === "ADMIN"
    ) {

        viewBookings.checked =
            true;

        manageBookings.checked =
            true;

        approveDrivers.checked =
            false;

        viewDrivers.checked =
            true;

        viewGPS.checked =
            true;

        manageAdmins.checked =
            false;

        systemSettings.checked =
            false;

    }


    // =================================
    // SEMI-MASTER
    // =================================

    if (
        role === "SEMI-MASTER"
    ) {

        viewBookings.checked =
            true;

        manageBookings.checked =
            true;

        approveDrivers.checked =
            true;

        viewDrivers.checked =
            true;

        viewGPS.checked =
            true;

        manageAdmins.checked =
            true;

        systemSettings.checked =
            false;

    }

}


// =====================================
// ROLE CHANGE
// =====================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const roleSelect =
            document.getElementById(
                "newAdminRole"
            );


        if (!roleSelect) {

            return;

        }


        roleSelect.addEventListener(
            "change",
            () => {

                setAdminPermissions(
                    roleSelect.value
                );

            }
        );

    }
);


// =====================================
// CREATE ADMIN
// =====================================

async function createAdmin() {

    const name =
        document
            .getElementById(
                "newAdminName"
            )
            .value
            .trim();


    const username =
        document
            .getElementById(
                "newAdminUsername"
            )
            .value
            .trim();


    const password =
        document.getElementById(
            "newAdminPassword"
        ).value;


    const confirmPassword =
        document.getElementById(
            "newAdminConfirmPassword"
        ).value;


    const role =
        document.getElementById(
            "newAdminRole"
        ).value;


    // =================================
    // VALIDATION
    // =================================

    if (
        !name ||
        !username ||
        !password ||
        !confirmPassword
    ) {

        alert(
            "Please fill in all fields."
        );

        return;

    }


    if (
        password !==
        confirmPassword
    ) {

        alert(
            "Passwords do not match."
        );

        return;

    }


    if (
        password.length < 6
    ) {

        alert(
            "Password must be at least 6 characters."
        );

        return;

    }


    // =================================
    // EMAIL
    // =================================

    const email =
        username.includes("@")
            ? username
            : `${username}@valetholic.com`;


    // =================================
    // COLLECT PERMISSIONS
    // =================================

    const permissions = [];


    if (
        document.getElementById(
            "permViewBookings"
        ).checked
    ) {

        permissions.push(
            "view_bookings"
        );

    }


    if (
        document.getElementById(
            "permManageBookings"
        ).checked
    ) {

        permissions.push(
            "manage_bookings"
        );

    }


    if (
        document.getElementById(
            "permApproveDrivers"
        ).checked
    ) {

        permissions.push(
            "approve_drivers"
        );

    }


    if (
        document.getElementById(
            "permViewDrivers"
        ).checked
    ) {

        permissions.push(
            "view_drivers"
        );

    }


    if (
        document.getElementById(
            "permViewGPS"
        ).checked
    ) {

        permissions.push(
            "view_gps"
        );

    }


    if (
        document.getElementById(
            "permManageAdmins"
        ).checked
    ) {

        permissions.push(
            "manage_admins"
        );

    }


    if (
        document.getElementById(
            "permSystemSettings"
        ).checked
    ) {

        permissions.push(
            "system_settings"
        );

    }


    console.log(
        "Permissions being sent:",
        permissions
    );


    // =================================
    // BUTTON
    // =================================

    const button =
        document.querySelector(
            "#addAdminModal .gold-btn"
        );


    if (button) {

        button.disabled =
            true;

        button.textContent =
            "CREATING...";

    }


    try {

        // =================================
        // CHECK SUPABASE SESSION
        // =================================

        const {
            data: {
                user
            },
            error: userError
        } =
            await window.supabaseClient
                .auth
                .getUser();


        if (
            userError ||
            !user
        ) {

            alert(
                "Your Master Admin session is not connected to Supabase Auth.\n\nPlease log in again using the Master Admin account."
            );

            return;

        }


        console.log(
            "Creating admin as:",
            user.email
        );


        // =================================
        // CALL EDGE FUNCTION
        // =================================

        const {
            data,
            error
        } =
            await window.supabaseClient
                .functions
                .invoke(
                    "create-admin",
                    {

                        body: {

                            name:
                                name,

                            username:
                                username,

                            email:
                                email,

                            password:
                                password,

                            role:
                                role,

                            permissions:
                                permissions

                        }

                    }
                );


        if (error) {

            console.error(
                "Create admin error:",
                error
            );

            alert(
                "Unable to create admin.\n\n" +
                error.message
            );

            return;

        }


        // =================================
        // EDGE FUNCTION ERROR
        // =================================

        if (
            !data ||
            data.error
        ) {

            alert(
                data?.error ||
                "Unable to create admin."
            );

            return;

        }


        // =================================
        // SUCCESS
        // =================================

        alert(
            "Admin account created successfully! 👑"
        );


        closeAddAdmin();


        await loadAdmins();


    } catch (error) {

        console.error(
            "Create admin error:",
            error
        );

        alert(
            "Something went wrong.\n\n" +
            error.message
        );


    } finally {

        if (button) {

            button.disabled =
                false;

            button.textContent =
                "CREATE ADMIN";

        }

    }

}


// =====================================
// VIEW BOOKING
// =====================================

function viewBooking(
    id
) {

    window.location.href =
        `ops-booking.html?id=${id}`;

}


// =====================================
// MARK BOOKING COMPLETED
// =====================================

async function markCompleted() {

    console.log(
        "markCompleted clicked"
    );

    console.log(
        currentBookingId
    );


    if (!currentBookingId) {

        alert(
            "No booking ID!"
        );

        return;

    }


    const confirmComplete =
        confirm(
            "Mark this booking as Completed?"
        );


    if (!confirmComplete) {

        return;

    }


    const {
        error
    } =
        await window.supabaseClient
            .from("Bookings")
            .update({
                status:
                    "Completed"
            })
            .eq(
                "reference_no",
                "2027"
            );


    if (error) {

        console.error(
            error
        );

        alert(
            error.message
        );

        return;

    }


    const bookingModal =
        document.getElementById(
            "bookingModal"
        );


    if (bookingModal) {

        bookingModal.style.display =
            "none";

    }


    await loadDashboard();

}


// =====================================
// LOGOUT
// =====================================

function logout() {

    sessionStorage.removeItem(
        "adminLoggedIn"
    );


    window.location.href =
        "login.html";

}


// =====================================
// APPROVE DRIVER
// =====================================

async function approveDriver(
    driverId
) {

    const confirmed =
        confirm(
            "Approve this driver?"
        );


    if (!confirmed) {

        return;

    }


    const {
        error
    } =
        await window.supabaseClient
            .from("Drivers")
            .update({

                approved:
                    true,

                approval_status:
                    "APPROVED",

                status:
                    "OFF DUTY"

            })
            .eq(
                "id",
                driverId
            );


    if (error) {

        console.error(
            "Approve driver error:",
            error
        );

        alert(
            error.message
        );

        return;

    }


    alert(
        "Driver approved successfully! 🚗"
    );


    await loadDashboard();

}


// =====================================
// REJECT DRIVER
// =====================================

async function rejectDriver(
    driverId
) {

    const confirmed =
        confirm(
            "Reject this driver application?"
        );


    if (!confirmed) {

        return;

    }


    const {
        error
    } =
        await window.supabaseClient
            .from("Drivers")
            .update({

                approved:
                    false,

                approval_status:
                    "REJECTED"

            })
            .eq(
                "id",
                driverId
            );


    if (error) {

        console.error(
            "Reject driver error:",
            error
        );

        alert(
            error.message
        );

        return;

    }


    alert(
        "Driver application rejected."
    );


    await loadDashboard();

}


// =====================================
// CLOSE BOOKING MODAL
// =====================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const closeButton =
            document.querySelector(
                ".close-modal"
            );


        if (closeButton) {

            closeButton.onclick =
                function () {

                    const modal =
                        document.getElementById(
                            "bookingModal"
                        );


                    if (modal) {

                        modal.style.display =
                            "none";

                    }

                };

        }


        // -----------------------------
        // CLICK OUTSIDE BOOKING MODAL
        // -----------------------------

        window.addEventListener(
            "click",
            event => {

                const modal =
                    document.getElementById(
                        "bookingModal"
                    );


                if (
                    modal &&
                    event.target === modal
                ) {

                    modal.style.display =
                        "none";

                }

            }
        );

    }
);


// =====================================
// CLOSE ADD ADMIN WHEN CLICKING OUTSIDE
// =====================================

window.addEventListener(
    "click",
    event => {

        const modal =
            document.getElementById(
                "addAdminModal"
            );


        if (
            modal &&
            event.target === modal
        ) {

            closeAddAdmin();

        }

    }
);


// =====================================
// START
// =====================================

loadCurrentAdmin();

loadDashboard();