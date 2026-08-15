// =====================================
// VALETHOLIC OPS BOOKING
// =====================================


// =====================================
// STATE
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

    // =================================
    // CHECK BOOKING ID
    // =================================

    if (!bookingId) {

        showError(
            "No booking ID was provided."
        );

        return;

    }


    try {

        // =================================
        // LOAD BOOKING
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


        // =================================
        // BOOKING ERROR
        // =================================

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
        // LOAD DRIVERS
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


        // =================================
        // DRIVER ERROR
        // =================================

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


        // =================================
        // DISPLAY
        // =================================

        displayBooking();

        populateDrivers();

    }

    catch (error) {

        console.error(
            "Unexpected booking loading error:",
            error
        );

        showError(
            "Unable to load booking."
        );

    }

}



// =====================================
// DISPLAY BOOKING
// =====================================

function displayBooking() {

    const booking =
        currentBooking;


    if (!booking) {

        return;

    }


    // =================================
    // REFERENCE
    // =================================

    setText(
        "bookingReference",
        `#${booking.reference_no || "----"}`
    );


    // =================================
    // CUSTOMER
    // =================================

    setText(
        "customerName",
        booking.customer_name || "-"
    );


    setText(
        "customerMobile",
        booking.mobile || "-"
    );


    // =================================
    // JOURNEY
    // =================================

    setText(
        "bookingDate",
        booking.booking_date || "-"
    );


    setText(
        "bookingTime",
        booking.booking_time || "-"
    );


    // =================================
    // PICKUP
    // =================================

    setHTML(
        "pickup",
        formatLocations(
            booking.pickups
        )
    );


    // =================================
    // DESTINATION
    // =================================

    setHTML(
        "destination",
        formatLocations(
            booking.destinations
        )
    );


    // =================================
    // VEHICLE
    // =================================

    setText(
        "vehicleModel",
        booking.vehicle_model || "-"
    );


    setText(
        "vehiclePlate",
        booking.vehicle_plate || "-"
    );


    // =================================
    // STATUS
    // =================================

    const statusSelect =
        document.getElementById(
            "statusSelect"
        );


    if (statusSelect) {

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

    }


    // =================================
    // REMARKS
    // =================================

    const remarks =
        document.getElementById(
            "remarks"
        );


    if (remarks) {

        remarks.value =
            booking.remarks || "";

    }

}



// =====================================
// SAFE TEXT HELPER
// =====================================

function setText(
    elementId,
    value
) {

    const element =
        document.getElementById(
            elementId
        );


    if (!element) {

        return;

    }


    element.textContent =
        value;

}



// =====================================
// SAFE HTML HELPER
// =====================================

function setHTML(
    elementId,
    value
) {

    const element =
        document.getElementById(
            elementId
        );


    if (!element) {

        return;

    }


    element.innerHTML =
        value;

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


    // =================================
    // ARRAY
    // =================================

    if (
        Array.isArray(value)
    ) {

        return value
            .filter(Boolean)
            .join("<br>");

    }


    // =================================
    // JSON STRING
    // =================================

    if (
        typeof value === "string"
    ) {

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


            return String(parsed);

        }

        catch {

            return value;

        }

    }


    // =================================
    // OTHER VALUE
    // =================================

    return String(value);

}



// =====================================
// LOAD DRIVER DROPDOWN
// =====================================

function populateDrivers() {

    const select =
        document.getElementById(
            "driverSelect"
        );


    if (!select) {

        return;

    }


    select.innerHTML = "";


    // =================================
    // UNASSIGNED
    // =================================

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


    // =================================
    // APPROVED DRIVERS ONLY
    // =================================

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


                const driverName =
                    driver.name ||
                    "Unnamed";


                const driverStatus =
                    driver.status
                        ? ` • ${driver.status}`
                        : "";


                option.textContent =
                    `${driverName}${driverStatus}`;


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
// UPDATE ASSIGN BUTTON
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
        !select ||
        !button
    ) {

        return;

    }


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

const driverSelect =
    document.getElementById(
        "driverSelect"
    );


if (driverSelect) {

    driverSelect.addEventListener(
        "change",
        updateAssignButton
    );

}



// =====================================
// ASSIGN BUTTON
// =====================================

const assignButton =
    document.getElementById(
        "assignBtn"
    );


if (assignButton) {

    assignButton.addEventListener(
        "click",
        assignDriver
    );

}



