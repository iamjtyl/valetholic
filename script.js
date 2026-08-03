function addPickup(){

    const input=document.createElement("input");

    input.type="text";

    input.placeholder="Enter another pickup";

    document
        .getElementById("pickupContainer")
        .appendChild(input);

}

function addDestination(){

    const input=document.createElement("input");

    input.type="text";

    input.placeholder="Enter another destination";

    document
        .getElementById("destinationContainer")
        .appendChild(input);

}
function continueBooking() {

    const booking = {

        pickups: [],

        destinations: [],

        date: document.querySelector("input[type='date']").value,

        time: document.getElementById("bookingTime").value,

        vehicle: document.querySelector("input[placeholder='e.g. Toyota Alphard']").value,

        remarks: document.querySelector("textarea").value

    };

    document.querySelectorAll("#pickupContainer input").forEach(input => {

        booking.pickups.push(input.value);

    });

    document.querySelectorAll("#destinationContainer input").forEach(input => {

        booking.destinations.push(input.value);

    });

    localStorage.setItem("booking", JSON.stringify(booking));

    window.location.href = "booking.html";

}