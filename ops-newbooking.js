console.log("OPS NEW BOOKING LOADED");


// =====================================
// GENERATE REFERENCE NUMBER
// =====================================

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


        // =================================
        // REFERENCE LOOKUP ERROR
        // =================================

        if (error) {

            console.error(
                "Reference lookup error:",
                error
            );

            // Fall back to generated number
            return reference;

        }


        // =================================
        // CURRENT MONTH
        // =================================

        const currentMonth =
            new Date()
                .toISOString()
                .slice(0, 7);


        // =================================
        // CHECK DUPLICATE
        // =================================

        const exists =
            (data || []).some(
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
                        &&
                        row.created_at
                            .startsWith(
                                currentMonth
                            )
                    );

                }
            );


        // =================================
        // UNIQUE REFERENCE
        // =================================

        if (!exists) {

            return reference;

        }

    }

}



// =====================================
// GET CURRENT SINGAPORE DATE / TIME
// =====================================

function getSingaporeDateTime() {

    const now =
        new Date();


    const singaporeParts =
        new Intl.DateTimeFormat(
            "en-CA",
            {
                timeZone:
                    "Asia/Singapore",

                year:
                    "numeric",

                month:
                    "2-digit",

                day:
                    "2-digit",

                hour:
                    "2-digit",

                minute:
                    "2-digit",

                hour12:
                    false
            }
        ).formatToParts(now);


    const parts = {};


    singaporeParts.forEach(
        part => {

            parts[part.type] =
                part.value;

        }
    );


    return {

        date:
            `${parts.year}-${parts.month}-${parts.day}`,

        time:
            `${parts.hour}:${parts.minute}`

    };

}



// =====================================
// CREATE BOOKING
// =====================================

async function createBooking(event) {

    event.preventDefault();


    // =================================
    // ELEMENTS
    // =================================

    const button =
        document.getElementById(
            "createBookingBtn"
        );


    const message =
        document.getElementById(
            "formMessage"
        );


    // =================================
    // START LOADING
    // =================================

    button.disabled = true;

    button.textContent =
        "CREATING...";

    message.textContent =
        "";



    try {


        // =================================
        // GET CUSTOMER DETAILS
        // =================================

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



        // =================================
        // GET VEHICLE DETAILS
        // =================================

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



        // =================================
        // GET JOURNEY DETAILS
        // =================================

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



        // =================================
        // GET REMARKS
        // =================================

        const remarks =
            document
                .getElementById(
                    "remarks"
                )
                .value
                .trim();



        // =================================
        // GET DATE / TIME
        // =================================

        const enteredDate =
            document
                .getElementById(
                    "bookingDate"
                )
                .value;


        const enteredTime =
            document
                .getElementById(
                    "bookingTime"
                )
                .value;



        // =================================
        // SINGAPORE CURRENT TIME
        // =================================

        const singaporeDateTime =
            getSingaporeDateTime();



        // =================================
        // USE ADMIN INPUT
        // OR CURRENT SINGAPORE TIME
        // =================================

        const bookingDate =
            enteredDate ||
            singaporeDateTime.date;


        const bookingTime =
            enteredTime ||
            singaporeDateTime.time;



        // =================================
        // VALIDATION
        // =================================

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



        // =================================
        // GENERATE REFERENCE
        // =================================

        const reference =
            await generateReferenceNumber();



        // =================================
        // BOOKING DATA
        // =================================

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
                    bookingData
                ])
                .select();



        // =================================
        // DATABASE ERROR
        // =================================

        if (error) {

            console.error(
                "Create booking error:",
                error
            );

            throw new Error(
                error.message
            );

        }



        // =================================
        // LOG RESULT
        // =================================

        console.log(
            "Booking created:",
            data
        );



        // =================================
        // SUCCESS MESSAGE
        // =================================

        message.textContent =
            `Booking created successfully. VH-${reference}`;


        message.style.color =
            "#6ee7a0";


        button.textContent =
            "BOOKING CREATED";



        // =================================
        // RETURN TO OPS
        // =================================

        setTimeout(
            () => {

                window.location.href =
                    "ops-dashboard.html";

            },
            900
        );


    }


    // =====================================
    // ERROR HANDLING
    // =====================================

    catch (error) {

        console.error(
            "Create booking error:",
            error
        );


        message.textContent =
            error.message ||
            "Unable to create booking.";


        message.style.color =
            "#ff8a8a";


        button.disabled =
            false;


        button.textContent =
            "CREATE BOOKING";

    }

}



// =====================================
// FORM EVENT
// =====================================

const newBookingForm =
    document.getElementById(
        "newBookingForm"
    );


if (newBookingForm) {

    newBookingForm.addEventListener(
        "submit",
        createBooking
    );

}