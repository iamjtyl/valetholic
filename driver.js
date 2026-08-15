// =====================================
// VALETHOLIC DRIVER APPLICATION
// =====================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const driverForm =
            document.getElementById(
                "driverForm"
            );


        // =================================
        // SAFETY CHECK
        // =================================

        if (!driverForm) {

            console.warn(
                "Driver application form not found."
            );

            return;

        }


        // =================================
        // FORM SUBMISSION
        // =================================

        driverForm.addEventListener(
            "submit",
            submitDriverApplication
        );

    }
);


// =====================================
// SUBMIT DRIVER APPLICATION
// =====================================

async function submitDriverApplication(
    event
) {

    event.preventDefault();


    // =================================
    // FORM ELEMENTS
    // =================================

    const nameInput =
        document.getElementById(
            "name"
        );

    const mobileInput =
        document.getElementById(
            "mobile"
        );

    const dateOfBirthInput =
        document.getElementById(
            "date_of_birth"
        );

    const drivingExperienceInput =
        document.getElementById(
            "driving_experience"
        );

    const availabilityInput =
        document.getElementById(
            "availability"
        );


    // =================================
    // SAFETY CHECK
    // =================================

    if (
        !nameInput ||
        !mobileInput ||
        !dateOfBirthInput ||
        !drivingExperienceInput ||
        !availabilityInput
    ) {

        console.error(
            "❌ One or more driver application fields are missing."
        );

        alert(
            "Unable to submit the application. " +
            "Please refresh the page and try again."
        );

        return;

    }


    // =================================
    // GET VALUES
    // =================================

    const name =
        nameInput.value.trim();

    const mobile =
        mobileInput.value.trim();

    const date_of_birth =
        dateOfBirthInput.value;

    const driving_experience =
        drivingExperienceInput.value.trim();

    const availability =
        availabilityInput.value.trim();


    // =================================
    // BASIC VALIDATION
    // =================================

    if (
        !name ||
        !mobile ||
        !date_of_birth ||
        !driving_experience ||
        !availability
    ) {

        alert(
            "Please complete all fields before submitting."
        );

        return;

    }


    // =================================
    // SUBMIT BUTTON
    // =================================

    const submitButton =
        driverForm.querySelector(
            'button[type="submit"]'
        );


    if (submitButton) {

        submitButton.disabled =
            true;

        submitButton.dataset.originalText =
            submitButton.textContent;

        submitButton.textContent =
            "SUBMITTING...";

    }


    try {

        // =================================
        // INSERT DRIVER APPLICATION
        // =================================

        const {
            error
        } =
            await window.supabaseClient
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


        // =================================
        // DATABASE ERROR
        // =================================

        if (error) {

            console.error(
                "❌ Driver application error:",
                error
            );

            alert(
                "Application failed. Please try again."
            );

            return;

        }


        // =================================
        // SUCCESS
        // =================================

        alert(
            "🎉 Driver application submitted successfully!"
        );


        driverForm.reset();

    }

    catch (error) {

        console.error(
            "❌ Unexpected driver application error:",
            error
        );

        alert(
            "Something went wrong. Please try again."
        );

    }

    finally {

        // =================================
        // RESTORE BUTTON
        // =================================

        if (submitButton) {

            submitButton.disabled =
                false;

            submitButton.textContent =
                submitButton.dataset.originalText ||
                "SUBMIT";

        }

    }

}