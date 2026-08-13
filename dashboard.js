// =====================================
// VALETHOLIC DRIVER DASHBOARD
// =====================================

let currentDriver = null;

let bookings = [];

let status = "OFF DUTY";

let knownBookingIds = new Set();
let firstBookingLoad = true;
let refreshTimer = null;


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


// =====================================
// START
// =====================================

loadDriver();


// =====================================
// LOAD DRIVER
// =====================================

async function loadDriver() {

    const {
        data: { user },
        error
    } =
        await window.supabaseClient.auth.getUser();


    if (error) {

        console.error(error);

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


    console.log(
        "Logged in user:",
        user.id
    );


    // =================================
    // GET DRIVER
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
            driverError
        );

        alert(
            driverError.message
        );

        return;

    }


    console.log(
        "Driver:",
        driver
    );


    // =================================
    // APPROVAL
    // =================================

    if (
        driver.approval_status ===
        "PENDING"
    ) {

        showPendingApproval();

        return;

    }


    if (
        driver.approval_status ===
        "REJECTED"
    ) {

        showRejectedApplication();

        return;

    }


    // =================================
    // APPROVED SAFETY CHECK
    // =================================

    if (
        driver.approval_status !==
            "APPROVED"
        ||
        driver.approved !== true
    ) {

        showPendingApproval();

        return;

    }


    // =================================
    // APPROVED DRIVER
    // =================================

    status =
        driver.status ||
        "OFF DUTY";


    updateDashboard();


    // =================================
    // LOAD ALL ACTIVE BOOKINGS
    // =================================

    await loadActiveBookings();

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
// REJECTED
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
        .neq(
            "status",
            "COMPLETED"
        )
        .neq(
            "status",
            "CANCELLED"
        );


    // =================================
    // QUERY ERROR
    // =================================

    if (error) {

        console.error(
            "Booking refresh error:",
            error
        );

        return;

    }


    // =================================
    // IMPORTANT:
    // DON'T WIPE A WORKING QUEUE
    // IF A REFRESH TEMPORARILY RETURNS 0
    // =================================

    if (
        !data ||
        data.length === 0
    ) {

        console.warn(
            "⚠️ Booking refresh returned 0 bookings. Keeping existing queue."
        );

        return;

    }


    const newBookings =
        data;


    // =================================
    // CHECK FOR NEWLY ASSIGNED JOBS
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
    // SORT
    // =================================

    bookings.sort(
        sortBookings
    );


    // =================================
    // DISPLAY
    // =================================

    renderBookings();

}
// =====================================
// SORT BOOKINGS
// =====================================

function sortBookings(
    a,
    b
) {

    // -------------------------------
    // DATE + TIME
    // -------------------------------

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


    // -------------------------------
    // FALLBACK
    // -------------------------------

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
// GET BOOKING DATE/TIME
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
        new Date(value);


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
        "block";


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
            booking.booking_date;

    }


    if (
        booking.booking_time
    ) {

        bookingTimeText +=
            ` • ${booking.booking_time}`;

    }



    // =================================
    // QUEUE LABEL
    // =================================

    let queueLabel =
        "Current Dispatch";


    if (
        index > 0
    ) {

        queueLabel =
            `Next Job #${index}`;

    }



    // =================================
    // CARD HTML
    // =================================

    card.innerHTML = `

        <h2>
            ${queueLabel}
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


        <div class="job-section">

            <small>
                PICKUP
            </small>

            <p>
                📍 ${escapeHTML(pickup)}
            </p>


            <div class="nav-buttons">

                <button
                    class="google-btn pickup-google"
                >
                    Google Maps
                </button>


                <button
                    class="waze-btn pickup-waze"
                >
                    Waze
                </button>

            </div>

        </div>



        <div class="job-section">

            <small>
                DESTINATION
            </small>

            <p>
                📍 ${escapeHTML(destination)}
            </p>


            <div class="nav-buttons">

                <button
                    class="google-btn destination-google"
                >
                    Google Maps
                </button>


                <button
                    class="waze-btn destination-waze"
                >
                    Waze
                </button>

            </div>

        </div>



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



       <button
    class="gold-btn status-job-btn"
    data-action="status"
>
    ${booking.status === "ON JOB" ? "COMPLETE JOB" : "START JOB"}
</button>

    `;



    // =================================
    // NAVIGATION BUTTONS
    // =================================

    card
        .querySelector(
            ".pickup-google"
        )
        .addEventListener(
            "click",
            () => {

                openGoogleMaps(
                    pickup
                );

            }
        );


    card
        .querySelector(
            ".destination-google"
        )
        .addEventListener(
            "click",
            () => {

                openGoogleMaps(
                    destination
                );

            }
        );


    card
        .querySelector(
            ".pickup-waze"
        )
        .addEventListener(
            "click",
            () => {

                openWaze(
                    pickup
                );

            }
        );


    card
        .querySelector(
            ".destination-waze"
        )
        .addEventListener(
            "click",
            () => {

                openWaze(
                    destination
                );

            }
        );



    // =================================
    // STATUS BUTTON
    // =================================

    const statusButton =
        card.querySelector(
            "[data-action='status']"
        );


    statusButton.addEventListener(
        "click",
        () => {

            updateJobStatus(
                booking.id
            );

        }
    );


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
        Array.isArray(value)
    ) {

        return value[0] || "-";

    }


    try {

        const parsed =
            JSON.parse(value);


        if (
            Array.isArray(parsed)
        ) {

            return parsed[0] || "-";

        }


        return parsed || "-";

    }

    catch {

        return value;

    }

}



