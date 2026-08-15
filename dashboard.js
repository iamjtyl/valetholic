// =====================================
// VALETHOLIC DRIVER DASHBOARD
// =====================================


// =====================================
// GLOBAL VARIABLES
// =====================================

let currentDriver = null;

let bookings = [];

let status = "OFF DUTY";

let knownBookingIds = new Set();

let firstBookingLoad = true;

let refreshTimer = null;

let gpsWatchId = null;

let notificationAudioContext = null;

let isRefreshingBookings = false;


// =====================================
// ELEMENTS
// =====================================

const statusIcon =
    document.getElementById("statusIcon");

const statusTitle =
    document.getElementById("statusTitle");

const statusMessage =
    document.getElementById("statusMessage");

const dutyBtn =
    document.getElementById("dutyBtn");

const jobList =
    document.getElementById("jobList");

const driverGreeting =
    document.getElementById("driverGreeting");

const logoutBtn =
    document.getElementById("logoutBtn");


// =====================================
// BASIC ELEMENT CHECK
// =====================================

if (
    !statusIcon ||
    !statusTitle ||
    !statusMessage ||
    !dutyBtn ||
    !jobList
) {

    console.error(
        "❌ Driver dashboard elements are missing."
    );

}


// =====================================
// START
// =====================================

loadDriver();


// =====================================
// LOAD DRIVER
// =====================================

