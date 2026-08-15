// =====================================
// VALETHOLIC ADMIN
// MASTER ADMIN DASHBOARD
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
// HELPER
// =====================================

function getElement(id) {

    return document.getElementById(id);

}


// =====================================
// HTML ESCAPE
// =====================================

function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


// =====================================
// ATTRIBUTE ESCAPE
// =====================================

function escapeForAttribute(value) {

    return String(value ?? "")
        .replace(/\\/g, "\\\\")
        .replace(/'/g, "\\'");

}


// =====================================
// NORMALISE STATUS
// =====================================

function normaliseStatus(value) {

    return String(value ?? "")
        .trim()
        .toUpperCase();

}


// =====================================
// SUPABASE CHECK
// =====================================

function getSupabase() {

    if (!window.supabaseClient) {

        console.error(
            "Supabase client is not available."
        );

        alert(
            "Valetholic database is not connected.\n\nPlease refresh the page."
        );

        return null;

    }

    return window.supabaseClient;

}


// =====================================
// LOAD CURRENT ADMIN
// =====================================

async function loadCurrentAdmin() {

    const supabase = getSupabase();

    if (!supabase) {
        return;
    }


    const adminId =
        sessionStorage.getItem("adminId");


    try {

        let query =
            supabase
                .from("Admins")
                .select("*");


        // =================================
        // LOOK UP BY SESSION ADMIN ID
        // =================================

        if (adminId) {

            query =
                query.eq(
                    "id",
                    adminId
                );

        }

        else {

            // =================================
            // FALLBACK MASTER ACCOUNT
            // =================================

            query =
                query.eq(
                    "username",
                    "admin"
                );

        }


        const {
            data: admin,
            error
        } =
            await query.single();


        if (error) {

            console.error(
                "Admin loading error:",
                error
            );

            return;

        }


        currentAdmin = admin;


        // =================================
        // LOAD PERMISSIONS
        // =================================

        const {
            data: permissions,
            error: permissionError
        } =
            await supabase
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


        // =================================
        // APPLY PERMISSIONS
        // =================================

        applyAdminPermissions();


        // =================================
        // LOAD ADMIN LIST
        // =================================

        await loadAdmins();

    }

    catch (error) {

        console.error(
            "Unexpected current admin error:",
            error
        );

    }

}


// =====================================
// CHECK PERMISSION
// =====================================

function hasPermission(permission) {

    // =================================
    // MASTER HAS FULL ACCESS
    // =================================

    if (
        currentAdmin &&
        normaliseStatus(currentAdmin.role) ===
            "MASTER"
    ) {

        return true;

    }


    return adminPermissions.includes(
        permission
    );

}


// =====================================
// APPLY ADMIN PERMISSIONS
// =====================================

function applyAdminPermissions() {

    const adminManagement =
        getElement("adminManagement");


    if (!adminManagement) {
        return;
    }


    if (
        hasPermission("manage_admins")
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

    const supabase = getSupabase();

    if (!supabase) {
        return;
    }


    try {

        // =================================
        // LOAD BOOKINGS
        // =================================

        const {
            data: bookings,
            error: bookingError
        } =
            await supabase
                .from("Bookings")
                .select("*")
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                );


        if (bookingError) {

            console.error(
                "Booking loading error:",
                bookingError
            );

            return;

        }


        const bookingData =
            bookings || [];


        // =================================
        // DASHBOARD COUNTS
        // =================================

        const totalBookings =
            getElement("totalBookings");


        const pendingBookings =
            getElement("pendingBookings");


        const completedBookings =
            getElement("completedBookings");


        const todayBookings =
            getElement("todayBookings");


        if (totalBookings) {

            totalBookings.textContent =
                bookingData.length;

        }


        if (pendingBookings) {

            pendingBookings.textContent =
                bookingData.filter(
                    booking =>
                        normaliseStatus(
                            booking.status
                        ) === "PENDING"
                ).length;

        }


        if (completedBookings) {

            completedBookings.textContent =
                bookingData.filter(
                    booking =>
                        normaliseStatus(
                            booking.status
                        ) === "COMPLETED"
                ).length;

        }


        // =================================
        // TODAY
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
                        String(
                            booking.created_at
                        ).startsWith(today)
                ).length;

        }


        // =================================
        // OPTIONAL BOOKING TABLE
        // =================================

        renderBookingTable(
            bookingData
        );


        // =================================
        // LOAD DRIVER DATA
        // =================================

        const {
            data: drivers,
            error: driverError
        } =
            await supabase
                .from("Drivers")
                .select(
                    "id, approved, approval_status"
                );


        if (driverError) {

            console.error(
                "Driver loading error:",
                driverError
            );

            return;

        }


        const driverData =
            drivers || [];


        // =================================
        // APPROVED DRIVER COUNT
        // =================================

        const approvedDrivers =
            driverData.filter(
                driver =>
                    driver.approved === true &&
                    normaliseStatus(
                        driver.approval_status
                    ) === "APPROVED"
            ).length;


        const driverCount =
            getElement("driverCount");


        if (driverCount) {

            driverCount.textContent =
                approvedDrivers;

        }


        // =================================
        // OPTIONAL LEGACY COUNTERS
        // =================================

        const pendingDriverCount =
            getElement("pendingDrivers");


        const approvedDriverCount =
            getElement("approvedDrivers");


        const pendingDrivers =
            driverData.filter(
                driver =>
                    normaliseStatus(
                        driver.approval_status
                    ) === "PENDING"
            ).length;


        if (pendingDriverCount) {

            pendingDriverCount.textContent =
                pendingDrivers;

        }


        if (approvedDriverCount) {

            approvedDriverCount.textContent =
                approvedDrivers;

        }


        // =================================
        // DRIVER TABLES
        // =================================

        await loadDriverApplications();

    }

    catch (error) {

        console.error(
            "Unexpected dashboard loading error:",
            error
        );

    }

}


