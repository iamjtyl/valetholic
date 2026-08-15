// =====================================
// VALETHOLIC HOMEPAGE
// =====================================


// =====================================
// SHOW BOOKING
// =====================================

function showBooking() {

    const hero =
        document.getElementById(
            "hero"
        );


    // =================================
    // SAFETY CHECK
    // =================================

    if (!hero) {

        console.warn(
            "Booking hero section not found."
        );

        return;

    }


    // =================================
    // OPEN BOOKING
    // =================================

    hero.classList.add(
        "booking-open"
    );


    // =================================
    // SCROLL TO BOOKING
    // =================================

    setTimeout(
        () => {

            hero.scrollIntoView({

                behavior:
                    "smooth",

                block:
                    "start"

            });

        },
        500
    );

}