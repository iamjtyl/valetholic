console.log("OPS JS Loaded");

loadDashboard();

async function loadDashboard() {

    await loadDrivers();

    await loadBookings();

}

// ==========================
// DRIVERS
// ==========================

async function loadDrivers() {

    const { data, error } = await window.supabaseClient
        .from("Drivers")
        .select("*");

    if (error) {

        alert(error.message);
        return;

    }

    document.getElementById("dutyCount").textContent =
        data.filter(driver => driver.status === "ON DUTY").length;

    const driverList = document.getElementById("driverList");

    driverList.innerHTML = "";

    data.forEach(driver => {

        driverList.innerHTML += `
            <div class="driver-card">

                <div>${driver.name}</div>

                <div class="
    driver-status
    ${
        driver.status === "ON DUTY"
        ? "on-duty"
        : driver.status === "ON JOB"
        ? "on-job"
        : "off-duty"
    }">

    ${driver.status}

</div>

            </div>
        `;

    });

}

// ==========================
// BOOKINGS
// ==========================

async function loadBookings() {

    const { data, error } = await window.supabaseClient
        .from("Bookings")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {

        alert(error.message);
        return;

    }

    document.getElementById("pendingCount").textContent =
        data.filter(b => b.status === "Pending").length;

    document.getElementById("activeCount").textContent =
        data.filter(b => b.status === "ON JOB").length;

    const today = new Date().toISOString().split("T")[0];

    document.getElementById("completeCount").textContent =
        data.filter(b =>
            b.status === "Completed" &&
            b.booking_date === today
        ).length;

    const dispatchList = document.getElementById("dispatchList");

    dispatchList.innerHTML = "";

    data
        .filter(b => b.status === "Pending")
        .forEach(b => {

dispatchList.innerHTML += `

<div class="dispatch-card">

    <div class="dispatch-top">

        <div class="dispatch-ref">

            VH-${b.reference_no}

        </div>

        <div class="dispatch-status">

            ${b.status}

        </div>

    </div>

    <div class="dispatch-name">

        👤 ${b.customer_name}

    </div>

    <div class="dispatch-route">

        📍 ${JSON.parse(b.pickups)[0]}

        <br>

        ↓

        <br>

        📍 ${JSON.parse(b.destinations)[0]}

    </div>

    <div class="dispatch-bottom">

        <div class="dispatch-time">

            🕒 ${b.booking_date} • ${b.booking_time}

        </div>

        <button
            class="open-btn"
            onclick="location.href='ops-booking.html?id=${b.id}'">

            OPEN

        </button>

    </div>

</div>

`;

        });

}