// =====================================
// RENDER BOOKING TABLE
// =====================================

function renderBookingTable(
    bookingData
) {

    const table =
        getElement("bookingTable");


    if (!table) {
        return;
    }


    const keyword =
        getElement("searchBooking")
            ?.value
            ?.toLowerCase()
            ?.trim() || "";


    const statusFilter =
        getElement("statusFilter")
            ?.value || "All";


    table.innerHTML = "";


    const filteredBookings =
        bookingData.filter(
            booking => {

                const customer =
                    String(
                        booking.customer_name ||
                        ""
                    ).toLowerCase();


                const mobile =
                    String(
                        booking.mobile ||
                        ""
                    ).toLowerCase();


                const reference =
                    (
                        "vh-" +
                        String(
                            booking.reference_no ||
                            ""
                        )
                    ).toLowerCase();


                const matchSearch =
                    !keyword ||
                    customer.includes(keyword) ||
                    mobile.includes(keyword) ||
                    reference.includes(keyword);


                const matchStatus =
                    statusFilter === "All" ||
                    booking.status === statusFilter;


                return (
                    matchSearch &&
                    matchStatus
                );

            }
        );


    // =================================
    // EMPTY
    // =================================

    if (
        filteredBookings.length === 0
    ) {

        table.innerHTML = `

            <tr>

                <td colspan="9">

                    No bookings found.

                </td>

            </tr>

        `;

        return;

    }


    // =================================
    // BOOKINGS
    // =================================

    filteredBookings.forEach(
        booking => {

            const pickup =
                formatLocation(
                    booking.pickups
                );


            const destination =
                formatLocation(
                    booking.destinations
                );


            const driver =
                booking.driver_id
                    ? "Assigned"
                    : "Unassigned";


            table.innerHTML += `

                <tr>

                    <td>
                        VH-${
                            escapeHTML(
                                booking.reference_no ||
                                "----"
                            )
                        }
                    </td>


                    <td>
                        ${
                            escapeHTML(
                                booking.customer_name ||
                                "-"
                            )
                        }
                    </td>


                    <td>
                        ${
                            escapeHTML(
                                booking.mobile ||
                                "-"
                            )
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
                            escapeHTML(
                                booking.booking_date ||
                                "-"
                            )
                        }
                    </td>


                    <td>
                        ${
                            escapeHTML(
                                booking.status ||
                                "-"
                            )
                        }
                    </td>


                    <td>
                        ${escapeHTML(driver)}
                    </td>


                    <td>

                        <button
                            type="button"
                            class="view-btn"
                            onclick="
                                viewBooking(
                                    '${escapeForAttribute(
                                        booking.id
                                    )}'
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


// =====================================
// FORMAT LOCATION
// =====================================

function formatLocation(value) {

    if (!value) {
        return "-";
    }


    try {

        if (Array.isArray(value)) {

            return value
                .map(
                    item =>
                        escapeHTML(item)
                )
                .join("<br>");

        }


        if (
            typeof value === "string"
        ) {

            const parsed =
                JSON.parse(value);


            if (Array.isArray(parsed)) {

                return parsed
                    .map(
                        item =>
                            escapeHTML(item)
                    )
                    .join("<br>");

            }


            return escapeHTML(parsed);

        }


        return escapeHTML(value);

    }

    catch {

        return escapeHTML(value);

    }

}


// =====================================
// LOAD DRIVER APPLICATIONS
// =====================================

async function loadDriverApplications() {

    const supabase = getSupabase();

    if (!supabase) {
        return;
    }


    const driverTable =
        getElement("driverTable");


    if (!driverTable) {
        return;
    }


    try {

        const {
            data: driverApplications,
            error
        } =
            await supabase
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


        if (error) {

            console.error(
                "Driver applications error:",
                error
            );

            driverTable.innerHTML = `

                <tr>

                    <td colspan="6">

                        Unable to load
                        driver applications.

                    </td>

                </tr>

            `;

            return;

        }


        // =================================
        // NO PENDING DRIVERS
        // =================================

        if (
            !driverApplications ||
            driverApplications.length === 0
        ) {

            driverTable.innerHTML = `

                <tr>

                    <td colspan="6">

                        No pending driver
                        applications.

                    </td>

                </tr>

            `;

            await loadApprovedDrivers();

            return;

        }


        driverTable.innerHTML = "";


        driverApplications.forEach(
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

                            <span
                                class="pending-status"
                            >

                                PENDING

                            </span>

                        </td>


                        <td>

                            <button
                                type="button"
                                onclick="
                                    approveDriver(
                                        '${escapeForAttribute(
                                            driver.id
                                        )}'
                                    )
                                "
                            >

                                APPROVE

                            </button>


                            <button
                                type="button"
                                class="reject-btn"
                                onclick="
                                    rejectDriver(
                                        '${escapeForAttribute(
                                            driver.id
                                        )}'
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


        await loadApprovedDrivers();

    }

    catch (error) {

        console.error(
            "Unexpected driver application error:",
            error
        );

    }

}


// =====================================
// LOAD APPROVED DRIVERS
// =====================================

async function loadApprovedDrivers() {

    const supabase = getSupabase();

    if (!supabase) {
        return;
    }


    const driverTable =
        getElement(
            "approvedDriverTable"
        );


    if (!driverTable) {
        return;
    }


    try {

        const {
            data: approvedDrivers,
            error
        } =
            await supabase
                .from("Drivers")
                .select(
                    "id, name, mobile, status, approved, approval_status, created_at"
                )
                .eq(
                    "approved",
                    true
                )
                .eq(
                    "approval_status",
                    "APPROVED"
                )
                .order(
                    "created_at",
                    {
                        ascending: true
                    }
                );


        if (error) {

            console.error(
                "Approved driver loading error:",
                error
            );

            driverTable.innerHTML = `

                <tr>

                    <td colspan="5">

                        Unable to load
                        approved drivers.

                    </td>

                </tr>

            `;

            return;

        }


        if (
            !approvedDrivers ||
            approvedDrivers.length === 0
        ) {

            driverTable.innerHTML = `

                <tr>

                    <td colspan="5">

                        No approved drivers.

                    </td>

                </tr>

            `;

            return;

        }


        driverTable.innerHTML = "";


        approvedDrivers.forEach(
            driver => {

                const driverStatus =
                    driver.status ||
                    "OFF DUTY";


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
                                    driverStatus
                                )
                            }
                        </td>


                        <td>

                            <span
                                class="approved-status"
                            >

                                APPROVED

                            </span>

                        </td>


                        <td>

                            <button
                                type="button"
                                class="reject-btn"
                                onclick="
                                    removeDriver(
                                        '${escapeForAttribute(
                                            driver.id
                                        )}',
                                        '${escapeForAttribute(
                                            driver.name ||
                                            "Driver"
                                        )}'
                                    )
                                "
                            >

                                REMOVE

                            </button>

                        </td>

                    </tr>

                `;

            }
        );

    }

    catch (error) {

        console.error(
            "Unexpected approved driver error:",
            error
        );

    }

}


