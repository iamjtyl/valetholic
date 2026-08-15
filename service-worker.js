// =====================================
// VALETHOLIC SERVICE WORKER
// =====================================

self.addEventListener("push", event => {

    let data = {};

    try {

        data = event.data
            ? event.data.json()
            : {};

    } catch (error) {

        console.error(
            "Push data error:",
            error
        );

    }


    const title =
        data.title ||
        "🚗 New Valetholic Booking";


    const options = {

        body:
            data.body ||
            "You have a new booking.",

        icon:
            data.icon ||
            "/images/logo.png",

        badge:
            data.badge ||
            "/images/logo.png",

        vibrate: [
            200,
            100,
            200
        ],

        data: {

            url:
                data.url ||
                "/dashboard.html"

        },

        tag:
            data.tag ||
            "valetholic-booking",

        renotify:
            true

    };


    event.waitUntil(

        self.registration.showNotification(
            title,
            options
        )

    );

});


// =====================================
// NOTIFICATION CLICK
// =====================================

self.addEventListener(
    "notificationclick",
    event => {

        event.notification.close();


        const url =
            event.notification.data?.url ||
            "/dashboard.html";


        event.waitUntil(

            clients.matchAll({
                type: "window",
                includeUncontrolled: true
            })

            .then(
                clientList => {

                    // Try to find an existing dashboard

                    for (
                        const client
                        of clientList
                    ) {

                        if (
                            client.url.includes(
                                "/dashboard.html"
                            )
                        ) {

                            return client.focus();

                        }

                    }


                    // Otherwise open dashboard

                    return clients.openWindow(
                        url
                    );

                }
            )

        );

    }
);


// =====================================
// SERVICE WORKER READY
// =====================================

self.addEventListener(
    "install",
    event => {

        console.log(
            "🔔 Valetholic Service Worker installed."
        );

        self.skipWaiting();

    }
);


self.addEventListener(
    "activate",
    event => {

        console.log(
            "🔔 Valetholic Service Worker activated."
        );

        event.waitUntil(
            self.clients.claim()
        );

    }
);