async function loadDriver() {

    try {

        const {
            data: {
                user
            },
            error
        } =
            await window.supabaseClient
                .auth
                .getUser();


        if (error) {

            console.error(
                "❌ Auth error:",
                error
            );

            alert(
                "Unable to verify your login.\n\n" +
                error.message
            );

            return;

        }


        // =================================
        // NOT LOGGED IN
        // =================================

        if (!user) {

            window.location.href =
                "driver-portal.html";

            return;

        }


        currentDriver =
            user;


        // =================================
        // DRIVER GREETING
        // =================================

        if (driverGreeting) {

            const loginName =
                user.user_metadata?.full_name ||
                user.user_metadata?.name ||
                user.user_metadata?.username ||
                user.email?.split("@")[0] ||
                "Driver";


            driverGreeting.textContent =
                `Hi, ${loginName} 👋`;

        }


        console.log(
            "👤 Logged in driver:",
            user.id,
            user.email
        );


        // =================================
        // GET DRIVER RECORD
        // =================================

        const {
            data: driver,
            error: driverError
        } =
            await window.supabaseClient
                .from("Drivers")
                .select("*")
                .eq(
                    "auth_id",
                    user.id
                )
                .single();


        if (driverError) {

            console.error(
                "❌ Driver lookup error:",
                driverError
            );

            alert(
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
            "🚗 Driver record:",
            driver
        );


        // =================================
        // APPROVAL STATUS
        // =================================

        const approvalStatus =
            normaliseStatus(
                driver.approval_status
            );


        if (
            approvalStatus ===
            "PENDING"
        ) {

            showPendingApproval();

            return;

        }


        if (
            approvalStatus ===
            "REJECTED"
        ) {

            showRejectedApplication();

            return;

        }


        // =================================
        // APPROVED SAFETY CHECK
        // =================================

        if (
            approvalStatus !== "APPROVED" ||
            driver.approved !== true
        ) {

            showPendingApproval();

            return;

        }


        // =================================
        // LOAD DRIVER STATUS
        // =================================

        status =
            normaliseStatus(
                driver.status
            ) ||
            "OFF DUTY";


        // =================================
        // SAFETY FALLBACK
        // =================================

        if (
            status === "PENDING" ||
            status === "APPROVED"
        ) {

            status =
                "OFF DUTY";

        }


        updateDashboard();


        // =================================
        // LOAD ACTIVE BOOKINGS
        // =================================

        await loadActiveBookings();


        // =================================
        // START AUTO REFRESH
        // =================================

        startBookingAutoRefresh();


        // =================================
        // START GPS
        // =================================

        startGPS();


        // =================================
        // NOTIFICATION PERMISSION
        // =================================

        requestNotificationPermission();


        // =================================
        // SERVICE WORKER
        // =================================

        registerServiceWorker();

    }

    catch (error) {

        console.error(
            "❌ Unexpected driver loading error:",
            error
        );

    }

}


// =====================================
// NORMALISE STATUS
// =====================================

function normaliseStatus(
    value
) {

    return String(
        value ?? ""
    )
    .trim()
    .toUpperCase();

}


// =====================================
// PENDING APPROVAL
// =====================================

function showPendingApproval() {

    statusIcon.innerHTML =
        "🕐";


    statusTitle.innerHTML =
        "WAITING FOR APPROVAL";


    statusMessage.innerHTML =
        "Your driver application has been submitted." +
        "<br><br>" +
        "Valetholic Admin will review your application." +
        "<br><br>" +
        "Please wait for approval before going on duty.";


    dutyBtn.style.display =
        "none";


    jobList.innerHTML =
        "";

}


// =====================================
// REJECTED APPLICATION
// =====================================

function showRejectedApplication() {

    statusIcon.innerHTML =
        "❌";


    statusTitle.innerHTML =
        "APPLICATION NOT APPROVED";


    statusMessage.innerHTML =
        "Unfortunately, your driver application was not approved." +
        "<br><br>" +
        "If you believe this was an error, please contact Valetholic Admin.";


    dutyBtn.style.display =
        "none";


    jobList.innerHTML =
        "";

}


// =====================================
// LOAD ACTIVE BOOKINGS
// =====================================

async function loadActiveBookings() {

    if (!currentDriver) {

        return;

    }


    // =================================
    // PREVENT OVERLAPPING REFRESHES
    // =================================

    if (isRefreshingBookings) {

        console.log(
            "⏳ Booking refresh already running."
        );

        return;

    }


    isRefreshingBookings =
        true;


    try {

        const {
            data,
            error
        } =
            await window.supabaseClient
                .from("Bookings")
                .select("*")
                .eq(
                    "driver_id",
                    currentDriver.id
                )
                .not(
                    "status",
                    "in",
                    "(COMPLETED,CANCELLED)"
                );


        if (error) {

            console.error(
                "❌ Booking refresh error:",
                error
            );

            return;

        }


        const newBookings =
            data || [];


        console.log(
            "📦 Assigned bookings:",
            newBookings
        );


        // =================================
        // DETECT NEWLY ASSIGNED JOBS
        // =================================

        if (!firstBookingLoad) {

            const newlyAssigned =
                newBookings.filter(
                    booking =>
                        !knownBookingIds.has(
                            booking.id
                        )
                );


            if (
                newlyAssigned.length > 0
            ) {

                newlyAssigned.forEach(
                    booking => {

                        showNewBookingNotification(
                            booking
                        );

                    }
                );

            }

        }


        // =================================
        // UPDATE KNOWN BOOKINGS
        // =================================

        knownBookingIds =
            new Set(
                newBookings.map(
                    booking =>
                        booking.id
                )
            );


        firstBookingLoad =
            false;


        // =================================
        // SAVE BOOKINGS
        // =================================

        bookings =
            newBookings;


        // =================================
        // SORT BOOKINGS
        // =================================

        bookings.sort(
            sortBookings
        );


        // =================================
        // DISPLAY
        // =================================

        renderBookings();

    }

    finally {

        isRefreshingBookings =
            false;

    }

}


// =====================================
// SORT BOOKINGS
// =====================================

function sortBookings(
    a,
    b
) {

    const aDate =
        getBookingDateTime(a);


    const bDate =
        getBookingDateTime(b);


    if (
        aDate !== null &&
        bDate !== null
    ) {

        return aDate - bDate;

    }


    return (
        new Date(
            a.created_at || 0
        ) -
        new Date(
            b.created_at || 0
        )
    );

}


// =====================================
// GET BOOKING DATE / TIME
// =====================================

function getBookingDateTime(
    booking
) {

    if (
        !booking.booking_date
    ) {

        return null;

    }


    let value =
        booking.booking_date;


    if (
        booking.booking_time
    ) {

        value +=
            ` ${booking.booking_time}`;

    }


    const date =
        new Date(
            value
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return null;

    }


    return date.getTime();

}


// =====================================
// RENDER ALL BOOKINGS
// =====================================

function renderBookings() {

    if (!jobList) {

        return;

    }


    jobList.innerHTML =
        "";


    if (
        !bookings ||
        bookings.length === 0
    ) {

        jobList.style.display =
            "none";

        return;

    }


    jobList.style.display =
        "flex";


    bookings.forEach(
        (
            booking,
            index
        ) => {

            const card =
                createBookingCard(
                    booking,
                    index
                );


            jobList.appendChild(
                card
            );

        }
    );

}


// =====================================
// CREATE BOOKING CARD
// =====================================

function createBookingCard(
    booking,
    index
) {

    const card =
        document.createElement(
            "div"
        );


    card.className =
        "job-card";


    card.dataset.bookingId =
        booking.id;


    // =================================
    // REFERENCE
    // =================================

    const reference =
        booking.reference_no
            ? `VH-${booking.reference_no}`
            : "VH-----";


    // =================================
    // LOCATIONS
    // =================================

    const pickup =
        getLocation(
            booking.pickups
        );


    const destination =
        getLocation(
            booking.destinations
        );


    // =================================
    // VEHICLE
    // =================================

    const vehicleModel =
        booking.vehicle_model ||
        "";


    const vehiclePlate =
        booking.vehicle_plate ||
        "";


    let vehicleText =
        "-";


    if (
        vehicleModel &&
        vehiclePlate
    ) {

        vehicleText =
            `${vehicleModel} • ${vehiclePlate}`;

    }

    else if (
        vehicleModel
    ) {

        vehicleText =
            vehicleModel;

    }

    else if (
        vehiclePlate
    ) {

        vehicleText =
            vehiclePlate;

    }


    // =================================
    // BOOKING TIME
    // =================================

    let bookingTimeText =
        "";


    if (
        booking.booking_date
    ) {

        bookingTimeText =
            escapeHTML(
                booking.booking_date
            );

    }


    if (
        booking.booking_time
    ) {

        bookingTimeText +=
            ` • ${escapeHTML(
                booking.booking_time
            )}`;

    }


    // =================================
    // QUEUE LABEL
    // =================================

    const queueLabel =
        index === 0
            ? "Current Dispatch"
            : `Next Job #${index}`;


    // =================================
    // STATUS
    // =================================

    const bookingStatus =
        normaliseStatus(
            booking.status
        );


    // =================================
    // CARD HTML
    // =================================

    card.innerHTML = `

        <!-- =========================
             BOOKING REFERENCE
        ========================== -->

        <div class="job-reference">

            ${escapeHTML(reference)}

        </div>


        <h2>

            ${escapeHTML(
                queueLabel
            )}

        </h2>


        ${
            bookingTimeText
                ? `

                    <div
                        class="job-time"
                        style="
                            margin-bottom:15px;
                            font-size:13px;
                            opacity:.7;
                        "
                    >

                        🕐 ${bookingTimeText}

                    </div>

                `
                : ""
        }


        <!-- =========================
             PICKUP
        ========================== -->

        <div class="job-section">

            <small>
                PICKUP
            </small>


            <p>
                📍 ${escapeHTML(pickup)}
            </p>


            <div class="nav-buttons">

                <button
                    type="button"
                    class="google-btn pickup-google"
                >

                    Google Maps

                </button>


                <button
                    type="button"
                    class="waze-btn pickup-waze"
                >

                    Waze

                </button>

            </div>

        </div>


        <!-- =========================
             DESTINATION
        ========================== -->

        <div class="job-section">

            <small>
                DESTINATION
            </small>


            <p>
                📍 ${escapeHTML(destination)}
            </p>


            <div class="nav-buttons">

                <button
                    type="button"
                    class="google-btn destination-google"
                >

                    Google Maps

                </button>


                <button
                    type="button"
                    class="waze-btn destination-waze"
                >

                    Waze

                </button>

            </div>

        </div>


        <!-- =========================
             CUSTOMER
        ========================== -->

        <div class="job-section">

            <small>
                CUSTOMER
            </small>


            <p>
                ${escapeHTML(
                    booking.customer_name ||
                    "-"
                )}
            </p>

        </div>


        <!-- =========================
             VEHICLE
        ========================== -->

        <div class="job-section">

            <small>
                VEHICLE
            </small>


            <p>
                ${escapeHTML(
                    vehicleText
                )}
            </p>

        </div>


        <!-- =========================
             STATUS BUTTON
        ========================== -->

        <button
            type="button"
            class="gold-btn status-job-btn"
            data-action="status"
        >

            ${getStatusButtonText(
                bookingStatus
            )}

        </button>

    `;


    // =================================
    // GOOGLE MAPS
    // =================================

    const pickupGoogle =
        card.querySelector(
            ".pickup-google"
        );


    if (
        pickupGoogle
    ) {

        pickupGoogle.addEventListener(
            "click",
            () => {

                openGoogleMaps(
                    pickup
                );

            }
        );

    }


    const destinationGoogle =
        card.querySelector(
            ".destination-google"
        );


    if (
        destinationGoogle
    ) {

        destinationGoogle.addEventListener(
            "click",
            () => {

                openGoogleMaps(
                    destination
                );

            }
        );

    }


    // =================================
    // WAZE
    // =================================

    const pickupWaze =
        card.querySelector(
            ".pickup-waze"
        );


    if (
        pickupWaze
    ) {

        pickupWaze.addEventListener(
            "click",
            () => {

                openWaze(
                    pickup
                );

            }
        );

    }


    const destinationWaze =
        card.querySelector(
            ".destination-waze"
        );


    if (
        destinationWaze
    ) {

        destinationWaze.addEventListener(
            "click",
            () => {

                openWaze(
                    destination
                );

            }
        );

    }


    // =================================
    // STATUS BUTTON
    // =================================

    const statusButton =
        card.querySelector(
            "[data-action='status']"
        );


    if (
        statusButton
    ) {

        statusButton.addEventListener(
            "click",
            () => {

                updateJobStatus(
                    booking.id
                );

            }
        );

    }


    return card;

}


// =====================================
// LOCATION HELPER
// =====================================

function getLocation(
    value
) {

    if (!value) {

        return "-";

    }


    if (
        typeof value ===
        "string"
    ) {

        return value.trim() || "-";

    }


    if (
        Array.isArray(value)
    ) {

        return value
            .map(
                item =>
                    getLocation(item)
            )
            .filter(
                item =>
                    item &&
                    item !== "-"
            )
            .join(", ") || "-";

    }


    if (
        typeof value ===
        "object"
    ) {

        const possibleFields = [

            "address",
            "location",
            "name",
            "formatted_address",
            "full_address",
            "pickup",
            "destination"

        ];


        for (
            const field of possibleFields
        ) {

            if (
                value[field] !== undefined &&
                value[field] !== null &&
                String(
                    value[field]
                ).trim() !== ""
            ) {

                return String(
                    value[field]
                ).trim();

            }

        }


        try {

            return JSON.stringify(
                value
            );

        }

        catch {

            return "-";

        }

    }


    return String(value);

}


// =====================================
// STATUS BUTTON TEXT
// =====================================

function getStatusButtonText(
    bookingStatus
) {

    const statusValue =
        normaliseStatus(
            bookingStatus
        );


    if (
        statusValue ===
        "PENDING"
    ) {

        return "START JOB";

    }


    if (
        statusValue ===
        "ON JOB"
    ) {

        return "CHIONG AH";

    }


    if (
        statusValue ===
        "ON THE WAY"
    ) {

        return "PICKED UP";

    }


    if (
        statusValue ===
        "PICKED UP"
    ) {

        return "COMPLETE JOB";

    }


    return "START JOB";

}


// =====================================
// UPDATE JOB STATUS
// =====================================

async function updateJobStatus(
    bookingId
) {

    const booking =
        bookings.find(
            item =>
                String(item.id) ===
                String(bookingId)
        );


    if (!booking) {

        console.error(
            "❌ Booking not found:",
            bookingId
        );

        return;

    }


    if (!currentDriver) {

        alert(
            "Driver session is not ready."
        );

        return;

    }


    console.log(
        "🚗 STATUS BUTTON CLICKED",
        {
            bookingId:
                booking.id,

            reference:
                booking.reference_no,

            currentStatus:
                booking.status
        }
    );


    // =================================
    // APPROVAL CHECK
    // =================================

    const {
        data: driver,
        error: driverError
    } =
        await window.supabaseClient
            .from("Drivers")
            .select(
                "approved, approval_status"
            )
            .eq(
                "auth_id",
                currentDriver.id
            )
            .single();


    if (
        driverError
    ) {

        console.error(
            "❌ Driver approval check failed:",
            driverError
        );

        alert(
            "Unable to verify driver approval."
        );

        return;

    }


    if (
        !driver ||
        driver.approved !== true ||
        normaliseStatus(
            driver.approval_status
        ) !== "APPROVED"
    ) {

        alert(
            "Your account is not approved."
        );

        return;

    }


    // =================================
    // CURRENT STATUS
    // =================================

    const currentStatus =
        normaliseStatus(
            booking.status
        );


    // =================================
    // NEXT STATUS
    // =================================

    let nextStatus;


    if (
        currentStatus ===
        "PENDING"
    ) {

        nextStatus =
            "ON JOB";

    }

    else if (
        currentStatus ===
        "ON JOB"
    ) {

        nextStatus =
            "ON THE WAY";

    }

    else if (
        currentStatus ===
        "ON THE WAY"
    ) {

        nextStatus =
            "PICKED UP";

    }

    else if (
        currentStatus ===
        "PICKED UP"
    ) {

        nextStatus =
            "COMPLETED";

    }

    else {

        return;

    }


    // =================================
    // PREPARE UPDATE
    // =================================

    const updateData = {

        status:
            nextStatus

    };


    // =================================
    // COMPLETION
    // =================================

    if (
        nextStatus ===
        "COMPLETED"
    ) {

        updateData.tracking_expires_at =
            new Date(
                Date.now() +
                (
                    6 *
                    60 *
                    60 *
                    1000
                )
            ).toISOString();


        console.log(
            "📍 Tracking expires at:",
            updateData.tracking_expires_at
        );

    }


    // =================================
    // UPDATE BOOKING
    // =================================

    const {
        data: updatedBooking,
        error
    } =
        await window.supabaseClient
            .from("Bookings")
            .update(
                updateData
            )
            .eq(
                "id",
                booking.id
            )
            .select(
                "id, status, tracking_expires_at"
            )
            .single();


    if (error) {

        console.error(
            "❌ BOOKING UPDATE FAILED:",
            error
        );

        alert(
            `Unable to update booking.\n\n${error.message}`
        );

        return;

    }


    console.log(
        "✅ BOOKING UPDATED:",
        updatedBooking
    );


    // =================================
    // UPDATE LOCAL BOOKING
    // =================================

    booking.status =
        nextStatus;


    if (
        nextStatus ===
        "COMPLETED"
    ) {

        booking.tracking_expires_at =
            updatedBooking
                ?.tracking_expires_at;

    }


    // =================================
    // COMPLETED
    // =================================

    if (
        nextStatus ===
        "COMPLETED"
    ) {

        alert(
            "🎉 Job Completed!\n\n" +
            "Customer tracking will remain available for 6 hours."
        );


        // ---------------------------------
        // REMOVE COMPLETED BOOKING
        // ---------------------------------

        bookings =
            bookings.filter(
                item =>
                    String(item.id) !==
                    String(booking.id)
            );


        // ---------------------------------
        // DRIVER RETURNS ON DUTY
        // ---------------------------------

        const {
            error:
                driverUpdateError
        } =
            await window.supabaseClient
                .from("Drivers")
                .update({

                    status:
                        "ON DUTY"

                })
                .eq(
                    "auth_id",
                    currentDriver.id
                );


        if (
            driverUpdateError
        ) {

            console.error(
                "❌ Driver status update error:",
                driverUpdateError
            );

        }


        status =
            "ON DUTY";


        renderBookings();

        updateDashboard();

        return;

    }


    // =================================
    // DRIVER STATUS FOLLOWS JOB
    // =================================

    status =
        nextStatus;


    updateDashboard();

    renderBookings();

}


// =====================================
// DUTY BUTTON
// =====================================

if (
    dutyBtn
) {

    dutyBtn.addEventListener(
        "click",
        toggleDuty
    );

}


// =====================================
// TOGGLE DUTY
// =====================================

async function toggleDuty() {

    if (!currentDriver) {

        alert(
            "Driver session is not ready."
        );

        return;

    }


    // =================================
    // UNLOCK AUDIO ON USER GESTURE
    // =================================

    await unlockNotificationAudio();


    // =================================
    // APPROVAL CHECK
    // =================================

    const {
        data: driver,
        error: driverError
    } =
        await window.supabaseClient
            .from("Drivers")
            .select(
                "approved, approval_status"
            )
            .eq(
                "auth_id",
                currentDriver.id
            )
            .single();


    if (
        driverError
    ) {

        console.error(
            "❌ Approval check failed:",
            driverError
        );

        alert(
            "Unable to verify driver approval.\n\n" +
            driverError.message
        );

        return;

    }


    if (
        !driver ||
        driver.approved !== true ||
        normaliseStatus(
            driver.approval_status
        ) !== "APPROVED"
    ) {

        alert(
            "Your account is not approved yet."
        );

        return;

    }


    // =================================
    // DON'T GO OFF DUTY DURING JOB
    // =================================

    if (
        status === "ON JOB" ||
        status === "ON THE WAY" ||
        status === "PICKED UP"
    ) {

        alert(
            "You have an active job. Complete the job before going off duty."
        );

        return;

    }


    let newStatus;


    if (
        status ===
        "OFF DUTY"
    ) {

        newStatus =
            "ON DUTY";

    }

    else {

        newStatus =
            "OFF DUTY";

    }


    // =================================
    // UPDATE DATABASE
    // =================================

    const {
        error
    } =
        await window.supabaseClient
            .from("Drivers")
            .update({

                status:
                    newStatus

            })
            .eq(
                "auth_id",
                currentDriver.id
            );


    if (error) {

        console.error(
            "❌ Duty update error:",
            error
        );

        alert(
            error.message
        );

        return;

    }


    status =
        newStatus;


    updateDashboard();


    await loadActiveBookings();

}


// =====================================
// UPDATE DASHBOARD
// =====================================

function updateDashboard() {

    const currentStatus =
        normaliseStatus(
            status
        );


    switch (
        currentStatus
    ) {


        // =================================
        // OFF DUTY
        // =================================

        case "OFF DUTY":

            statusIcon.innerHTML =
                "⚪";


            statusTitle.innerHTML =
                "OFF ALREADY AH? 👀";


            statusMessage.innerHTML =
                "Rest enough or not?";


            dutyBtn.innerHTML =
                "COME BACK LA";


            dutyBtn.style.display =
                "block";

            break;


        // =================================
        // ON DUTY
        // =================================

        case "ON DUTY":

            statusIcon.innerHTML =
                "🟢";


            statusTitle.innerHTML =
                "SLAVING";


            statusMessage.innerHTML =
                "Money Money Money!";


            dutyBtn.innerHTML =
                "BYEBYE";


            dutyBtn.style.display =
                "block";

            break;


        // =================================
        // ON JOB
        // =================================

        case "ON JOB":

            statusIcon.innerHTML =
                "🟡";


            statusTitle.innerHTML =
                "CHASING MONEY";


            statusMessage.innerHTML =
                "Kaching-Kaching!";


            dutyBtn.style.display =
                "none";

            break;


        // =================================
        // ON THE WAY
        // =================================

        case "ON THE WAY":

            statusIcon.innerHTML =
                "🚗 OTW LIAO";


            statusTitle.innerHTML =
                "Money waiting leh";


            statusMessage.innerHTML =
                "";


            dutyBtn.style.display =
                "none";

            break;


        // =================================
        // PICKED UP
        // =================================

        case "PICKED UP":

            statusIcon.innerHTML =
                "🟢";


            statusTitle.innerHTML =
                "EH GOT CUSTOMER ALREADY";


            statusMessage.innerHTML =
                "Handle with care";


            dutyBtn.style.display =
                "none";

            break;

    }

}


// =====================================
// LOG OUT BUTTON
// =====================================

if (
    logoutBtn
) {

    logoutBtn.addEventListener(
        "click",
        logoutDriver
    );

}


// =====================================
// LOGOUT DRIVER
// =====================================

async function logoutDriver() {

    const confirmed =
        window.confirm(
            "Log out from Valetholic?"
        );


    if (!confirmed) {

        return;

    }


    // =================================
    // STOP AUTO REFRESH
    // =================================

    stopBookingAutoRefresh();


    // =================================
    // STOP GPS
    // =================================

    if (
        gpsWatchId !== null &&
        navigator.geolocation
    ) {

        navigator.geolocation.clearWatch(
            gpsWatchId
        );

        gpsWatchId =
            null;

    }


    try {

        const {
            error
        } =
            await window.supabaseClient
                .auth
                .signOut();


        if (error) {

            console.error(
                "❌ Logout error:",
                error
            );

            alert(
                "Unable to log out.\n\n" +
                error.message
            );

            return;

        }


        console.log(
            "👋 Driver logged out."
        );


        window.location.href =
            "driver-portal.html";

    }

    catch (error) {

        console.error(
            "❌ Unexpected logout error:",
            error
        );

        alert(
            "Unable to log out."
        );

    }

}


// =====================================
// GOOGLE MAPS
// =====================================

function openGoogleMaps(
    address
) {

    if (
        !address ||
        address === "-"
    ) {

        return;

    }


    window.open(
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
            address
        )}`,
        "_blank"
    );

}


// =====================================
// WAZE
// =====================================

function openWaze(
    address
) {

    if (
        !address ||
        address === "-"
    ) {

        return;

    }


    window.open(
        `https://waze.com/ul?q=${encodeURIComponent(
            address
        )}&navigate=yes`,
        "_blank"
    );

}


// =====================================
// LIVE GPS
// =====================================

function startGPS() {

    if (
        gpsWatchId !== null
    ) {

        return;

    }


    if (
        !navigator.geolocation
    ) {

        console.log(
            "📍 GPS not supported."
        );

        return;

    }


    gpsWatchId =
        navigator.geolocation.watchPosition(
            updateLocation,
            gpsError,
            {

                enableHighAccuracy:
                    true,

                maximumAge:
                    5000,

                timeout:
                    10000

            }
        );


    console.log(
        "📍 Live GPS started."
    );

}


// =====================================
// UPDATE GPS
// =====================================

async function updateLocation(
    position
) {

    if (!currentDriver) {

        return;

    }


    const latitude =
        position.coords.latitude;


    const longitude =
        position.coords.longitude;


    console.log(
        "📍 GPS:",
        latitude,
        longitude
    );


    const {
        error
    } =
        await window.supabaseClient
            .from("Drivers")
            .update({

                latitude:
                    latitude,

                longitude:
                    longitude

            })
            .eq(
                "auth_id",
                currentDriver.id
            );


    if (error) {

        console.error(
            "❌ GPS update error:",
            error
        );

    }

}


// =====================================
// GPS ERROR
// =====================================

function gpsError(
    error
) {

    console.error(
        "📍 GPS Error:",
        error
    );

}


// =====================================
// HTML ESCAPE
// =====================================

function escapeHTML(
    value
) {

    return String(
        value ?? ""
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
// AUTO REFRESH BOOKINGS
// =====================================

function startBookingAutoRefresh() {

    if (
        refreshTimer
    ) {

        clearInterval(
            refreshTimer
        );

    }


    refreshTimer =
        setInterval(
            async () => {

                console.log(
                    "🔄 Checking for booking updates..."
                );


                await loadActiveBookings();

            },
            10000
        );


    console.log(
        "🔄 10-second booking refresh started."
    );

}


// =====================================
// STOP AUTO REFRESH
// =====================================

function stopBookingAutoRefresh() {

    if (!refreshTimer) {

        return;

    }


    clearInterval(
        refreshTimer
    );


    refreshTimer =
        null;

}


// =====================================
// NOTIFICATION PERMISSION
// =====================================

async function requestNotificationPermission() {

    if (
        !("Notification" in window)
    ) {

        return;

    }


    if (
        Notification.permission !==
        "default"
    ) {

        return;

    }


    try {

        const permission =
            await Notification.requestPermission();


        console.log(
            "🔔 Notification permission:",
            permission
        );

    }

    catch (error) {

        console.warn(
            "Notification permission request failed:",
            error
        );

    }

}


// =====================================
// SERVICE WORKER
// =====================================

async function registerServiceWorker() {

    if (
        !("serviceWorker" in navigator)
    ) {

        console.log(
            "🔔 Service Worker not supported."
        );

        return;

    }


    try {

        const registration =
            await navigator.serviceWorker.register(
                "service-worker.js"
            );


        console.log(
            "🔔 Valetholic Service Worker installed."
        );


        console.log(
            "🔔 Service Worker registered:",
            registration
        );


        if (
            registration.active
        ) {

            console.log(
                "🔔 Valetholic Service Worker activated."
            );

        }

    }

    catch (error) {

        console.error(
            "❌ Service Worker registration failed:",
            error
        );

    }

}


// =====================================
// NEW BOOKING NOTIFICATION
// =====================================

function showNewBookingNotification(
    booking
) {

    // =================================
    // SOUND
    // =================================

    playBookingNotificationSound();


    const reference =
        booking.reference_no
            ? `VH-${booking.reference_no}`
            : "New Booking";


    const customer =
        booking.customer_name ||
        "Customer";


    const message =
        `${reference} • ${customer}`;


    console.log(
        "🔔 NEW BOOKING:",
        message
    );


    // =================================
    // BROWSER NOTIFICATION
    // =================================

    if (
        "Notification" in window &&
        Notification.permission ===
            "granted"
    ) {

        try {

            new Notification(
                "🚗 New Valetholic Booking",
                {

                    body:
                        message,

                    icon:
                        "images/logo.png"

                }
            );

        }

        catch (error) {

            console.warn(
                "Browser notification failed:",
                error
            );

        }

    }


    // =================================
    // TOAST
    // =================================

    showBookingToast(
        message
    );

}


// =====================================
// UNLOCK NOTIFICATION AUDIO
// =====================================

async function unlockNotificationAudio() {

    const AudioContext =
        window.AudioContext ||
        window.webkitAudioContext;


    if (!AudioContext) {

        return;

    }


    try {

        if (
            !notificationAudioContext
        ) {

            notificationAudioContext =
                new AudioContext();

        }


        if (
            notificationAudioContext.state ===
            "suspended"
        ) {

            await notificationAudioContext.resume();

        }


        console.log(
            "🔊 Notification audio ready."
        );

    }

    catch (error) {

        console.warn(
            "Audio unlock failed:",
            error
        );

    }

}


// =====================================
// NEW BOOKING SOUND
// =====================================

async function playBookingNotificationSound() {

    const AudioContext =
        window.AudioContext ||
        window.webkitAudioContext;


    if (!AudioContext) {

        return;

    }


    try {

        // =================================
        // CREATE / RESUME CONTEXT
        // =================================

        if (
            !notificationAudioContext
        ) {

            notificationAudioContext =
                new AudioContext();

        }


        if (
            notificationAudioContext.state ===
            "suspended"
        ) {

            await notificationAudioContext.resume();

        }


        const audioContext =
            notificationAudioContext;


        const now =
            audioContext.currentTime;


        // =================================
        // FIRST DING
        // =================================

        const oscillator1 =
            audioContext.createOscillator();


        const gain1 =
            audioContext.createGain();


        oscillator1.type =
            "sine";


        oscillator1.frequency.value =
            880;


        gain1.gain.setValueAtTime(
            0.0001,
            now
        );


        gain1.gain.exponentialRampToValueAtTime(
            0.25,
            now + 0.02
        );


        gain1.gain.exponentialRampToValueAtTime(
            0.0001,
            now + 0.25
        );


        oscillator1.connect(
            gain1
        );


        gain1.connect(
            audioContext.destination
        );


        oscillator1.start(
            now
        );


        oscillator1.stop(
            now + 0.25
        );


        // =================================
        // SECOND DING
        // =================================

        const oscillator2 =
            audioContext.createOscillator();


        const gain2 =
            audioContext.createGain();


        oscillator2.type =
            "sine";


        oscillator2.frequency.value =
            1175;


        gain2.gain.setValueAtTime(
            0.0001,
            now + 0.18
        );


        gain2.gain.exponentialRampToValueAtTime(
            0.25,
            now + 0.20
        );


        gain2.gain.exponentialRampToValueAtTime(
            0.0001,
            now + 0.45
        );


        oscillator2.connect(
            gain2
        );


        gain2.connect(
            audioContext.destination
        );


        oscillator2.start(
            now + 0.18
        );


        oscillator2.stop(
            now + 0.45
        );


        console.log(
            "🔔 Booking notification sound played."
        );

    }

    catch (error) {

        console.warn(
            "🔇 Notification sound could not play:",
            error
        );

    }

}


// =====================================
// TOAST
// =====================================

function showBookingToast(
    message
) {

    const oldToast =
        document.getElementById(
            "bookingToast"
        );


    if (
        oldToast
    ) {

        oldToast.remove();

    }


    const toast =
        document.createElement(
            "div"
        );


    toast.id =
        "bookingToast";


    toast.innerHTML = `

        <strong>
            🔔 NEW BOOKING
        </strong>

        <br>

        ${escapeHTML(
            message
        )}

    `;


    toast.style.cssText = `

        position: fixed;

        top: 20px;

        left: 50%;

        transform:
            translateX(-50%);

        z-index: 99999;

        background:
            #d9b52f;

        color:
            #111;

        padding:
            14px 22px;

        border-radius:
            12px;

        font-size:
            14px;

        font-weight:
            600;

        box-shadow:
            0 8px 25px
            rgba(0,0,0,.25);

        text-align:
            center;

        min-width:
            240px;

    `;


    document.body.appendChild(
        toast
    );


    setTimeout(
        () => {

            if (
                toast &&
                toast.parentNode
            ) {

                toast.remove();

            }

        },
        5000
    );

}