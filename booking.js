// =========================================
// VALETHOLIC
// BOOKING REVIEW & SUBMISSION
// =========================================


// =========================================
// GET SAVED BOOKING
// =========================================

let booking = null;

try {

    booking =
        JSON.parse(
            localStorage.getItem("booking")
        );

} catch (error) {

    console.error(
        "Unable to read saved booking:",
        error
    );

}


// =========================================
// CHECK BOOKING
// =========================================

if (!booking) {

    alert(
        "No booking found."
    );

    window.location.href =
        "index.html";

}


// =========================================
// BASIC DATA SAFETY
// =========================================

const pickups =
    Array.isArray(booking.pickups)
        ? booking.pickups
        : [];


const destinations =
    Array.isArray(booking.destinations)
        ? booking.destinations
        : [];


// =========================================
// ESCAPE HTML
// =========================================

function escapeHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


// =========================================
// FORMAT LIST
// =========================================

function formatList(values) {

    if (
        !Array.isArray(values) ||
        values.length === 0
    ) {

        return "Not provided";

    }


    return values
        .map(
            value =>
                escapeHTML(value)
        )
        .join("<br>");

}


// =========================================
// FARE CALCULATION
// =========================================

const pickupCount =
    pickups.length;


const destinationCount =
    destinations.length;


const additionalPickups =
    Math.max(
        0,
        pickupCount - 1
    );


const additionalDestinations =
    Math.max(
        0,
        destinationCount - 1
    );


const additionalStops =
    additionalPickups +
    additionalDestinations;


const additionalStopCharge =
    additionalStops * 10;


// =========================================
// SELECTED TIME
// =========================================

const timeParts =
    String(
        booking.time || "00:00"
    )
    .split(":")
    .map(Number);


const hour =
    Number.isFinite(timeParts[0])
        ? timeParts[0]
        : 0;


const minute =
    Number.isFinite(timeParts[1])
        ? timeParts[1]
        : 0;


const timeInMinutes =
    (hour * 60) +
    minute;


// =========================================
// PEAK HOUR CHECK
// =========================================
//
// Evening Peak:
// 7:30 PM - 9:00 PM
//
// Morning Peak:
// 4:00 AM - 5:00 AM
//
// Standard Hours:
// 9:00 PM - 4:00 AM
//
// Outside operating hours:
// Price Upon Enquiry
// =========================================

const eveningPeak =
    timeInMinutes >=
        (19 * 60 + 30)
    &&
    timeInMinutes <=
        (21 * 60);


const morningPeak =
    timeInMinutes >=
        (4 * 60)
    &&
    timeInMinutes <=
        (5 * 60);


// =========================================
// STANDARD HOURS
// =========================================

const standardHours =
    timeInMinutes >=
        (21 * 60)
    ||
    timeInMinutes <
        (4 * 60);


// =========================================
// BASE FARE
// =========================================

let baseFare = 0;


// =========================================
// STANDARD / PEAK FARES
// =========================================

if (
    eveningPeak ||
    morningPeak
) {

    baseFare = 60;

}

else if (standardHours) {

    baseFare = 48;

}


// =========================================
// FARE PERIOD TEXT
// =========================================

let farePeriod;


if (eveningPeak) {

    farePeriod =
        "Peak Hours • 7:30 PM – 9:00 PM";

}

else if (morningPeak) {

    farePeriod =
        "Peak Hours • 4:00 AM – 5:00 AM";

}

else if (standardHours) {

    farePeriod =
        "Standard Hours • 9:00 PM – 4:00 AM";

}

else {

    farePeriod =
        "Outside Standard Hours • Price Upon Enquiry";

}


// =========================================
// TOTAL FARE
// =========================================

const totalFare =
    baseFare +
    additionalStopCharge;


// =========================================
// DISPLAY VALUES
// =========================================

const customerName =
    escapeHTML(
        booking.customer_name ||
        "Customer"
    );


const mobile =
    escapeHTML(
        booking.mobile ||
        ""
    );


const bookingDate =
    escapeHTML(
        booking.date ||
        ""
    );


const bookingTime =
    escapeHTML(
        booking.time ||
        ""
    );


const vehicle =
    escapeHTML(
        booking.vehicle ||
        ""
    );


const remarks =
    escapeHTML(
        booking.remarks ||
        "None"
    );


// =========================================
// DISPLAY SUMMARY
// =========================================

const summary =
    document.getElementById(
        "summary"
    );


if (!summary) {

    console.error(
        "Booking summary container not found."
    );

}