// =====================================
// ASSIGN / REASSIGN / REMOVE DRIVER
// =====================================

async function assignDriver() {

    if (!currentBooking) {

        return;

    }


    const select =
        document.getElementById(
            "driverSelect"
        );


    const message =
        document.getElementById(
            "driverMessage"
        );


    const button =
        document.getElementById(
            "assignBtn"
        );


    if (!select) {

        return;

    }


    const selectedDriver =
        select.value;


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


        setButtonLoading(
            button,
            true,
            "REMOVING..."
        );


        try {

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
                    "Driver removal error:",
                    error
                );

                setMessage(
                    message,
                    error.message,
                    "error"
                );

                return;

            }


            currentBooking.driver_id =
                null;


            setMessage(
                message,
                "Driver removed.",
                "success"
            );


            updateAssignButton();

        }

        catch (error) {

            console.error(
                "Unexpected driver removal error:",
                error
            );

            setMessage(
                message,
                "Unable to remove driver.",
                "error"
            );

        }

        finally {

            setButtonLoading(
                button,
                false
            );

        }


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
    // FIND DRIVER
    // =================================

    const driver =
        drivers.find(
            item =>
                item.auth_id ===
                selectedDriver
        );


    // =================================
    // GENERATE TRACKING TOKEN
    // =================================

    let trackingToken =
        currentBooking.tracking_token;


    if (!trackingToken) {

        trackingToken =
            crypto.randomUUID();

    }



    // =================================
    // SAVE DRIVER + TRACKING TOKEN
    // =================================

    setButtonLoading(
        button,
        true,
        "ASSIGNING..."
    );


    try {

        const {
            error
        } =
            await window.supabaseClient
                .from("Bookings")
                .update({

                    driver_id:
                        selectedDriver,

                    tracking_token:
                        trackingToken

                })
                .eq(
                    "id",
                    currentBooking.id
                );


        // =================================
        // DATABASE ERROR
        // =================================

        if (error) {

            console.error(
                "Driver assignment error:",
                error
            );

            setMessage(
                message,
                error.message,
                "error"
            );

            return;

        }


        // =================================
        // UPDATE LOCAL STATE
        // =================================

        currentBooking.driver_id =
            selectedDriver;


        currentBooking.tracking_token =
            trackingToken;



        // =================================
        // SUCCESS MESSAGE
        // =================================

        const driverName =
            driver?.name ||
            "Driver";


        setMessage(
            message,
            `${driverName} assigned successfully.`,
            "success"
        );



        // =================================
        // TRACKING LINK
        // =================================

        createTrackingLink(
            message,
            trackingToken,
            driverName
        );


        updateAssignButton();

    }

    catch (error) {

        console.error(
            "Unexpected driver assignment error:",
            error
        );

        setMessage(
            message,
            "Unable to assign driver.",
            "error"
        );

    }

    finally {

        setButtonLoading(
            button,
            false
        );

    }

}



// =====================================
// CREATE TRACKING LINK
// =====================================

function createTrackingLink(
    container,
    trackingToken,
    driverName
) {

    if (!container) {

        return;

    }


    const trackingLink =
        `${window.location.origin}/track.html?token=${encodeURIComponent(
            trackingToken
        )}`;


    // =================================
    // CLEAR OLD CONTENT
    // =================================

    container.innerHTML = "";


    // =================================
    // SUCCESS TEXT
    // =================================

    const successText =
        document.createElement(
            "span"
        );


    successText.textContent =
        `${driverName} assigned successfully.`;


    container.appendChild(
        successText
    );


    // =================================
    // SPACING
    // =================================

    container.appendChild(
        document.createElement(
            "br"
        )
    );


    container.appendChild(
        document.createElement(
            "br"
        )
    );


    // =================================
    // LABEL
    // =================================

    const label =
        document.createElement(
            "strong"
        );


    label.textContent =
        "Customer Tracking Link:";


    container.appendChild(
        label
    );


    container.appendChild(
        document.createElement(
            "br"
        ));


    // =================================
    // LINK INPUT
    // =================================

    const input =
        document.createElement(
            "input"
        );


    input.type =
        "text";


    input.value =
        trackingLink;


    input.readOnly =
        true;


    input.className =
        "tracking-link-input";


    input.addEventListener(
        "click",
        () => {

            input.select();

        }
    );


    container.appendChild(
        input
    );


    container.appendChild(
        document.createElement(
            "br"
        ));


    container.appendChild(
        document.createElement(
            "br"
        ));


    // =================================
    // COPY BUTTON
    // =================================

    const copyButton =
        document.createElement(
            "button"
        );


    copyButton.type =
        "button";


    copyButton.textContent =
        "📍 COPY TRACKING LINK";


    copyButton.className =
        "tracking-copy-btn";


    copyButton.addEventListener(
        "click",
        async () => {

            try {

                await navigator
                    .clipboard
                    .writeText(
                        trackingLink
                    );


                copyButton.textContent =
                    "✓ COPIED";


                setTimeout(
                    () => {

                        copyButton.textContent =
                            "📍 COPY TRACKING LINK";

                    },
                    1500
                );

            }

            catch (error) {

                console.error(
                    "Clipboard error:",
                    error
                );


                input.focus();

                input.select();

            }

        }
    );


    container.appendChild(
        copyButton
    );

}



