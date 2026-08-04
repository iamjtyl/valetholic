console.log("I AM EDITING THE CORRECT SCRIPT");
function addPickup(){

    const input=document.createElement("input");

    input.type="text";

    input.placeholder="Enter another pickup";

    document
        .getElementById("pickupContainer")
        .appendChild(input);

}

function addDestination(){

    const input = document.createElement("input");

    input.type = "text";

    input.placeholder = "Enter another destination";

    document
        .getElementById("destinationContainer")
        .appendChild(input);

}
async function continueBooking() {

    try {

        const booking = {
            customer_name: document.getElementById("customerName")?.value,
            mobile: document.getElementById("mobileNumber")?.value,
            pickups: [],
            destinations: [],
            date: document.getElementById("bookingDate")?.value,
            time: document.getElementById("bookingTime")?.value,
            vehicle: document.querySelector("input[placeholder='e.g. Toyota Alphard']")?.value,
            remarks: document.querySelector("textarea")?.value
        };

        document.querySelectorAll("#pickupContainer input").forEach(input => {
            booking.pickups.push(input.value);
        });

        document.querySelectorAll("#destinationContainer input").forEach(input => {
            booking.destinations.push(input.value);
        });

        console.log("Booking:", booking);

        localStorage.setItem("booking", JSON.stringify(booking));

        window.location.href = "booking.html";

    } catch (e) {
        console.error(e);
        alert(e.stack);
    }
}