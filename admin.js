// =====================================
// VALETHOLIC ADMIN
// =====================================


// =====================================
// LOGIN CHECK
// =====================================

if (
    sessionStorage.getItem("adminLoggedIn") !== "true"
) {

    window.location.href =
        "login.html";

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

        console.error(
            "Unable to get current Supabase user:",
            userError
        );

        return;

    }


    console.log(
        "Current Supabase user:",
        user
    );


    // =================================
    // FIND ADMIN BY EMAIL
    // =================================

    const {
        data: admin,
        error
    } =
        await window.supabaseClient
            .from("Admins")
            .select("*")
            .eq(
                "email",
                user.email
            )
            .single();


    if (error) {

        console.error(
            "Admin loading error:",
            error
        );

        return;

    }


    if (!admin) {

        console.error(
            "No admin record found."
        );

        return;

    }


    currentAdmin =
        admin;


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
                item =>
                    item.permission
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


    // =================================
    // LOAD ADMIN MANAGEMENT
    // =================================

    await loadAdmins();

}


// =====================================
// CHECK PERMISSION
// =====================================

function hasPermission(
    permission
) {

    // =================================
    // MASTER ALWAYS HAS ACCESS
    // =================================

    if (
        currentAdmin &&
        currentAdmin.role ===
            "MASTER"
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

    }

    else {

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
                    String(
                        booking.status ||
                        ""
                    )
                    .trim()
                    .toUpperCase() ===
                    "PENDING"
            ).length;

    }


    if (completedBookings) {

        completedBookings.textContent =
            bookingData.filter(
                booking =>
                    String(
                        booking.status ||
                        ""
                    )
                    .trim()
                    .toUpperCase() ===
                    "COMPLETED"
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

        table.innerHTML =
            "";


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

        }

        else {

            filteredBookings.forEach(
                booking => {

                    let pickup =
                        "-";


                    let destination =
                        "-";


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

                            const parsed =
                                JSON.parse(
                                    booking.pickups
                                );


                            pickup =
                                Array.isArray(
                                    parsed
                                )
                                    ? parsed.join(
                                        "<br>"
                                    )
                                    : parsed;

                        }

                    }

                    catch {

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

                            const parsed =
                                JSON.parse(
                                    booking.destinations
                                );


                            destination =
                                Array.isArray(
                                    parsed
                                )
                                    ? parsed.join(
                                        "<br>"
                                    )
                                    : parsed;

                        }

                    }

                    catch {

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
    // LOAD DRIVERS
    // =================================

    await loadDrivers();

}


// =====================================
// CHECK IF DRIVER IS APPROVED
// =====================================

function isApprovedDriver(
    driver
) {

    const approvalStatus =
        String(
            driver.approval_status ||
            ""
        )
        .trim()
        .toUpperCase();


    return (
        driver.approved === true ||
        approvalStatus ===
            "APPROVED"
    );

}


// =====================================
// CHECK IF DRIVER IS PENDING
// =====================================

function isPendingDriver(
    driver
) {

    const approvalStatus =
        String(
            driver.approval_status ||
            ""
        )
        .trim()
        .toUpperCase();


    return (
        approvalStatus ===
        "PENDING"
    );

}


// =====================================
// CHECK IF DRIVER HAS ACTIVE JOB
// =====================================

function driverHasActiveJob(
    driver,
    bookingData
) {

    if (!bookingData) {

        return false;

    }


    const activeStatuses = [
        "ON JOB",
        "ON THE WAY",
        "PICKED UP"
    ];


    return bookingData.some(
        booking => {

            if (
                booking.driver_id !==
                driver.auth_id
            ) {

                return false;

            }


            const bookingStatus =
                String(
                    booking.status ||
                    ""
                )
                .trim()
                .toUpperCase();


            return activeStatuses.includes(
                bookingStatus
            );

        }
    );

}


// =====================================
// LOAD DRIVERS
// =====================================

async function loadDrivers() {

    const {
        data: drivers,
        error
    } =
        await window.supabaseClient
            .from("Drivers")
            .select("*")
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


    if (error) {

        console.error(
            "Driver loading error:",
            error
        );

        return;

    }


    const driverData =
        drivers || [];


    // =================================
    // APPROVED DRIVERS
    // =================================

    const approvedDrivers =
        driverData.filter(
            isApprovedDriver
        );


    // =================================
    // PENDING DRIVERS
    // =================================

    const pendingDrivers =
        driverData.filter(
            isPendingDriver
        );


    // =================================
    // DRIVER COUNT
    // =================================

    const driverCount =
        document.getElementById(
            "driverCount"
        );


    if (driverCount) {

        driverCount.textContent =
            approvedDrivers.length;

    }


    // =================================
    // PENDING DRIVER COUNT
    // =================================

    const pendingDriverCount =
        document.getElementById(
            "pendingDrivers"
        );


    if (pendingDriverCount) {

        pendingDriverCount.textContent =
            pendingDrivers.length;

    }


    // =================================
    // LOAD PENDING TABLE
    // =================================

    await renderPendingDrivers(
        pendingDrivers
    );


    // =================================
    // LOAD APPROVED TABLE
    // =================================

    await renderApprovedDrivers(
        approvedDrivers
    );

}


// =====================================
// RENDER PENDING DRIVERS
// =====================================

async function renderPendingDrivers(
    pendingDrivers
) {

    const driverTable =
        document.getElementById(
            "driverTable"
        );


    if (!driverTable) {

        return;

    }


    if (
        !pendingDrivers ||
        pendingDrivers.length ===
            0
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


    driverTable.innerHTML =
        "";


    pendingDrivers.forEach(
        driver => {

            driverTable.innerHTML += `

                <tr>

                    <td>
                        ${
                            escapeHTML(
                                driver.name ||
                                "-"
                            )
                        }
                    </td>

                    <td>
                        ${
                            escapeHTML(
                                driver.mobile ||
                                "-"
                            )
                        }
                    </td>

                    <td>
                        ${
                            escapeHTML(
                                driver.license ||
                                "-"
                            )
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
// RENDER APPROVED DRIVERS
// =====================================

async function renderApprovedDrivers(
    approvedDrivers
) {

    const approvedDriverTable =
        document.getElementById(
            "approvedDriverTable"
        );


    if (!approvedDriverTable) {

        return;

    }


    if (
        !approvedDrivers ||
        approvedDrivers.length ===
            0
    ) {

        approvedDriverTable.innerHTML = `
            <tr>
                <td colspan="5">
                    No approved drivers.
                </td>
            </tr>
        `;

        return;

    }


    approvedDriverTable.innerHTML =
        "";


    // =================================
    // LOAD BOOKINGS
    // =================================

    const {
        data: bookings,
        error
    } =
        await window.supabaseClient
            .from("Bookings")
            .select(
                "id, driver_id, status"
            );


    if (error) {

        console.error(
            "Unable to load bookings for driver status:",
            error
        );

    }


    approvedDrivers.forEach(
        driver => {

            const activeJob =
                driverHasActiveJob(
                    driver,
                    bookings || []
                );


            let driverStatus =
                driver.status ||
                "OFF DUTY";


            driverStatus =
                String(
                    driverStatus
                )
                .trim()
                .toUpperCase();


            let statusDisplay =
                driverStatus;


            if (
                driverStatus ===
                "ON DUTY"
            ) {

                statusDisplay =
                    "🟢 ON DUTY";

            }

            else if (
                driverStatus ===
                "OFF DUTY"
            ) {

                statusDisplay =
                    "⚪ OFF DUTY";

            }

            else if (
                driverStatus ===
                "ON JOB"
            ) {

                statusDisplay =
                    "🟡 ON JOB";

            }

            else if (
                driverStatus ===
                "ON THE WAY"
            ) {

                statusDisplay =
                    "🚗 ON THE WAY";

            }

            else if (
                driverStatus ===
                "PICKED UP"
            ) {

                statusDisplay =
                    "🟢 PICKED UP";

            }


            const removeButton =
                activeJob
                    ? `
                        <button
                            disabled
                            title="Driver has an active job."
                            style="
                                opacity:.5;
                                cursor:not-allowed;
                            "
                        >
                            ACTIVE JOB
                        </button>
                      `
                    : `
                        <button
                            class="reject-btn"
                            onclick="
                                removeDriver(
                                    '${driver.id}'
                                )
                            "
                        >
                            REMOVE
                        </button>
                      `;


            approvedDriverTable.innerHTML += `

                <tr>

                    <td>
                        ${
                            escapeHTML(
                                driver.name ||
                                "-"
                            )
                        }
                    </td>

                    <td>
                        ${
                            escapeHTML(
                                driver.mobile ||
                                "-"
                            )
                        }
                    </td>

                    <td>
                        ${statusDisplay}
                    </td>

                    <td>
                        APPROVED
                    </td>

                    <td>
                        ${removeButton}
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
                    "id, username, name, email, role, is_active, created_at"
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
                    <td colspan="6">
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
            admins.length ===
                0
        ) {

            adminTable.innerHTML = `
                <tr>
                    <td colspan="6">
                        No admins found.
                    </td>
                </tr>
            `;

            return;

        }


        // =================================
        // LOAD PERMISSIONS
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
                    <td colspan="6">
                        Unable to load permissions.
                    </td>
                </tr>
            `;

            return;

        }


        // =================================
        // CLEAR TABLE
        // =================================

        adminTable.innerHTML =
            "";


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
                                    escapeHTML(
                                        admin.name ||
                                        "-"
                                    )
                                }
                            </td>

                            <td>
                                ${
                                    escapeHTML(
                                        admin.username ||
                                        "-"
                                    )
                                }
                            </td>

                            <td>
                                👑 MASTER
                            </td>

                            <td>
                                Full Access
                            </td>

                            <td>
                                ACTIVE
                            </td>

                            <td>
                                MASTER
                            </td>

                        </tr>

                    `;

                    return;

                }


                // =================================
                // MATCH PERMISSIONS
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
                // STATUS
                // =================================

                const isActive =
                    admin.is_active !==
                    false;


                const statusDisplay =
                    isActive
                        ? "🟢 ACTIVE"
                        : "⚪ REMOVED";


                // =================================
                // REMOVE BUTTON
                // =================================

                let actionDisplay =
                    "REMOVE";


                if (
                    currentAdmin &&
                    String(
                        currentAdmin.id
                    ).trim() ===
                    String(
                        admin.id
                    ).trim()
                ) {

                    actionDisplay =
                        "CURRENT ADMIN";

                }

                else if (
                    !isActive
                ) {

                    actionDisplay =
                        "REMOVED";

                }

                else {

                    actionDisplay = `

                        <button
                            class="reject-btn"
                            onclick="
                                removeAdmin(
                                    '${admin.id}'
                                )
                            "
                        >
                            REMOVE
                        </button>

                    `;

                }


                // =================================
                // ADD ROW
                // =================================

                adminTable.innerHTML += `

                    <tr>

                        <td>
                            ${
                                escapeHTML(
                                    admin.name ||
                                    "-"
                                )
                            }
                        </td>

                        <td>
                            ${
                                escapeHTML(
                                    admin.username ||
                                    "-"
                                )
                            }
                        </td>

                        <td>
                            ${roleDisplay}
                        </td>

                        <td>
                            ${permissionText}
                        </td>

                        <td>
                            ${statusDisplay}
                        </td>

                        <td>
                            ${actionDisplay}
                        </td>

                    </tr>

                `;

            }
        );


        console.log(
            "ADMIN TABLE RENDERED:",
            admins.length
        );


    }

    catch (error) {

        console.error(
            "Unexpected admin loading error:",
            error
        );

        adminTable.innerHTML = `
            <tr>
                <td colspan="6">
                    Unable to load admins.
                </td>
            </tr>
        `;

    }

}


