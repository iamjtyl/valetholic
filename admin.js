if(sessionStorage.getItem("adminLoggedIn")!=="true"){

    window.location.href="login.html";

}
let currentBookingId = null;
async function loadDashboard() {

    // Load bookings
    const { data: bookings, error } = await window.supabaseClient
        .from("Bookings")
        .select("*")
        .order("created_at", { ascending: false });

        const keyword = document
    .getElementById("searchBooking")
    ?.value
    .toLowerCase() || "";

    const statusFilter = document
    .getElementById("statusFilter")
    ?.value || "All";

    if (error) {
        console.error(error);
        alert(error.message);
        return;
    }

    // Dashboard
    document.getElementById("totalBookings").textContent = bookings.length;

    document.getElementById("pendingBookings").textContent =
        bookings.filter(b => b.status === "Pending").length;

    document.getElementById("completedBookings").textContent =
        bookings.filter(b => b.status === "Completed").length;

   // Today's Bookings

const today = new Date().toISOString().split("T")[0];

document.getElementById("todayBookings").textContent =
    bookings.filter(b =>

        b.created_at &&
        b.created_at.startsWith(today)

    ).length;

    // Booking table
    const table = document.getElementById("bookingTable");
    table.innerHTML = "";

bookings
.filter(b => {

    const matchSearch =

        (b.customer_name || "")
            .toLowerCase()
            .includes(keyword)

        ||

        (b.mobile || "")
            .toLowerCase()
            .includes(keyword)

        ||

        ("VH-" + (b.reference_no || ""))
            .toLowerCase()
            .includes(keyword);

    const matchStatus =

        statusFilter === "All"

        ||

        b.status === statusFilter;

    return matchSearch && matchStatus;

})
.forEach(b => {

        let pickup =
            Array.isArray(b.pickups)
                ? b.pickups.join("<br>")
                : JSON.parse(b.pickups)[0];

        let destination =
            Array.isArray(b.destinations)
                ? b.destinations.join("<br>")
                : JSON.parse(b.destinations)[0];

        table.innerHTML += `
        <tr>

            <td>VH-${b.reference_no || "----"}</td>

            <td>${b.customer_name}</td>

            <td>${b.mobile}</td>

            <td>${pickup}</td>

            <td>${destination}</td>

            <td>${b.booking_date}</td>

            <td>${b.status}</td>

           <td>

    <button
        class="view-btn"
        onclick="openBooking('${b.id}')">

        Checked ✓

    </button>

</td>

        </tr>
        `;

    });

}

loadDashboard();


// =====================================
// OPEN BOOKING
// =====================================

async function openBooking(id){
    currentBookingId = id;

    const { data, error } = await window.supabaseClient
        .from("Bookings")
        .select("*")
        .eq("id", id)
        .single();

    if(error){

    console.error(error);

    alert(error.message);

    return;

}

alert("Booking marked as Completed!");

    document.getElementById("modalBody").innerHTML = `

        <p><strong>Reference:</strong> VH-${data.reference_no}</p>

        <p><strong>Customer:</strong> ${data.customer_name}</p>

        <p><strong>Mobile:</strong> ${data.mobile}</p>

        <p><strong>Pickup:</strong><br>${JSON.parse(data.pickups).join("<br>")}</p>

        <p><strong>Destination:</strong><br>${JSON.parse(data.destinations).join("<br>")}</p>

        <p><strong>Date:</strong> ${data.booking_date}</p>

        <p><strong>Status:</strong> ${data.status}</p>

        <p><strong>Remarks:</strong> ${data.remarks || "-"}</p>
    <div class="modal-buttons">

    <button
        class="complete-btn"
        onclick="markCompleted()">

        ✓ Mark Completed

    </button>

</div>
    `;

    document.getElementById("bookingModal").style.display = "flex";

}


// =====================================
// CLOSE MODAL
// =====================================

document.querySelector(".close-modal").onclick = function(){

    document.getElementById("bookingModal").style.display = "none";

}

window.onclick = function(e){

    const modal = document.getElementById("bookingModal");

    if(e.target === modal){

        modal.style.display = "none";

    }

}
async function markCompleted(){

     console.log("markCompleted clicked");
    console.log(currentBookingId);

if(!currentBookingId){

    alert("No booking ID!");

    return;

}

    const confirmComplete = confirm(
        "Mark this booking as Completed?"
    );

    if(!confirmComplete) return;

    const { error } = await window.supabaseClient
        .from("Bookings")
        .update({
            status: "Completed"
        })
        .eq("reference_no", "2027");
   if(error){

    console.error(error);

    alert(error.message);

    return;

}

    document.getElementById("bookingModal").style.display = "none";

    await loadDashboard();

}
function logout(){

    sessionStorage.removeItem("adminLoggedIn");

    window.location.href = "login.html";

}