// =====================================
// LOAD ACTIVE ADMINS
// =====================================

async function loadAdmins() {

    const supabase = getSupabase();

    if (!supabase) {
        return;
    }


    const adminTable =
        getElement("adminTable");


    if (!adminTable) {

        console.error(
            "adminTable not found."
        );

        return;

    }


    try {

        // =================================
        // LOAD ACTIVE ADMINS ONLY
        // =================================

        const {
            data: admins,
            error: adminError
        } =
            await supabase
                .from("Admins")
                .select(
                    "id, username, name, email, role, is_active, created_at"
                )
                .eq(
                    "is_active",
                    true
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
            "ACTIVE ADMINS LOADED:",
            admins
        );


        if (
            !admins ||
            admins.length === 0
        ) {

            adminTable.innerHTML = `

                <tr>

                    <td colspan="5">

                        No active admins found.

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
            await supabase
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

                        Unable to load
                        permissions.

                    </td>

                </tr>

            `;

            return;

        }


        adminTable.innerHTML = "";


        // =================================
        // RENDER ADMINS
        // =================================

        admins.forEach(
            admin => {

                const role =
                    normaliseStatus(
                        admin.role
                    );


                // =================================
                // MASTER
                // =================================

                if (
                    role === "MASTER"
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

                                <span
                                    class="current-admin-label"
                                >

                                    MASTER

                                </span>

                            </td>

                        </tr>

                    `;

                    return;

                }


                // =================================
                // PERMISSIONS
                // =================================

                const permissionsForAdmin =
                    (
                        allPermissions ||
                        []
                    )
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


                let permissionText =
                    "No Permissions";


                if (
                    permissionsForAdmin.length > 0
                ) {

                    permissionText =
                        permissionsForAdmin
                            .map(
                                permission =>
                                    String(
                                        permission
                                    )
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
                            .join(", ");

                }


                // =================================
                // ROLE DISPLAY
                // =================================

                let roleDisplay =
                    escapeHTML(
                        admin.role ||
                        "-"
                    );


                if (
                    role ===
                    "SEMI-MASTER"
                ) {

                    roleDisplay =
                        "🛡️ SEMI-MASTER";

                }

                else if (
                    role === "ADMIN"
                ) {

                    roleDisplay =
                        "ADMIN";

                }


                // =================================
                // CURRENT ADMIN
                // =================================

                const isCurrentAdmin =
                    currentAdmin &&
                    String(
                        currentAdmin.id
                    ).trim() ===
                    String(
                        admin.id
                    ).trim();


                let action = "";


                if (
                    isCurrentAdmin
                ) {

                    action = `

                        <span
                            class="current-admin-label"
                        >

                            CURRENT ADMIN

                        </span>

                    `;

                }

                else {

                    action = `

                        <button
                            type="button"
                            class="reject-btn"
                            onclick="
                                removeAdmin(
                                    '${escapeForAttribute(
                                        admin.id
                                    )}',
                                    '${escapeForAttribute(
                                        admin.name ||
                                        admin.username ||
                                        "admin"
                                    )}'
                                )
                            "
                        >

                            REMOVE

                        </button>

                    `;

                }


                // =================================
                // ROW
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
                            ${
                                escapeHTML(
                                    permissionText
                                )
                            }
                        </td>


                        <td>
                            ${action}
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

                <td colspan="5">

                    Unable to load admins.

                </td>

            </tr>

        `;

    }

}


