// =====================================
// VALETHOLIC OPS BOOKING
// =====================================

let currentBooking = null;
let drivers = [];


// =====================================
// GET BOOKING ID
// =====================================

const params =
    new URLSearchParams(
        window.location.search
    );

const bookingId =
    params.get("id");


// =====================================
// START
// =====================================

loadBooking();


// =====================================
// LOAD BOOKING
// =====================================

async function loadBooking() {

    if (!bookingId) {

        showError(
            "No booking ID was provided."
        );

        return;

    }


    // =================================
    // BOOKING
    // =================================

    const {
        data: booking,
        error: bookingError
    } =
        await window.supabaseClient
        .from("Bookings")
        .select("*")
        .eq(
            "id",
            bookingId
        )
        .single();


    if (bookingError) {

        console.error(
            "Booking error:",
            bookingError
        );

        showError(
            bookingError.message
        );

        return;

    }


    currentBooking =
        booking;


    // =================================
    // DRIVERS
    // =================================

    const {
        data: driverData,
        error: driverError
    } =
        await window.supabaseClient
        .from("Drivers")
        .select(
            "id, auth_id, name, status, approved, approval_status"
        )
        .order(
            "name",
            {
                ascending: true
            }
        );


    if (driverError) {

        console.error(
            "Driver loading error:",
            driverError
        );

        showError(
            driverError.message
        );

        return;

    }


    drivers =
        driverData || [];


    displayBooking();

    populateDrivers();

}



// =====================================
// DISPLAY BOOKING
// =====================================

function displayBooking() {

    const booking =
        currentBooking;


    document.getElementById(
        "bookingReference"
    ).textContent =
        `#${booking.reference_no || "----"}`;


    document.getElementById(
        "customerName"
    ).textContent =
        booking.customer_name || "-";


    document.getElementById(
        "customerMobile"
    ).textContent =
        booking.mobile || "-";


    document.getElementById(
        "bookingDate"
    ).textContent =
        booking.booking_date || "-";


    document.getElementById(
        "bookingTime"
    ).textContent =
        booking.booking_time || "-";



    // =================================
    // PICKUP
    // =================================

    document.getElementById(
        "pickup"
    ).innerHTML =
        formatLocations(
            booking.pickups
        );



    // =================================
    // DESTINATION
    // =================================

    document.getElementById(
        "destination"
    ).innerHTML =
        formatLocations(
            booking.destinations
        );



    // =================================
    // VEHICLE
    // =================================

    document.getElementById(
        "vehicleModel"
    ).textContent =
        booking.vehicle_model || "-";


    document.getElementById(
        "vehiclePlate"
    ).textContent =
        booking.vehicle_plate || "-";



    // =================================
    // STATUS
    // =================================

    const statusSelect =
        document.getElementById(
            "statusSelect"
        );


    const existingStatus =
        booking.status || "Pending";


    const statusOption =
        Array.from(
            statusSelect.options
        ).find(
            option =>
                option.value ===
                existingStatus
        );


    if (statusOption) {

        statusSelect.value =
            existingStatus;

    }



    // =================================
    // REMARKS
    // =================================

    document.getElementById(
        "remarks"
    ).value =
        booking.remarks || "";

}



// =====================================
// FORMAT LOCATIONS
// =====================================

function formatLocations(
    value
) {

    if (!value) {

        return "-";

    }


    if (
        Array.isArray(value)
    ) {

        return value
            .filter(Boolean)
            .join("<br>");

    }


    try {

        const parsed =
            JSON.parse(value);


        if (
            Array.isArray(parsed)
        ) {

            return parsed
                .filter(Boolean)
                .join("<br>");

        }


        return parsed;

    }

    catch {

        return value;

    }

}



// =====================================
// LOAD DRIVER DROPDOWN
// =====================================

function populateDrivers() {

    const select =
        document.getElementById(
            "driverSelect"
        );


    select.innerHTML = "";


    // -----------------------------
    // UNASSIGN OPTION
    // -----------------------------

    const unassigned =
        document.createElement(
            "option"
        );


    unassigned.value =
        "";


    unassigned.textContent =
        "Unassigned";


    select.appendChild(
        unassigned
    );



    // -----------------------------
    // APPROVED DRIVERS
    // -----------------------------

    drivers
        .filter(
            driver =>
                driver.approved === true
                ||
                driver.approval_status ===
                    "APPROVED"
        )
        .forEach(
            driver => {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    driver.auth_id;


                option.textContent =
                    `${driver.name || "Unnamed"}${
                        driver.status
                            ? ` • ${driver.status}`
                            : ""
                    }`;


                select.appendChild(
                    option
                );

            }
        );



    // =================================
    // CURRENT DRIVER
    // =================================

    if (
        currentBooking &&
        currentBooking.driver_id
    ) {

        select.value =
            currentBooking.driver_id;

    }


    updateAssignButton();

}



