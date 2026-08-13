console.log("OPS NEW BOOKING LOADED");


// ==========================
// GENERATE REFERENCE
// ==========================

async function generateReferenceNumber() {

    while (true) {

        const reference =
            Math.floor(
                1000 +
                Math.random() * 9000
            );


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


        const month =
            new Date()
                .toISOString()
                .slice(0, 7);


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
                        .startsWith(month)
                );

            });


        if (!exists) {

            return reference;

        }

    }

}


// ==========================
// CREATE BOOKING
// ==========================

async function createBooking(event) {

    event.preventDefault();


    const button =
        document.getElementById(
            "createBookingBtn"
        );


    const message =
        document.getElementById(
            "formMessage"
        );


    button.disabled = true;

    button.textContent =
        "CREATING...";


    message.textContent = "";


    try {

        // ==========================
        // GET VALUES
        // ==========================

        const customerName =
            document
                .getElementById(
                    "customerName"
                )
                .value
                .trim();


        const mobile =
            document
                .getElementById(
                    "mobile"
                )
                .value
                .trim();


        const vehiclePlate =
            document
                .getElementById(
                    "vehiclePlate"
                )
                .value
                .trim();


        const vehicleModel =
            document
                .getElementById(
                    "vehicleModel"
                )
                .value
                .trim();


        const pickup =
            document
                .getElementById(
                    "pickup"
                )
                .value
                .trim();


        const destination =
            document
                .getElementById(
                    "destination"
                )
                .value
                .trim();


                const remarks = 
                document
                .getElementById(
                    "remarks"
                )
                .value
                .trim();
       // ==========================
// BOOKING DATE & TIME
// ==========================

// Get what admin entered
const enteredDate =
    document
        .getElementById("bookingDate")
        .value;

const enteredTime =
    document
        .getElementById("bookingTime")
        .value;


// Get current Singapore date & time
const now = new Date();

const singaporeParts =
    new Intl.DateTimeFormat(
        "en-CA",
        {
            timeZone: "Asia/Singapore",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false
        }
    ).formatToParts(now);


const parts = {};

singaporeParts.forEach(part => {

    parts[part.type] =
        part.value;

});


const currentDate =
    `${parts.year}-${parts.month}-${parts.day}`;


const currentTime =
    `${parts.hour}:${parts.minute}`;


// Use admin input if provided.
// Otherwise use current Singapore date/time.

const bookingDate =
    enteredDate || currentDate;


const bookingTime =
    enteredTime || currentTime;

        // ==========================
        // VALIDATION
        // ==========================

        if (
            !customerName ||
            !mobile ||
            !pickup ||
            !destination ||
            !bookingDate ||
            !bookingTime
        ) {

            throw new Error(
                "Please complete all required fields."
            );

        }


        // ==========================
        // REFERENCE
        // ==========================

        const reference =
            await generateReferenceNumber();


        // ==========================
        // BOOKING DATA
        // ==========================

        const bookingData = {

    reference_no:
        reference,

    customer_name:
        customerName,

    mobile:
        mobile,

    vehicle_model:
        vehicleModel,

    vehicle_plate:
        vehiclePlate,

    pickups:
        [pickup],

    destinations:
        [destination],

    booking_date:
        bookingDate,

    booking_time:
        bookingTime,

    remarks:
        remarks

        };


        // ==========================
        // INSERT
        // ==========================

        const {
            data,
            error
        } =
            await window.supabaseClient

            .from("Bookings")

            .insert([
                bookingData
            ])

            .select();


        if (error) {

            console.error(
                "Create booking error:",
                error
            );

            throw new Error(
                error.message
            );

        }


        console.log(
            "Booking created:",
            data
        );


        // ==========================
        // SUCCESS
        // ==========================

        message.textContent =
            `Booking created successfully. VH-${reference}`;


        message.style.color =
            "#6ee7a0";


        button.textContent =
            "BOOKING CREATED";


        // Give Supabase a moment,
        // then return to OPS.

        setTimeout(() => {

            window.location.href =
                "ops-dashboard.html";

        }, 900);


    } catch (error) {

        console.error(error);


        message.textContent =
            error.message ||
            "Unable to create booking.";


        message.style.color =
            "#ff8a8a";


        button.disabled = false;

        button.textContent =
            "CREATE BOOKING";

    }

}


// ==========================
// FORM EVENT
// ==========================

document
    .getElementById(
        "newBookingForm"
    )
    .addEventListener(
        "submit",
        createBooking
    );