// =====================================
// OPEN ADD ADMIN
// =====================================

function openAddAdmin() {

    const modal =
        getElement("addAdminModal");


    if (!modal) {

        console.error(
            "Add Admin modal not found."
        );

        return;

    }


    const name =
        getElement("newAdminName");


    const username =
        getElement("newAdminUsername");


    const password =
        getElement("newAdminPassword");


    const confirmPassword =
        getElement(
            "newAdminConfirmPassword"
        );


    const role =
        getElement("newAdminRole");


    if (name) {
        name.value = "";
    }


    if (username) {
        username.value = "";
    }


    if (password) {
        password.value = "";
    }


    if (confirmPassword) {
        confirmPassword.value = "";
    }


    if (role) {

        role.value =
            "ADMIN";

    }


    setAdminPermissions(
        "ADMIN"
    );


    modal.style.display =
        "flex";


    // =================================
    // FOCUS
    // =================================

    if (name) {

        setTimeout(
            () => name.focus(),
            50
        );

    }

}


// =====================================
// CLOSE ADD ADMIN
// =====================================

function closeAddAdmin() {

    const modal =
        getElement("addAdminModal");


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

    const permissionIds = {

        viewBookings:
            "permViewBookings",

        manageBookings:
            "permManageBookings",

        approveDrivers:
            "permApproveDrivers",

        viewDrivers:
            "permViewDrivers",

        viewGPS:
            "permViewGPS",

        manageAdmins:
            "permManageAdmins",

        systemSettings:
            "permSystemSettings"

    };


    const boxes = {};


    Object.entries(
        permissionIds
    )
    .forEach(
        ([key, id]) => {

            boxes[key] =
                getElement(id);

        }
    );


    // =================================
    // ADMIN
    // =================================

    if (
        role === "ADMIN"
    ) {

        if (boxes.viewBookings)
            boxes.viewBookings.checked = true;

        if (boxes.manageBookings)
            boxes.manageBookings.checked = true;

        if (boxes.approveDrivers)
            boxes.approveDrivers.checked = false;

        if (boxes.viewDrivers)
            boxes.viewDrivers.checked = true;

        if (boxes.viewGPS)
            boxes.viewGPS.checked = true;

        if (boxes.manageAdmins)
            boxes.manageAdmins.checked = false;

        if (boxes.systemSettings)
            boxes.systemSettings.checked = false;

    }


    // =================================
    // SEMI-MASTER
    // =================================

    if (
        role === "SEMI-MASTER"
    ) {

        if (boxes.viewBookings)
            boxes.viewBookings.checked = true;

        if (boxes.manageBookings)
            boxes.manageBookings.checked = true;

        if (boxes.approveDrivers)
            boxes.approveDrivers.checked = true;

        if (boxes.viewDrivers)
            boxes.viewDrivers.checked = true;

        if (boxes.viewGPS)
            boxes.viewGPS.checked = true;

        if (boxes.manageAdmins)
            boxes.manageAdmins.checked = true;

        if (boxes.systemSettings)
            boxes.systemSettings.checked = false;

    }

}


