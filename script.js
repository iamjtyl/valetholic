let journeyCount = 1;

function addJourney() {

    journeyCount++;

    const container = document.getElementById("journeyContainer");

    const block = document.createElement("div");

    block.className = "journey-block";

    block.innerHTML = `

        <h3>Journey ${journeyCount}</h3>

        <label>Pickup Location</label>
        <input type="text" placeholder="Enter pickup location">

        <label>Destination</label>
        <input type="text" placeholder="Enter destination">

    `;

    container.appendChild(block);

}