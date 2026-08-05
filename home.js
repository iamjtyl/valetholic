function showBooking(){

    const hero = document.getElementById("hero");

    hero.classList.add("booking-open");

    setTimeout(() => {

        hero.scrollIntoView({

            behavior:"smooth",
            block:"start"

        });

    }, 500);

}