// =====================================
// CREATE ADMIN
// =====================================

async function createAdmin() {

    const supabase = getSupabase();

    if (!supabase) {
        return;
    }


    // =================================
    // PERMISSION
    // =================================

    if (
        !hasPermission(
            "manage_admins"
        )
    ) {

        alert(
            "You do not have permission to create admins."
        );

        return;

    }


    const name =
        getElement(
            "newAdminName"
        )?.value
        ?.trim() || "";


    const username =
        getElement(
            "newAdminUsername"
        )?.value
        ?.trim() || "";


    const password =
        getElement(
            "newAdminPassword"
        )?.value || "";


    const confirmPassword =
        getElement(
            "newAdminConfirmPassword"
        )?.value || "";


    const role =
        getElement(
            "newAdminRole"
        )?.value || "ADMIN";


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
        password !== confirmPassword
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


    const permissionMap = {

        permViewBookings:
            "view_bookings",

        permManageBookings:
            "manage_bookings",

        permApproveDrivers:
            "approve_drivers",

        permViewDrivers:
            "view_drivers",

        permViewGPS:
            "view_gps",

        permManageAdmins:
            "manage_admins",

        permSystemSettings:
            "system_settings"

    };


    Object.entries(
        permissionMap
    )
    .forEach(
        ([elementId, permission]) => {

            const checkbox =
                getElement(elementId);


            if (
                checkbox &&
                checkbox.checked
            ) {

                permissions.push(
                    permission
                );

            }

        }
    );


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
        // CHECK SUPABASE AUTH
        // =================================

        const {
            data: {
                user
            },
            error: userError
        } =
            await supabase.auth.getUser();


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
        // CREATE ADMIN EDGE FUNCTION
        // =================================

        const {
            data,
            error
        } =
            await supabase
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
// REMOVE ADMIN
// =====================================

async function removeAdmin(
    adminId,
    adminName
) {

    const supabase = getSupabase();

    if (!supabase) {
        return;
    }


    console.log(
        "🗑️ REMOVE ADMIN CLICKED",
        {
            adminId,
            adminName
        }
    );


    // =================================
    // PERMISSION
    // =================================

    if (
        !hasPermission(
            "manage_admins"
        )
    ) {

        alert(
            "You do not have permission to remove admins."
        );

        return;

    }


    // =================================
    // DON'T REMOVE YOURSELF
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
            "You cannot remove the admin account you are currently using."
        );

        return;

    }


    // =================================
    // CONFIRM
    // =================================

    const confirmed =
        confirm(
            `Remove ${adminName} from Valetholic Admin?\n\nTheir admin access will be disabled.`
        );


    if (!confirmed) {
        return;
    }


    try {

        // =================================
        // GET TARGET ADMIN
        // =================================

        const {
            data: targetAdmin,
            error: targetError
        } =
            await supabase
                .from("Admins")
                .select(
                    "id, name, username, role, is_active"
                )
                .eq(
                    "id",
                    adminId
                )
                .maybeSingle();


        if (targetError) {

            console.error(
                "Target admin lookup failed:",
                targetError
            );

            alert(
                "Unable to find this admin.\n\n" +
                targetError.message
            );

            return;

        }


        if (!targetAdmin) {

            alert(
                "Admin account not found."
            );

            await loadAdmins();

            return;

        }


        // =================================
        // MASTER PROTECTION
        // =================================

        if (
            normaliseStatus(
                targetAdmin.role
            ) === "MASTER"
        ) {

            alert(
                "The MASTER admin cannot be removed."
            );

            return;

        }


        // =================================
        // ALREADY INACTIVE
        // =================================

        if (
            targetAdmin.is_active === false
        ) {

            alert(
                "This admin is already removed."
            );

            await loadAdmins();

            return;

        }


        // =================================
        // DEACTIVATE
        // =================================

        const {
            error: updateError
        } =
            await supabase
                .from("Admins")
                .update({
                    is_active: false
                })
                .eq(
                    "id",
                    adminId
                );


        if (updateError) {

            console.error(
                "Remove admin error:",
                updateError
            );

            alert(
                "ADMIN WAS NOT REMOVED.\n\n" +
                updateError.message
            );

            return;

        }


        // =================================
        // VERIFY UPDATE
        // =================================

        const {
            data: verifyAdmin,
            error: verifyError
        } =
            await supabase
                .from("Admins")
                .select(
                    "id, role, is_active"
                )
                .eq(
                    "id",
                    adminId
                )
                .maybeSingle();


        if (verifyError) {

            console.error(
                "Admin verification error:",
                verifyError
            );

            alert(
                "The remove request was sent, but it could not be verified.\n\n" +
                verifyError.message
            );

            return;

        }


        if (
            verifyAdmin &&
            verifyAdmin.is_active === true
        ) {

            alert(
                "ADMIN WAS NOT REMOVED.\n\nThe database did not change is_active to false."
            );

            return;

        }


        // =================================
        // SUCCESS
        // =================================

        alert(
            `${adminName} has been removed from Valetholic Admin.`
        );


        await loadAdmins();

    }

    catch (error) {

        console.error(
            "Unexpected remove admin error:",
            error
        );

        alert(
            "Something went wrong while removing the admin.\n\n" +
            error.message
        );

    }

}