// =====================================
// SAVE CHANGES
// =====================================

const saveButton =
    document.getElementById(
        "saveBtn"
    );


if (saveButton) {

    saveButton.addEventListener(
        "click",
        saveChanges
    );

}



async function saveChanges() {

    if (!currentBooking) {

        return;

    }


    const statusSelect =
        document.getElementById(
            "statusSelect"
        );


    const remarksInput =
        document.getElementById(
            "remarks"
        );


    const message =
        document.getElementById(
            "saveMessage"
        );


    if (
        !statusSelect ||
        !remarksInput
    ) {

        return;

    }


    const status =
        statusSelect.value;


    const remarks =
        remarksInput.value;


    setButtonLoading(
        saveButton,
        true,
        "SAVING..."
    );


    try {

        // =================================
        // SAVE STATUS + REMARKS
        // =================================

        const {
            error
        } =
            await window.supabaseClient
                .from("Bookings")
                .update({

                    status,

                    remarks

                })
                .eq(
                    "id",
                    currentBooking.id
                );


        // =================================
        // DATABASE ERROR
        // =================================

        if (error) {

            console.error(
                "Save booking error:",
                error
            );

            setMessage(
                message,
                error.message,
                "error"
            );

            return;

        }


        // =================================
        // UPDATE LOCAL STATE
        // =================================

        currentBooking.status =
            status;


        currentBooking.remarks =
            remarks;


        setMessage(
            message,
            "Changes saved successfully. ✓",
            "success"
        );

    }

    catch (error) {

        console.error(
            "Unexpected save error:",
            error
        );

        setMessage(
            message,
            "Unable to save changes.",
            "error"
        );

    }

    finally {

        setButtonLoading(
            saveButton,
            false
        );

    }

}



// =====================================
// BUTTON LOADING STATE
// =====================================

function setButtonLoading(
    button,
    loading,
    loadingText = "LOADING..."
) {

    if (!button) {

        return;

    }


    if (loading) {

        if (
            !button.dataset.originalText
        ) {

            button.dataset.originalText =
                button.textContent;

        }


        button.disabled =
            true;


        button.textContent =
            loadingText;

    }

    else {

        button.disabled =
            false;


        button.textContent =
            button.dataset.originalText ||
            button.textContent;


        delete button.dataset.originalText;

    }

}



// =====================================
// MESSAGE HELPER
// =====================================

function setMessage(
    element,
    message,
    type = "normal"
) {

    if (!element) {

        return;

    }


    element.textContent =
        message;


    element.style.color =
        type === "error"
            ? "#B42318"
            : type === "success"
                ? "#18794E"
                : "#666";

}



// =====================================
// ERROR DISPLAY
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


    // =================================
    // REMOVE EXISTING ERROR
    // =================================

    const existing =
        document.getElementById(
            "opsError"
        );


    if (existing) {

        existing.remove();

    }


    // =================================
    // CREATE ERROR BOX
    // =================================

    const errorBox =
        document.createElement(
            "div"
        );


    errorBox.id =
        "opsError";


    errorBox.textContent =
        message;


    errorBox.style.cssText = `
        margin-top: 20px;
        padding: 15px;
        border-radius: 10px;
        background: #FEE4E2;
        color: #B42318;
        border: 1px solid #FDA29B;
        line-height: 1.5;
    `;


    container.appendChild(
        errorBox
    );

}