// =====================================
// STATUS BUTTON TEXT
// =====================================

function getStatusButtonText(
    bookingStatus
) {

    if (
        bookingStatus ===
        "ON JOB"
    ) {

        return "CHIONG AH";

    }


    if (
        bookingStatus ===
        "ON THE WAY"
    ) {

        return "PICKED UP";

    }


    if (
        bookingStatus ===
        "PICKED UP"
    ) {

        return "COMPLETE JOB";

    }


    return "";

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
                item.id ===
                bookingId
        );


    if (!booking) {

        return;

    }


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
        driverError ||
        !driver ||
        driver.approved !== true ||
        driver.approval_status !==
            "APPROVED"
    ) {

        alert(
            "Your account is not approved."
        );

        return;

    }



    // =================================
    // NEXT STATUS
    // =================================

    let nextStatus;


    if (
        booking.status ===
        "ON JOB"
    ) {

        nextStatus =
            "ON THE WAY";

    }

    else if (
        booking.status ===
        "ON THE WAY"
    ) {

        nextStatus =
            "PICKED UP";

    }

    else if (
        booking.status ===
        "PICKED UP"
    ) {

        nextStatus =
            "COMPLETED";

    }

    else {

        return;

    }



    // =================================
    // UPDATE BOOKING
    // =================================

    const {
        error
    } =
        await window.supabaseClient
        .from("Bookings")
        .update({

            status:
                nextStatus

        })
        .eq(
            "id",
            booking.id
        );


    if (error) {

        alert(
            error.message
        );

        console.error(
            error
        );

        return;

    }



    // =================================
    // UPDATE LOCAL BOOKING
    // =================================

    booking.status =
        nextStatus;



    // =================================
    // COMPLETED
    // =================================

    if (
        nextStatus ===
        "COMPLETED"
    ) {

        alert(
            "🎉 Job Completed!"
        );


        // -----------------------------
        // Remove completed booking
        // -----------------------------

        bookings =
            bookings.filter(
                item =>
                    item.id !==
                    booking.id
            );


        // -----------------------------
        // Driver becomes ON DUTY
        // -----------------------------

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
                driverUpdateError
            );

        }


        status =
            "ON DUTY";


        // -----------------------------
        // RENDER NEXT JOB
        // -----------------------------

        renderBookings();


        updateDashboard();


        return;

    }



    // =================================
    // DRIVER STATUS FOLLOWS CURRENT JOB
    // =================================

    status =
        nextStatus;


    updateDashboard();


    renderBookings();

}



// =====================================
// DUTY BUTTON
// =====================================

dutyBtn.addEventListener(
    "click",
    toggleDuty
);


async function toggleDuty() {

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
        driverError ||
        !driver ||
        driver.approved !== true ||
        driver.approval_status !==
            "APPROVED"
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

        alert(
            error.message
        );

        console.error(
            error
        );

        return;

    }


    status =
        newStatus;


    updateDashboard();

}



// =====================================
// UPDATE DASHBOARD
// =====================================

