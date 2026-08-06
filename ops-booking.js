// =========================================
// VALETHOLIC OPS BOOKING
// =========================================

let currentBooking = null;

const bookingId = new URLSearchParams(window.location.search).get("id");

console.log("Booking ID:", bookingId);

init();

async function init() {

    await loadBooking();

    await loadDrivers();

}

// =========================================
// LOAD BOOKING
// =========================================

async function loadBooking() {

    if (!bookingId) {

        alert("No booking selected.");

        window.location.href = "ops-dashboard.html";

        return;

    }

    const { data, error } =
        await window.supabaseClient
        .from("Bookings")
        .select("*")
        .eq("id", bookingId)
        .single();

    if (error) {

        console.error(error);

        alert(error.message);

        return;

    }

    currentBooking = data;

    console.log(currentBooking);

    // HEADER

    document.getElementById("bookingReference").textContent =
        `VH-${data.reference_no}`;

    document.getElementById("bookingStatus").textContent =
        data.status;

    // CUSTOMER

    document.getElementById("customerName").textContent =
        data.customer_name;

    document.getElementById("customerMobile").textContent =
        data.mobile;

    // JOURNEY

    document.getElementById("pickup").textContent =
        JSON.parse(data.pickups).join(", ");

    document.getElementById("destination").textContent =
        JSON.parse(data.destinations).join(", ");

    document.getElementById("bookingTime").textContent =
        `${data.booking_date} • ${data.booking_time}`;

    // VEHICLE

    document.getElementById("vehicleModel").textContent =
        data.vehicle_model || "-";

    document.getElementById("vehiclePlate").textContent =
        data.vehicle_plate || "-";

}

// =========================================
// LOAD DRIVERS
// =========================================

async function loadDrivers() {

    const { data, error } =
        await window.supabaseClient
        .from("Drivers")
        .select("*")
        .eq("status", "ON DUTY")
        .order("name");

    if (error) {

        console.error(error);

        return;

    }

    const select =
        document.getElementById("driverSelect");

    select.innerHTML =
        `<option value="">Select Driver</option>`;

    data.forEach(driver => {

        select.innerHTML += `

            <option value="${driver.auth_id}">

                ${driver.name}

            </option>

        `;

    });

}

// =========================================
// ASSIGN DRIVER
// =========================================

document
.getElementById("assignBtn")
.addEventListener("click", assignDriver);

async function assignDriver() {

    const driverId =
        document.getElementById("driverSelect").value;

    if (!driverId) {

        alert("Please select a driver.");

        return;

    }

    // Update booking

    const { error: bookingError } =
        await window.supabaseClient
        .from("Bookings")
        .update({

            driver_id: driverId,

            status: "ON JOB"

        })
        .eq("id", bookingId);

    if (bookingError) {

        alert(bookingError.message);

        return;

    }

    // Update driver

    const { error: driverError } =
        await window.supabaseClient
        .from("Drivers")
        .update({

            status: "ON JOB"

        })
        .eq("auth_id", driverId);

    if (driverError) {

        alert(driverError.message);

        return;

    }

    alert("🚗 Driver Assigned Successfully!");

    console.log("Redirecting...");

    window.location.href = "ops-dashboard.html";

}