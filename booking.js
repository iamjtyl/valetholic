const booking = JSON.parse(localStorage.getItem("booking"));

const summary = document.getElementById("summary");

summary.innerHTML = `

<div class="summary-card booking-card">

    <h2>Journey</h2>

    <div class="summary-item">
        <span class="label">📍 Pickup</span>
        <span class="value">${booking.pickups.join("<br>")}</span>
    </div>

    <div class="summary-item">
        <span class="label">📍 Destination</span>
        <span class="value">${booking.destinations.join("<br>")}</span>
    </div>

    <div class="summary-item">
        <span class="label">📅 Date</span>
        <span class="value">${booking.date}</span>
    </div>

    <div class="summary-item">
        <span class="label">🕒 Time</span>
        <span class="value">${booking.time}</span>
    </div>

    <div class="summary-item">
        <span class="label">🚘 Vehicle</span>
        <span class="value">${booking.vehicle}</span>
    </div>

    <div class="summary-item">
        <span class="label">📝 Remarks</span>
        <span class="value">${booking.remarks || "None"}</span>
    </div>

</div>

<div class="summary-card fare-card">

    <h2>Fare Estimate</h2>

    <div class="summary-item">
        <span class="label">Base Fare</span>
        <span class="value">$48</span>
    </div>

    <div class="summary-item">
        <span class="label">Additional Stops</span>
        <span class="value">$0</span>
    </div>

    <div class="summary-item">
        <span class="label">Late Night</span>
        <span class="value">$0</span>
    </div>

    <div class="summary-item">
        <span class="label"><strong>Total</strong></span>
        <span class="value"><strong>$48</strong></span>
    </div>

</div>

<div class="buttons">

    <button onclick="history.back()">

        ← Edit Booking

    </button>

    <button
        class="gold"
        onclick="submitBooking()">

        Submit Booking Request

    </button>

</div>
`;

async function submitBooking(){

     alert("SubmitBooking is running!");
     
    const booking = JSON.parse(localStorage.getItem("booking"));

    const { data, error } = await window.supabaseClient
        .from("Bookings")
        .insert([
            {
                customer_name: booking.customer_name,
                mobile: booking.mobile,
                pickups: booking.pickups,
                destinations: booking.destinations,
                booking_date: booking.date,
                booking_time: booking.time,
                remarks: booking.remarks
            }
        ])
        .select();

    if(error){

        console.error(error);

        alert("Booking failed.");

        return;

    }

    localStorage.setItem("bookingData",JSON.stringify(data[0]));

    window.location.href="success.html";

}