// =====================================
// UPDATE BUTTON TEXT
// =====================================

function updateAssignButton() {

    const select =
        document.getElementById(
            "driverSelect"
        );


    const button =
        document.getElementById(
            "assignBtn"
        );


    if (
        currentBooking &&
        currentBooking.driver_id
    ) {

        button.textContent =
            select.value ===
            currentBooking.driver_id
                ? "REASSIGN DRIVER"
                : "CHANGE DRIVER";

    }

    else {

        button.textContent =
            "ASSIGN DRIVER";

    }

}



// =====================================
// DRIVER DROPDOWN CHANGE
// =====================================

document
    .getElementById(
        "driverSelect"
    )
    .addEventListener(
        "change",
        updateAssignButton
    );



// =====================================
// ASSIGN / REASSIGN DRIVER
// =====================================

document
    .getElementById(
        "assignBtn"
    )
    .addEventListener(
        "click",
        assignDriver
    );


async function assignDriver() {

    if (!currentBooking) {

        return;

    }


    const selectedDriver =
        document.getElementById(
            "driverSelect"
        ).value;


    const message =
        document.getElementById(
            "driverMessage"
        );


    // =================================
    // REMOVE DRIVER
    // =================================

    if (!selectedDriver) {

        const confirmed =
            confirm(
                "Remove the driver from this booking?"
            );


        if (!confirmed) {

            return;

        }


        const {
            error
        } =
            await window.supabaseClient
            .from("Bookings")
            .update({

                driver_id:
                    null

            })
            .eq(
                "id",
                currentBooking.id
            );


        if (error) {

            console.error(
                error
            );

            message.textContent =
                error.message;

            return;

        }


        currentBooking.driver_id =
            null;


        message.textContent =
            "Driver removed.";


        updateAssignButton();

        return;

    }



    // =================================
    // REASSIGN CONFIRMATION
    // =================================

    const oldDriver =
        currentBooking.driver_id;


    if (
        oldDriver &&
        oldDriver !== selectedDriver
    ) {

        const oldDriverRecord =
            drivers.find(
                driver =>
                    driver.auth_id ===
                    oldDriver
            );


        const newDriverRecord =
            drivers.find(
                driver =>
                    driver.auth_id ===
                    selectedDriver
            );


        const oldName =
            oldDriverRecord?.name ||
            "Current driver";


        const newName =
            newDriverRecord?.name ||
            "New driver";


        const confirmed =
            confirm(
                `Reassign this booking from ${oldName} to ${newName}?`
            );


        if (!confirmed) {

            return;

        }

    }



    // =================================
    // SAVE DRIVER
    // =================================

    const {
        error
    } =
        await window.supabaseClient
        .from("Bookings")
        .update({

            driver_id:
                selectedDriver

        })
        .eq(
            "id",
            currentBooking.id
        );


    if (error) {

        console.error(
            "Driver assignment error:",
            error
        );

        message.textContent =
            error.message;

        return;

    }


    currentBooking.driver_id =
        selectedDriver;


    const driver =
        drivers.find(
            item =>
                item.auth_id ===
                selectedDriver
        );


    message.textContent =
        driver
            ? `${driver.name} assigned successfully.`
            : "Driver assigned successfully.";


    updateAssignButton();

}



// =====================================
// SAVE CHANGES
// =====================================

document
    .getElementById(
        "saveBtn"
    )
    .addEventListener(
        "click",
        saveChanges
    );


async function saveChanges() {

    if (!currentBooking) {

        return;

    }


    const status =
        document.getElementById(
            "statusSelect"
        ).value;


    const remarks =
        document.getElementById(
            "remarks"
        ).value;


    const message =
        document.getElementById(
            "saveMessage"
        );


    const {
        error
    } =
        await window.supabaseClient
        .from("Bookings")
        .update({

            status:
                status,

            remarks:
                remarks

        })
        .eq(
            "id",
            currentBooking.id
        );


    if (error) {

        console.error(
            "Save booking error:",
            error
        );

        message.textContent =
            error.message;

        return;

    }


    currentBooking.status =
        status;


    currentBooking.remarks =
        remarks;


    message.textContent =
        "Changes saved successfully. ✓";

}



// =====================================
// ERROR
// =====================================

function showError(
    message
) {

    const container =
        document.querySelector(
            ".ops-container"
        );


    if (!container) {

        return;

    }


    const errorBox =
        document.createElement(
            "div"
        );


    errorBox.style.cssText = `
        margin-top:20px;
        padding:15px;
        border-radius:10px;
        background:#3a1d1d;
        color:#ff8b8b;
    `;


    errorBox.textContent =
        message;


    container.appendChild(
        errorBox
    );

}