// =====================================
// REMOVE ADMIN
// =====================================

async function removeAdmin(
    adminId
) {

    if (!hasPermission("manage_admins")) {

        alert(
            "You do not have permission to remove admins."
        );

        return;

    }


    // =================================
    // CANNOT REMOVE YOURSELF
    // =================================

    if (
        currentAdmin &&
        String(
            currentAdmin.id
        ).trim() ===
        String(
            adminId
        ).trim()
    ) {

        alert(
            "You cannot remove your own admin account."
        );

        return;

    }


    // =================================
    // LOAD ADMIN
    // =================================

    const {
        data: admin,
        error: adminError
    } =
        await window.supabaseClient
            .from("Admins")
            .select(
                "id, name, username, role, is_active"
            )
            .eq(
                "id",
                adminId
            )
            .single();


    if (adminError) {

        console.error(
            "Admin lookup error:",
            adminError
        );

        alert(
            adminError.message
        );

        return;

    }


    if (!admin) {

        alert(
            "Admin not found."
        );

        return;

    }


    // =================================
    // MASTER PROTECTION
    // =================================

    if (
        admin.role ===
        "MASTER"
    ) {

        alert(
            "MASTER Admin cannot be removed."
        );

        return;

    }


    if (
        admin.is_active ===
        false
    ) {

        alert(
            "This admin has already been removed."
        );

        return;

    }


    // =================================
    // CONFIRM
    // =================================

    const confirmed =
        confirm(
            `Remove admin "${admin.name || admin.username}"?\n\nThey will no longer be able to use the Valetholic Admin system.`
        );


    if (!confirmed) {

        return;

    }


    // =================================
    // DEACTIVATE ADMIN
    // =================================

    const {
        error
    } =
        await window.supabaseClient
            .from("Admins")
            .update({

                is_active:
                    false

            })
            .eq(
                "id",
                adminId
            );


    if (error) {

        console.error(
            "Remove admin error:",
            error
        );

        alert(
            "Unable to remove admin.\n\n" +
            error.message
        );

        return;

    }


    alert(
        "Admin removed successfully."
    );


    await loadAdmins();

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
    ).value =
        "";


    document.getElementById(
        "newAdminUsername"
    ).value =
        "";


    document.getElementById(
        "newAdminPassword"
    ).value =
        "";


    document.getElementById(
        "newAdminConfirmPassword"
    ).value =
        "";


    document.getElementById(
        "newAdminRole"
    ).value =
        "ADMIN";


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


    if (
        role ===
        "ADMIN"
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


    if (
        role ===
        "SEMI-MASTER"
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
        document
            .getElementById(
                "newAdminPassword"
            )
            .value;


    const confirmPassword =
        document
            .getElementById(
                "newAdminConfirmPassword"
            )
            .value;


    const role =
        document
            .getElementById(
                "newAdminRole"
            )
            .value;


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
        password.length <
        6
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


    }

    catch (error) {

        console.error(
            "Create admin error:",
            error
        );

        alert(
            "Something went wrong.\n\n" +
            error.message
        );

    }

    finally {

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
                    "REJECTED",

                status:
                    "OFF DUTY"

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
// REMOVE DRIVER
// =====================================

async function removeDriver(
    driverId
) {

    // =================================
    // PERMISSION
    // =================================

    if (
        !hasPermission(
            "view_drivers"
        )
    ) {

        alert(
            "You do not have permission to manage drivers."
        );

        return;

    }


    // =================================
    // LOAD DRIVER
    // =================================

    const {
        data: driver,
        error: driverError
    } =
        await window.supabaseClient
            .from("Drivers")
            .select("*")
            .eq(
                "id",
                driverId
            )
            .single();


    if (driverError) {

        console.error(
            "Driver lookup error:",
            driverError
        );

        alert(
            driverError.message
        );

        return;

    }


    if (!driver) {

        alert(
            "Driver not found."
        );

        return;

    }


    // =================================
    // LOAD BOOKINGS
    // =================================

    const {
        data: bookings,
        error: bookingError
    } =
        await window.supabaseClient
            .from("Bookings")
            .select(
                "id, driver_id, status"
            );


    if (bookingError) {

        console.error(
            "Booking lookup error:",
            bookingError
        );

        alert(
            bookingError.message
        );

        return;

    }


    // =================================
    // ACTIVE JOB CHECK
    // =================================

    if (
        driverHasActiveJob(
            driver,
            bookings || []
        )
    ) {

        alert(
            "This driver currently has an active job.\n\nComplete the job before removing the driver."
        );

        return;

    }


    // =================================
    // CONFIRM
    // =================================

    const confirmed =
        confirm(
            `Remove driver "${driver.name || "this driver"}"?\n\nThey will no longer appear as an approved Valetholic driver.`
        );


    if (!confirmed) {

        return;

    }


    // =================================
    // REMOVE DRIVER FROM ACTIVE SYSTEM
    // =================================

    const {
        error
    } =
        await window.supabaseClient
            .from("Drivers")
            .update({

                approved:
                    false,

                approval_status:
                    "REJECTED",

                status:
                    "OFF DUTY"

            })
            .eq(
                "id",
                driverId
            );


    if (error) {

        console.error(
            "Remove driver error:",
            error
        );

        alert(
            "Unable to remove driver.\n\n" +
            error.message
        );

        return;

    }


    alert(
        "Driver removed successfully."
    );


    await loadDashboard();

}


// =====================================
// HTML ESCAPE
// =====================================

function escapeHTML(
    value
) {

    return String(
        value ??
        ""
    )
    .replace(
        /&/g,
        "&amp;"
    )
    .replace(
        /</g,
        "&lt;"
    )
    .replace(
        />/g,
        "&gt;"
    )
    .replace(
        /"/g,
        "&quot;"
    )
    .replace(
        /'/g,
        "&#039;"
    );

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
                    event.target ===
                    modal
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
            event.target ===
            modal
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