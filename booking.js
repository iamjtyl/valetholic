// =========================================
// VALETHOLIC BOOKING REVIEW
// =========================================

const booking =
    JSON.parse(
        localStorage.getItem("booking")
    );


// =========================================
// CHECK BOOKING
// =========================================

if (!booking) {

    alert("No booking found.");

    window.location.href =
        "index.html";

}


// =========================================
// FARE CALCULATION
// =========================================

// Number of pickups
const pickupCount =
    Array.isArray(booking.pickups)
        ? booking.pickups.length
        : 0;


// Number of destinations
const destinationCount =
    Array.isArray(booking.destinations)
        ? booking.destinations.length
        : 0;


// =========================================
// ADDITIONAL STOPS
// =========================================
//
// First pickup = included
// First destination = included
//
// Every additional pickup or destination
// costs $10.
//

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
// PEAK HOUR CHECK
// =========================================

const timeParts =
    String(booking.time || "00:00")
        .split(":")
        .map(Number);


const hour =
    timeParts[0] || 0;


const minute =
    timeParts[1] || 0;


const timeInMinutes =
    (hour * 60) +
    minute;


// =========================================
// PEAK PERIODS
// =========================================
//
// Evening peak:
// 7:30 PM - 9:00 PM
//
// Morning peak:
// 4:00 AM - 5:00 AM
//

const eveningPeak =
    timeInMinutes >= (19 * 60 + 30) &&
    timeInMinutes <= (21 * 60);


const morningPeak =
    timeInMinutes >= (4 * 60) &&
    timeInMinutes <= (5 * 60);


const isPeakHour =
    eveningPeak ||
    morningPeak;


// =========================================
// BASE FARE
// =========================================

const baseFare =
    isPeakHour
        ? 60
        : 48;


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

else {

    farePeriod =
        "Standard Hours • 9:00 PM – 4:00 AM";

}


// =========================================
// TOTAL FARE
// =========================================

const totalFare =
    baseFare +
    additionalStopCharge;


// =========================================
// DISPLAY SUMMARY
// =========================================

const summary =
    document.getElementById(
        "summary"
    );


summary.innerHTML = `

<div class="summary-card booking-card">

    <h2>Journey</h2>


    <div class="summary-item">

        <span class="label">
            📍 Pickup
        </span>

        <span class="value">

            ${
                booking.pickups
                    .join("<br>")
            }

        </span>

    </div>


    <div class="summary-item">

        <span class="label">
            📍 Destination
        </span>

        <span class="value">

            ${
                booking.destinations
                    .join("<br>")
            }

        </span>

    </div>


    <div class="summary-item">

        <span class="label">
            📅 Date
        </span>

        <span class="value">

            ${booking.date}

        </span>

    </div>


    <div class="summary-item">

        <span class="label">
            🕒 Time
        </span>

        <span class="value">

            ${booking.time}

        </span>

    </div>


    <div class="summary-item">

        <span class="label">
            🚘 Vehicle
        </span>

        <span class="value">

            ${booking.vehicle}

        </span>

    </div>


    <div class="summary-item">

        <span class="label">
            📝 Remarks
        </span>

        <span class="value">

            ${
                booking.remarks ||
                "None"
            }

        </span>

    </div>

</div>


<div class="summary-card fare-card">

    <h2>Fare Estimate</h2>


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


<div class="buttons">

    <button
        onclick="history.back()"
    >

        ← Edit Booking

    </button>


    <button
        class="gold"
        onclick="submitBooking()"
    >

        Submit Booking Request

    </button>

</div>

`;


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


        const exists =
            data.some(row => {

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
                    &&
                    row.created_at
                        .startsWith(
                            currentMonth
                        )
                );

            });


        if (!exists) {

            return reference;

        }

    }

}


// =========================================
// SUBMIT BOOKING
// =========================================

async function submitBooking() {

    try {

        // ==========================
        // GET REFERENCE
        // ==========================

        const reference =
            await generateReferenceNumber();


        // ==========================
        // INSERT BOOKING
        // ==========================

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
                            booking.pickups,

                        destinations:
                            booking.destinations,

                        booking_date:
                            booking.date,

                        booking_time:
                            booking.time,

                        vehicle_model:
                            booking.vehicle,

                        remarks:
                            booking.remarks || null

                    }

                ])
                .select();


        // ==========================
        // ERROR
        // ==========================

        if (error) {

            console.error(
                "Booking submission error:",
                error
            );

            alert(
                error.message
            );

            return;

        }


        // ==========================
        // SUCCESS
        // ==========================

        console.log(
            "Booking created successfully:",
            data
        );


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


        // ==========================
        // GO TO SUCCESS PAGE
        // ==========================

        window.location.href =
            `success.html?ref=${reference}`;


    } catch (error) {

        console.error(
            "Unexpected booking error:",
            error
        );

        alert(
            "Unable to submit booking. Please try again."
        );

    }

}