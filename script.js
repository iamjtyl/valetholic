console.log("VALETHOLIC BOOKING SCRIPT LOADED");


// =========================================
// RESTORE PREVIOUS BOOKING
// =========================================

function restoreBooking() {

    const saved =
        localStorage.getItem("booking");

    if (!saved) {
        return;
    }

    try {

        const booking =
            JSON.parse(saved);

        console.log(
            "Restoring booking:",
            booking
        );


        // =========================================
        // CUSTOMER
        // =========================================

        const customerName =
            document.getElementById("customerName");

        const mobile =
            document.getElementById("mobileNumber");


        if (customerName) {

            customerName.value =
                booking.customer_name || "";

        }


        if (mobile) {

            mobile.value =
                booking.mobile || "";

        }


        // =========================================
        // DATE & TIME
        // =========================================

        const date =
            document.getElementById("bookingDate");

        const time =
            document.getElementById("bookingTime");


        if (date) {

            date.value =
                booking.date || "";

        }


        if (time) {

            time.value =
                booking.time || "";

        }


        // =========================================
        // VEHICLE
        // =========================================

        const vehicle =
            document.getElementById("vehicleModel");


        if (vehicle) {

            vehicle.value =
                booking.vehicle || "";

        }


        // =========================================
        // REMARKS
        // =========================================

        const remarks =
            document.querySelector("textarea");


        if (remarks) {

            remarks.value =
                booking.remarks || "";

        }


        // =========================================
        // RESTORE PICKUPS
        // =========================================

        const pickupContainer =
            document.getElementById("pickupContainer");


        if (
            pickupContainer &&
            Array.isArray(booking.pickups)
        ) {

            pickupContainer.innerHTML = "";


            booking.pickups.forEach(
                (pickup, index) => {

                    const input =
                        document.createElement("input");


                    input.type =
                        "text";

                    input.required =
                        true;

                    input.placeholder =
                        index === 0
                            ? "Enter pickup location"
                            : "Enter another pickup";

                    input.value =
                        pickup || "";


                    pickupContainer.appendChild(
                        input
                    );

                }
            );

        }


        // =========================================
        // RESTORE DESTINATIONS
        // =========================================

        const destinationContainer =
            document.getElementById(
                "destinationContainer"
            );


        if (
            destinationContainer &&
            Array.isArray(booking.destinations)
        ) {

            destinationContainer.innerHTML = "";


            booking.destinations.forEach(
                (destination, index) => {

                    const input =
                        document.createElement("input");


                    input.type =
                        "text";

                    input.required =
                        true;

                    input.placeholder =
                        index === 0
                            ? "Enter destination"
                            : "Enter another destination";

                    input.value =
                        destination || "";


                    destinationContainer.appendChild(
                        input
                    );

                }
            );

        }


        console.log(
            "Booking restored successfully."
        );


    } catch (error) {

        console.error(
            "RESTORE ERROR:",
            error
        );

    }

}



// =========================================
// ADD PICKUP
// =========================================

function addPickup() {

    const container =
        document.getElementById(
            "pickupContainer"
        );


    if (!container) {
        return;
    }


    const input =
        document.createElement("input");


    input.type =
        "text";

    input.placeholder =
        "Enter another pickup";

    input.required =
        true;


    container.appendChild(
        input
    );

}



// =========================================
// ADD DESTINATION
// =========================================

function addDestination() {

    const container =
        document.getElementById(
            "destinationContainer"
        );


    if (!container) {
        return;
    }


    const input =
        document.createElement("input");


    input.type =
        "text";

    input.placeholder =
        "Enter another destination";

    input.required =
        true;


    container.appendChild(
        input
    );

}



// =========================================
// CONTINUE TO REVIEW
// =========================================

async function continueBooking() {

    try {


        // =========================================
        // CUSTOMER
        // =========================================

        const customerName =
            document
                .getElementById("customerName")
                .value
                .trim();


        const mobile =
            document
                .getElementById("mobileNumber")
                .value
                .trim();



        // =========================================
        // DATE & TIME
        // =========================================

        const date =
            document
                .getElementById("bookingDate")
                .value;


        const time =
            document
                .getElementById("bookingTime")
                .value;



        // =========================================
        // VEHICLE
        // =========================================

        const vehicle =
            document
                .getElementById("vehicleModel")
                .value
                .trim();



        // =========================================
        // PICKUPS & DESTINATIONS
        // =========================================

        const pickupInputs =
            document.querySelectorAll(
                "#pickupContainer input"
            );


        const destinationInputs =
            document.querySelectorAll(
                "#destinationContainer input"
            );



        // =========================================
        // VALIDATION
        // =========================================

        if (!customerName) {

            alert(
                "Please enter your name."
            );

            document
                .getElementById("customerName")
                .focus();

            return;

        }


        if (!mobile) {

            alert(
                "Please enter your mobile number."
            );

            document
                .getElementById("mobileNumber")
                .focus();

            return;

        }


        // =========================================
        // VALIDATE PICKUPS
        // =========================================

        for (
            const input of pickupInputs
        ) {

            if (!input.value.trim()) {

                alert(
                    "Please complete all pickup locations."
                );

                input.focus();

                return;

            }

        }


        // =========================================
        // VALIDATE DESTINATIONS
        // =========================================

        for (
            const input of destinationInputs
        ) {

            if (!input.value.trim()) {

                alert(
                    "Please complete all destinations."
                );

                input.focus();

                return;

            }

        }


        if (!date) {

            alert(
                "Please select a date."
            );

            document
                .getElementById("bookingDate")
                .focus();

            return;

        }


        if (!time) {

            alert(
                "Please select a time."
            );

            document
                .getElementById("bookingTime")
                .focus();

            return;

        }


        if (!vehicle) {

            alert(
                "Please enter the vehicle make and model."
            );

            document
                .getElementById("vehicleModel")
                .focus();

            return;

        }



        // =========================================
        // BUILD BOOKING
        // =========================================

        const booking = {

            customer_name:
                customerName,

            mobile:
                mobile,

            pickups: [],

            destinations: [],

            date:
                date,

            time:
                time,

            vehicle:
                vehicle,

            remarks:
                document
                    .querySelector("textarea")
                    .value
                    .trim()

        };



        // =========================================
        // SAVE PICKUPS
        // =========================================

        pickupInputs.forEach(
            input => {

                booking.pickups.push(
                    input.value.trim()
                );

            }
        );



        // =========================================
        // SAVE DESTINATIONS
        // =========================================

        destinationInputs.forEach(
            input => {

                booking.destinations.push(
                    input.value.trim()
                );

            }
        );



        // =========================================
        // DEBUG
        // =========================================

        console.log(
            "FINAL BOOKING:",
            booking
        );


        console.log(
            "Pickup count:",
            booking.pickups.length
        );


        console.log(
            "Destination count:",
            booking.destinations.length
        );



        // =========================================
        // SAVE BOOKING
        // =========================================

        localStorage.setItem(
            "booking",
            JSON.stringify(booking)
        );



        // =========================================
        // GO TO REVIEW
        // =========================================

        window.location.href =
            "booking.html";


    } catch (error) {

        console.error(
            "BOOKING ERROR:",
            error
        );


        alert(
            "ERROR:\n\n" +
            error.message
        );

    }

}



// =========================================
// PAGE LOAD
// =========================================

document.addEventListener(
    "DOMContentLoaded",
    restoreBooking
);