function updateDashboard() {

    // =================================
    // OFF DUTY
    // =================================

    if (
        status ===
        "OFF DUTY"
    ) {

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


        return;

    }



    // =================================
    // ON DUTY
    // =================================

    if (
        status ===
        "ON DUTY"
    ) {

        statusIcon.innerHTML =
            "🟢";


        statusTitle.innerHTML =
            "SLAVING";


        statusMessage.innerHTML =
            "Money Money Money!";


        dutyBtn.innerHTML =
            "Byebye";


        dutyBtn.style.display =
            "block";


        return;

    }



    // =================================
    // ON JOB
    // =================================

    if (
        status ===
        "ON JOB"
    ) {

        statusIcon.innerHTML =
            "🟡";


        statusTitle.innerHTML =
            "CHASING MONEY";


        statusMessage.innerHTML =
            "Kaching-Kaching!";


        dutyBtn.style.display =
            "none";


        return;

    }



    // =================================
    // ON THE WAY
    // =================================

    if (
        status ===
        "ON THE WAY"
    ) {

        statusIcon.innerHTML =
            "🚗 OTW LIAO";


        statusTitle.innerHTML =
            "Money waiting leh";


        statusMessage.innerHTML =
            "";


        dutyBtn.style.display =
            "none";


        return;

    }



    // =================================
    // PICKED UP
    // =================================

    if (
        status ===
        "PICKED UP"
    ) {

        statusIcon.innerHTML =
            "🟢";


        statusTitle.innerHTML =
            "EH GOT CUSTOMER ALREADY";


        statusMessage.innerHTML =
            "Handle with care";


        dutyBtn.style.display =
            "none";


        return;

    }

}



// =====================================
// GOOGLE MAPS
// =====================================

function openGoogleMaps(
    address
) {

    if (!address) {

        return;

    }


    window.open(

        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`,

        "_blank"

    );

}



// =====================================
// WAZE
// =====================================

function openWaze(
    address
) {

    if (!address) {

        return;

    }


    window.open(

        `https://waze.com/ul?q=${encodeURIComponent(address)}&navigate=yes`,

        "_blank"

    );

}



// =====================================
// LIVE GPS
// =====================================

startGPS();


function startGPS() {

    if (
        !navigator.geolocation
    ) {

        console.log(
            "GPS not supported."
        );

        return;

    }


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
        "GPS:",
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
            "GPS update error:",
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
        "GPS Error:",
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

    if (refreshTimer) {

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

}


startBookingAutoRefresh();
// =====================================
// NEW BOOKING NOTIFICATION
// =====================================

function showNewBookingNotification(
    booking
) {
    playBookingNotificationSound();

    const reference =
        booking.reference_no ||
        "New Booking";


    const customer =
        booking.customer_name ||
        "Customer";


    const message =
        `${reference} • ${customer}`;


    console.log(
        "🔔 NEW BOOKING:",
        message
    );

// =====================================
// NEW BOOKING SOUND
// =====================================

function playBookingNotificationSound() {

    const AudioContext =
        window.AudioContext ||
        window.webkitAudioContext;

    if (!AudioContext) {
        return;
    }

    const audioContext =
        new AudioContext();

    const now =
        audioContext.currentTime;


    // First ding
    const oscillator1 =
        audioContext.createOscillator();

    const gain1 =
        audioContext.createGain();

    oscillator1.type = "sine";
    oscillator1.frequency.value = 880;

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

    oscillator1.connect(gain1);
    gain1.connect(audioContext.destination);

    oscillator1.start(now);
    oscillator1.stop(now + 0.25);


    // Second ding
    const oscillator2 =
        audioContext.createOscillator();

    const gain2 =
        audioContext.createGain();

    oscillator2.type = "sine";
    oscillator2.frequency.value = 1175;

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

    oscillator2.connect(gain2);
    gain2.connect(audioContext.destination);

    oscillator2.start(now + 0.18);
    oscillator2.stop(now + 0.45);
}
    // =================================
    // BROWSER NOTIFICATION
    // =================================

    if (
        "Notification" in window &&
        Notification.permission ===
            "granted"
    ) {

        new Notification(
            "🚗 New Valetholic Booking",
            {
                body:
                    message,

                icon:
                    "logo.png"
            }
        );

    }


    // =================================
    // ON-SCREEN NOTIFICATION
    // =================================

    showBookingToast(
        message
    );

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


    if (oldToast) {

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

        ${escapeHTML(message)}
    `;


    toast.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 99999;

        background: #d9b52f;
        color: #111;

        padding: 14px 22px;

        border-radius: 12px;

        font-size: 14px;
        font-weight: 600;

        box-shadow:
            0 8px 25px rgba(0,0,0,.35);

        text-align: center;

        min-width: 220px;

        animation:
            bookingToastIn .3s ease;
    `;


    document.body.appendChild(
        toast
    );


    setTimeout(
        () => {

            toast.remove();

        },
        5000
    );

}