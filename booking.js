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

function submitBooking(){

    // Later we'll save to database here

    window.location.href = "success.html";

}