// =====================================
// REMOVE DRIVER
// =====================================

async function removeDriver(
    driverId,
    driverName
) {

    const supabase = getSupabase();

    if (!supabase) {
        return;
    }


    // =================================
    // PERMISSION
    // =================================

    if (
        !hasPermission(
            "approve_drivers"
        )
    ) {

        alert(
            "You do not have permission to remove drivers."
        );

        return;

    }


    // =================================
    // CONFIRM
    // =================================

    const confirmed =
        confirm(
            `Remove ${driverName} from Valetholic Drivers?\n\nThis will deactivate the driver and remove their approved-driver status.`
        );


    if (!confirmed) {
        return;
    }


    try {

        // =================================
        // GET DRIVER
        // =================================

        const {
            data: driver,
            error: driverError
        } =
            await supabase
                .from("Drivers")
                .select(
                    "id, auth_id, name, approved, approval_status, status"
                )
                .eq(
                    "id",
                    driverId
                )
                .maybeSingle();


        if (driverError) {

            console.error(
                "Driver lookup error:",
                driverError
            );

            alert(
                "Unable to find this driver.\n\n" +
                driverError.message
            );

            return;

        }


        if (!driver) {

            alert(
                "Driver account not found."
            );

            return;

        }


        console.log(
            "🎯 DRIVER FOUND:",
            driver
        );


        // =================================
        // CHECK ACTIVE JOBS
        // =================================
        //
        // Bookings.driver_id uses the
        // driver's auth_id.
        //
        // =================================

        if (driver.auth_id) {

            const {
                data: activeJobs,
                error: activeJobsError
            } =
                await supabase
                    .from("Bookings")
                    .select(
                        "id, status"
                    )
                    .eq(
                        "driver_id",
                        driver.auth_id
                    )
                    .in(
                        "status",
                        [
                            "ON JOB",
                            "ON THE WAY",
                            "PICKED UP"
                        ]
                    );


            if (activeJobsError) {

                console.error(
                    "Active job check error:",
                    activeJobsError
                );

                alert(
                    "Unable to check the driver's active jobs.\n\n" +
                    activeJobsError.message
                );

                return;

            }


            if (
                activeJobs &&
                activeJobs.length > 0
            ) {

                alert(
                    "This driver is currently handling an active job.\n\nComplete or reassign the job before removing the driver."
                );

                return;

            }

        }


        // =================================
        // REMOVE DRIVER
        // =================================

        const {
            error: updateError
        } =
            await supabase
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


        if (updateError) {

            console.error(
                "Remove driver error:",
                updateError
            );

            alert(
                "Unable to remove driver.\n\n" +
                updateError.message
            );

            return;

        }


        // =================================
        // VERIFY DRIVER
        // =================================

        const {
            data: verifyDriver,
            error: verifyError
        } =
            await supabase
                .from("Drivers")
                .select(
                    "id, approved, approval_status, status"
                )
                .eq(
                    "id",
                    driverId
                )
                .maybeSingle();


        if (verifyError) {

            console.error(
                "Driver verification error:",
                verifyError
            );

            alert(
                "The remove request was sent, but it could not be verified.\n\n" +
                verifyError.message
            );

            return;

        }


        if (
            verifyDriver &&
            (
                verifyDriver.approved === true ||
                normaliseStatus(
                    verifyDriver.approval_status
                ) === "APPROVED"
            )
        ) {

            alert(
                "DRIVER WAS NOT REMOVED.\n\nThe database did not update the driver's approval status."
            );

            return;

        }


        // =================================
        // SUCCESS
        // =================================

        alert(
            `${driverName} has been removed from Valetholic Drivers.`
        );


        await loadDashboard();

    }

    catch (error) {

        console.error(
            "Unexpected remove driver error:",
            error
        );

        alert(
            "Something went wrong while removing the driver.\n\n" +
            error.message
        );

    }

}


