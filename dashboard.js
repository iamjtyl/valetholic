let currentDriver = null;
let status = "OFF DUTY";

const statusIcon = document.getElementById("statusIcon");
const statusTitle = document.getElementById("statusTitle");
const statusMessage = document.getElementById("statusMessage");
const dutyBtn = document.getElementById("dutyBtn");
const jobCard = document.getElementById("jobCard");

loadDriver();

async function loadDriver() {

    const { data: { user }, error } =
        await window.supabaseClient.auth.getUser();

    if (!user) {

        window.location.href = "driver-portal.html";
        return;

    }

    currentDriver = user;

    console.log("Logged in user:", user);
    console.log("Logged in user.id:", user.id);
    console.log("Looking for auth_id:", user.id);

   const { data: driver, error: driverError } =
    await window.supabaseClient
    .from("Drivers")
    .select("*")
    .eq("auth_id", user.id)
    .single();

    console.log("Driver query result:", driver);
    console.log("Driver query error:", driverError);

    if (driverError) {

    console.error(driverError);

    alert(JSON.stringify(driverError, null, 2));

    return;

}

    status = driver.status || "OFF DUTY";

    updateDashboard();
}


dutyBtn.addEventListener("click", async () => {

    if (status === "OFF DUTY") {

        status = "ON DUTY";

    } else {

        status = "OFF DUTY";

    }

   const { data, error } =
    await window.supabaseClient
    .from("Drivers")
    .update({
        status: status
    })
    .eq("auth_id", currentDriver.id)
    .select();

    console.log("UPDATE RESULT:", data);
    console.log("UPDATE ERROR:", error);

    if (error) {

        alert(error.message);
        console.error(error);
        return;

    }

    await loadDriver();

});

function updateDashboard() {

    if (status === "OFF DUTY") {

        statusIcon.innerHTML = "⚪";

        statusTitle.innerHTML = "SPENDING";

        statusMessage.innerHTML =
            "Stop spending and start working!";

        dutyBtn.innerHTML = "GO ON DUTY";

        jobCard.style.display = "none";

    }

    if (status === "ON DUTY") {

        statusIcon.innerHTML = "🟢";

        statusTitle.innerHTML = "SLAVING";

        statusMessage.innerHTML =
            "Money Money Money!";

        dutyBtn.innerHTML = "GO OFF DUTY";

        jobCard.style.display = "none";

    }

    if (status === "ON JOB") {

        statusIcon.innerHTML = "🟡";

        statusTitle.innerHTML = "CHASING MONEY";

        statusMessage.innerHTML =
            "Dispatcher has assigned you a job.";

        dutyBtn.style.display = "none";

        jobCard.style.display = "block";

    } else {

        dutyBtn.style.display = "block";

    }

}
const pickup = "Marina Bay Sands Singapore";

const destination = "Changi Airport Singapore";

document.getElementById("pickupGoogle").addEventListener("click", () => {

    window.open(
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pickup)}`,
        "_blank"
    );

});

document.getElementById("destinationGoogle").addEventListener("click", () => {

    window.open(
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destination)}`,
        "_blank"
    );

});

document.getElementById("pickupWaze").addEventListener("click", () => {

    window.open(
        `https://waze.com/ul?q=${encodeURIComponent(pickup)}&navigate=yes`,
        "_blank"
    );

});

document.getElementById("destinationWaze").addEventListener("click", () => {

    window.open(
        `https://waze.com/ul?q=${encodeURIComponent(destination)}&navigate=yes`,
        "_blank"
    );

});
// =====================================
// DRIVER JOB STATUS
// =====================================

const statusBtn = document.getElementById("statusBtn");

if (statusBtn) {

    statusBtn.addEventListener("click", updateJobStatus);

}

async function updateJobStatus() {

    if (!currentBooking) {

        alert("No active booking.");

        return;

    }

    let nextStatus = "";
    let nextButton = "";

    switch (currentBooking.status) {

        case "ON JOB":

            nextStatus = "ON THE WAY";
            nextButton = "VEHICLE PICKED UP";

            break;

        case "ON THE WAY":

            nextStatus = "PICKED UP";
            nextButton = "COMPLETE JOB";

            break;

        case "PICKED UP":

            nextStatus = "COMPLETED";

            break;

        default:

            return;

    }

    const { error } =
        await window.supabaseClient
        .from("Bookings")
        .update({

            status: nextStatus

        })
        .eq("id", currentBooking.id);

    if (error) {

        alert(error.message);

        return;

    }

    currentBooking.status = nextStatus;

    if (nextStatus === "COMPLETED") {

        await window.supabaseClient
            .from("Drivers")
            .update({

                status: "ON DUTY"

            })
            .eq("auth_id", currentDriver.id);

        alert("🎉 Job Completed!");

        location.reload();

        return;

    }

    statusBtn.innerHTML = nextButton;

}