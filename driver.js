document.getElementById("driverForm").addEventListener("submit", async function (e) {

    e.preventDefault();

    const name = document.getElementById("name").value;
    const mobile = document.getElementById("mobile").value;
    const date_of_birth = document.getElementById("date_of_birth").value;
    const driving_experience = document.getElementById("driving_experience").value;
    const availability = document.getElementById("availability").value;

    const { error } = await supabaseClient
        .from("Drivers")
        .insert([
            {
                name,
                mobile,
                date_of_birth,
                driving_experience,
                availability
            }
        ]);

    if (error) {
        console.error(error);
        alert("Application failed. Please try again.");
        return;
    }

    alert("🎉 Driver application submitted successfully!");

    document.getElementById("driverForm").reset();

});