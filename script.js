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
async function continueBooking() {

    const booking = {

        customer_name: document.getElementById("customerName").value,

        mobile: document.getElementById("mobileNumber").value,

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

   const { data, error } = await window.supabaseClient
    .from("Bookings")
    .insert([
        {
            ...
        }
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

    if (error) {
        console.error(error);
        alert("Booking failed. Please try again.");
        return;
    }

    localStorage.setItem("booking", JSON.stringify(booking));
    localStorage.setItem("bookingData", JSON.stringify(data[0]));

    window.location.href = "booking.html";
}