// =====================================
// APPROVE DRIVER
// =====================================

async function approveDriver(
    driverId
) {

    const supabase = getSupabase();

    if (!supabase) {
        return;
    }


    // =================================
    // PERMISSION
    // =================================

    if (
        !hasPermission(
            "approve_drivers"
        )
    ) {

        alert(
            "You do not have permission to approve drivers."
        );

        return;

    }


    const confirmed =
        confirm(
            "Approve this driver?"
        );


    if (!confirmed) {
        return;
    }


    try {

        const {
            error
        } =
            await supabase
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

    catch (error) {

        console.error(
            "Unexpected approve driver error:",
            error
        );

        alert(
            "Something went wrong.\n\n" +
            error.message
        );

    }

}


// =====================================
// REJECT DRIVER
// =====================================

async function rejectDriver(
    driverId
) {

    const supabase = getSupabase();

    if (!supabase) {
        return;
    }


    // =================================
    // PERMISSION
    // =================================

    if (
        !hasPermission(
            "approve_drivers"
        )
    ) {

        alert(
            "You do not have permission to reject drivers."
        );

        return;

    }


    const confirmed =
        confirm(
            "Reject this driver application?"
        );


    if (!confirmed) {
        return;
    }


    try {

        const {
            error
        } =
            await supabase
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

    catch (error) {

        console.error(
            "Unexpected reject driver error:",
            error
        );

        alert(
            "Something went wrong.\n\n" +
            error.message
        );

    }

}


// =====================================
// VIEW BOOKING
// =====================================

function viewBooking(id) {

    if (!id) {

        alert(
            "Booking ID is missing."
        );

        return;

    }


    window.location.href =
        `ops-booking.html?id=${encodeURIComponent(id)}`;

}


// =====================================
// MARK BOOKING COMPLETED
// =====================================
//
// Kept for compatibility with any
// existing page/modal that may call it.
// It now uses currentBookingId instead
// of the old hardcoded reference 2027.
// =====================================

async function markCompleted() {

    const supabase = getSupabase();

    if (!supabase) {
        return;
    }


    console.log(
        "markCompleted clicked:",
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


    try {

        const {
            error
        } =
            await supabase
                .from("Bookings")
                .update({

                    status:
                        "Completed"

                })
                .eq(
                    "id",
                    currentBookingId
                );


        if (error) {

            console.error(
                "Complete booking error:",
                error
            );

            alert(
                error.message
            );

            return;

        }


        const bookingModal =
            getElement(
                "bookingModal"
            );


        if (bookingModal) {

            bookingModal.style.display =
                "none";

        }


        await loadDashboard();

    }

    catch (error) {

        console.error(
            "Unexpected complete booking error:",
            error
        );

        alert(
            "Something went wrong.\n\n" +
            error.message
        );

    }

}


// =====================================
// LOGOUT
// =====================================

async function logout() {

    const supabase =
        window.supabaseClient;


    // =================================
    // CLEAR LOCAL SESSION
    // =================================

    sessionStorage.removeItem(
        "adminLoggedIn"
    );

    sessionStorage.removeItem(
        "adminId"
    );


    // =================================
    // SIGN OUT SUPABASE
    // =================================

    if (supabase) {

        try {

            await supabase.auth.signOut();

        }

        catch (error) {

            console.warn(
                "Supabase logout warning:",
                error
            );

        }

    }


    window.location.href =
        "login.html";

}


// =====================================
// MODAL HANDLERS
// =====================================

function setupModalHandlers() {

    // =================================
    // BOOKING MODAL CLOSE
    // =================================

    const closeButton =
        document.querySelector(
            ".close-modal"
        );


    if (closeButton) {

        closeButton.onclick =
            function () {

                const modal =
                    getElement(
                        "bookingModal"
                    );


                if (modal) {

                    modal.style.display =
                        "none";

                }

            };

    }


    // =================================
    // CLICK OUTSIDE BOOKING MODAL
    // =================================

    window.addEventListener(
        "click",
        event => {

            const modal =
                getElement(
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


    // =================================
    // CLICK OUTSIDE ADD ADMIN MODAL
    // =================================

    const addAdminModal =
        getElement(
            "addAdminModal"
        );


    if (addAdminModal) {

        addAdminModal.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    addAdminModal
                ) {

                    closeAddAdmin();

                }

            }
        );

    }


    // =================================
    // ESCAPE KEY
    // =================================

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key !== "Escape"
            ) {

                return;

            }


            const addAdminModal =
                getElement(
                    "addAdminModal"
                );


            if (
                addAdminModal &&
                addAdminModal.style.display ===
                    "flex"
            ) {

                closeAddAdmin();

            }


            const bookingModal =
                getElement(
                    "bookingModal"
                );


            if (
                bookingModal &&
                bookingModal.style.display ===
                    "flex"
            ) {

                bookingModal.style.display =
                    "none";

            }

        }
    );


    // =================================
    // LOGOUT LINK
    // =================================

    const logoutLink =
        getElement(
            "logoutLink"
        );


    if (logoutLink) {

        logoutLink.addEventListener(
            "click",
            event => {

                event.preventDefault();

                logout();

            }
        );

    }


    // =================================
    // ADMIN ROLE CHANGE
    // =================================

    const roleSelect =
        getElement(
            "newAdminRole"
        );


    if (roleSelect) {

        roleSelect.addEventListener(
            "change",
            () => {

                setAdminPermissions(
                    roleSelect.value
                );

            }
        );

    }

}


// =====================================
// SEARCH / FILTER EVENTS
// =====================================

function setupBookingFilters() {

    const searchInput =
        getElement(
            "searchBooking"
        );


    const statusFilter =
        getElement(
            "statusFilter"
        );


    if (
        searchInput ||
        statusFilter
    ) {

        const refresh =
            () => loadDashboard();


        if (searchInput) {

            searchInput.addEventListener(
                "input",
                refresh
            );

        }


        if (statusFilter) {

            statusFilter.addEventListener(
                "change",
                refresh
            );

        }

    }

}


// =====================================
// START ADMIN PAGE
// =====================================

async function initialiseAdmin() {

    const supabase =
        getSupabase();


    if (!supabase) {
        return;
    }


    setupModalHandlers();

    setupBookingFilters();


    // =================================
    // LOAD ADMIN FIRST
    // =================================
    //
    // This is important because
    // permissions determine what the
    // current admin can see/do.
    // =================================

    await loadCurrentAdmin();


    // =================================
    // THEN LOAD DASHBOARD
    // =================================

    await loadDashboard();

}


// =====================================
// START
// =====================================

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initialiseAdmin
    );

}

else {

    initialiseAdmin();

}