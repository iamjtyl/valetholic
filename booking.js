const booking = JSON.parse(localStorage.getItem("booking"));

const summary = document.getElementById("summary");

summary.innerHTML = `

<h2>Pickup Locations</h2>

${booking.pickups.map(x => `<p>📍 ${x}</p>`).join("")}

<h2>Destinations</h2>

${booking.destinations.map(x => `<p>📍 ${x}</p>`).join("")}

<h2>Date</h2>

<p>${booking.date}</p>

<h2>Time</h2>

<p>${booking.time}</p>

<h2>Vehicle</h2>

<p>${booking.vehicle}</p>

<h2>Remarks</h2>

<p>${booking.remarks || "None"}</p>

`;