else {

    summary.innerHTML = `

        <!-- =================================
             JOURNEY
        ================================== -->

        <div class="summary-card booking-card">

            <h2>
                Journey
            </h2>


            <div class="summary-item">

                <span class="label">
                    📍 Pickup
                </span>

                <span class="value">
                    ${formatList(pickups)}
                </span>

            </div>


            <div class="summary-item">

                <span class="label">
                    📍 Destination
                </span>

                <span class="value">
                    ${formatList(destinations)}
                </span>

            </div>


            <div class="summary-item">

                <span class="label">
                    📅 Date
                </span>

                <span class="value">
                    ${bookingDate}
                </span>

            </div>


            <div class="summary-item">

                <span class="label">
                    🕒 Time
                </span>

                <span class="value">
                    ${bookingTime}
                </span>

            </div>


            <div class="summary-item">

                <span class="label">
                    🚘 Vehicle
                </span>

                <span class="value">
                    ${vehicle}
                </span>

            </div>


            <div class="summary-item">

                <span class="label">
                    📝 Remarks
                </span>

                <span class="value">
                    ${remarks}
                </span>

            </div>

        </div>


        <!-- =================================
             FARE
        ================================== -->

        <div class="summary-card fare-card">

            <h2>
                Fare Estimate
            </h2>


            <!-- BASE FARE -->

            <div class="summary-item">

                <span class="label">

                    <strong>
                        Base Fare<br>
                        (${farePeriod})
                    </strong>

                </span>


                <span class="value">

                    <strong>
                        $${baseFare}
                    </strong>

                </span>

            </div>


            <!-- ADDITIONAL STOPS -->

            <div class="summary-item">

                <span class="label">
                    Additional Stops
                </span>


                <span class="value">
                    $${additionalStopCharge}
                </span>

            </div>


            <!-- TOTAL -->

            <div class="summary-item">

                <span class="label">

                    <strong>
                        Total
                    </strong>

                </span>


                <span class="value">

                    <strong>
                        $${totalFare}
                    </strong>

                </span>

            </div>

        </div>


        <!-- =================================
             ACTION BUTTONS
        ================================== -->

        <div class="buttons">

            <button
                type="button"
                id="editBookingButton"
            >

                ← Edit Booking

            </button>


            <button
                type="button"
                class="gold"
                id="submitBookingButton"
            >

                Submit Booking Request

            </button>

        </div>

    `;

}


// =========================================
// EDIT BOOKING
// =========================================

const editBookingButton =
    document.getElementById(
        "editBookingButton"
    );


if (editBookingButton) {

    editBookingButton.addEventListener(
        "click",
        () => {

            history.back();

        }
    );

}


// =========================================
// SUBMIT BUTTON
// =========================================

const submitButton =
    document.getElementById(
        "submitBookingButton"
    );


let bookingSubmitting =
    false;


if (submitButton) {

    submitButton.addEventListener(
        "click",
        submitBooking
    );

}


// =========================================
// GENERATE REFERENCE NUMBER
// =========================================

async function generateReferenceNumber() {

    while (true) {

        const reference =
            Math.floor(
                1000 +
                Math.random() * 9000
            );


        const currentMonth =
            new Date()
                .toISOString()
                .slice(0, 7);


        const {
            data,
            error
        } =
            await window.supabaseClient
                .from("Bookings")
                .select(
                    "reference_no, created_at"
                );


        if (error) {

            console.error(
                "Reference lookup error:",
                error
            );

            return reference;

        }


        const rows =
            Array.isArray(data)
                ? data
                : [];


        const exists =
            rows.some(
                row => {

                    if (
                        !row.reference_no ||
                        !row.created_at
                    ) {

                        return false;

                    }


                    return (
                        Number(
                            row.reference_no
                        ) === reference
                    )
                    &&
                    row.created_at
                        .startsWith(
                            currentMonth
                        );

                }
            );


        if (!exists) {

            return reference;

        }

    }

}


// =========================================
// SUBMIT BOOKING
// =========================================

async function submitBooking() {

    if (bookingSubmitting) {

        return;

    }


    bookingSubmitting =
        true;


    if (submitButton) {

        submitButton.disabled =
            true;

        submitButton.textContent =
            "Submitting...";

    }


    try {

        // =================================
        // CHECK SUPABASE
        // =================================

        if (
            !window.supabaseClient
        ) {

            throw new Error(
                "Booking service is not available. Please refresh the page and try again."
            );

        }


        // =================================
        // GENERATE REFERENCE
        // =================================

        const reference =
            await generateReferenceNumber();


        // =================================
        // INSERT BOOKING
        // =================================

        const {
            data,
            error
        } =
            await window.supabaseClient
                .from("Bookings")
                .insert([

                    {

                        reference_no:
                            reference,

                        customer_name:
                            booking.customer_name,

                        mobile:
                            booking.mobile,

                        pickups:
                            pickups,

                        destinations:
                            destinations,

                        booking_date:
                            booking.date,

                        booking_time:
                            booking.time,

                        vehicle_model:
                            booking.vehicle,

                        remarks:
                            booking.remarks ||
                            null

                    }

                ])
                .select();


        if (error) {

            console.error(
                "Booking submission error:",
                error
            );

            throw new Error(
                error.message ||
                "Unable to submit booking."
            );

        }


        console.log(
            "Booking created successfully:",
            data
        );


        // =================================
        // SAVE CREATED BOOKING
        // =================================

        if (
            data &&
            data.length > 0
        ) {

            localStorage.setItem(
                "bookingData",
                JSON.stringify(
                    data[0]
                )
            );

        }


        // =================================
        // GO TO SUCCESS PAGE
        // =================================

        window.location.href =
            `success.html?ref=${encodeURIComponent(
                reference
            )}`;

    }

    catch (error) {

        console.error(
            "Unexpected booking error:",
            error
        );


        alert(
            error.message ||
            "Unable to submit booking. Please try again."
        );


        bookingSubmitting =
            false;


        if (submitButton) {

            submitButton.disabled =
                false;

            submitButton.textContent =
                "Submit Booking Request";

        }

    }

}