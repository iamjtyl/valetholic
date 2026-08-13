function getRoughLocation(latitude, longitude) {

    if (
        latitude === null ||
        longitude === null
    ) {
        return "Location unavailable";
    }

    const lat = Number(latitude);
    const lon = Number(longitude);

    // Tampines
    if (
        lat >= 1.325 &&
        lat <= 1.365 &&
        lon >= 103.90 &&
        lon <= 103.97
    ) {
        return "Tampines";
    }

    // Bedok
    if (
        lat >= 1.305 &&
        lat <= 1.335 &&
        lon >= 103.90 &&
        lon <= 103.95
    ) {
        return "Bedok";
    }

    // Pasir Ris
    if (
        lat >= 1.365 &&
        lat <= 1.395 &&
        lon >= 103.93 &&
        lon <= 103.98
    ) {
        return "Pasir Ris";
    }

    // Changi
    if (
        lat >= 1.34 &&
        lat <= 1.40 &&
        lon >= 103.95 &&
        lon <= 104.05
    ) {
        return "Changi";
    }

    // Woodlands
    if (
        lat >= 1.42 &&
        lat <= 1.48 &&
        lon >= 103.75 &&
        lon <= 103.82
    ) {
        return "Woodlands";
    }

    // Jurong
    if (
        lat >= 1.30 &&
        lat <= 1.36 &&
        lon >= 103.68 &&
        lon <= 103.75
    ) {
        return "Jurong";
    }

    // City
    if (
        lat >= 1.27 &&
        lat <= 1.32 &&
        lon >= 103.82 &&
        lon <= 103.87
    ) {
        return "City";
    }

    return "Singapore";
}

let map;

let markers = {};

console.log("OPS JS Loaded");


// ==========================
// START
// ==========================

initMap();

loadDashboard();


// ==========================
// DASHBOARD
// ==========================

async function loadDashboard() {

    await loadDrivers();

    await loadBookings();

}


// ==========================
// DRIVERS
// ==========================

async function loadDrivers() {

    const { data, error } =
        await window.supabaseClient
        .from("Drivers")
        .select("*");

    if (error) {

        alert(error.message);

        console.error(error);

        return;

    }


    // ==========================
    // DRIVER COUNT
    // ==========================

    document.getElementById("dutyCount").textContent =
        data.filter(
            driver => driver.status === "ON DUTY"
        ).length;


    const driverList =
        document.getElementById("driverList");

    driverList.innerHTML = "";


    // ==========================
    // DRIVER LIST
    // ==========================

    data.forEach(driver => {

        let statusClass = "off-duty";

        if (driver.status === "ON DUTY") {

            statusClass = "on-duty";

        } else if (
            driver.status === "ON THE WAY"
        ) {

            statusClass = "on-way";

        } else if (
            driver.status === "CUSTOMER ON BOARD"
        ) {

            statusClass = "on-board";

        } else if (
            driver.status === "ON JOB"
        ) {

            statusClass = "on-job";

        }


        driverList.innerHTML += `

    <div class="driver-card">

        <div class="driver-name">
            ${driver.name}
        </div>

        <div class="driver-location">
            ${getRoughLocation(
                driver.latitude,
                driver.longitude
            )}
        </div>

        <div class="
            driver-status
            ${statusClass}
        ">
            ${driver.status}
        </div>

    </div>

`;


        // ==========================
        // DRIVER GPS MARKER
        // ==========================

        const activeDriver =
            driver.status === "ON DUTY" ||
            driver.status === "ON THE WAY" ||
            driver.status === "CUSTOMER ON BOARD" ||
            driver.status === "ON JOB";


        // ==========================
        // OFF DUTY
        // ==========================

        if (!activeDriver) {

            if (markers[driver.auth_id]) {

                map.removeLayer(
                    markers[driver.auth_id]
                );

                delete markers[driver.auth_id];

            }

            return;

        }


        // ==========================
        // NO GPS
        // ==========================

        if (
            driver.latitude === null ||
            driver.longitude === null
        ) {

            return;

        }


        // ==========================
        // MARKER COLOUR
        // ==========================

        let markerColor = "green";


        if (
            driver.status === "ON THE WAY"
        ) {

            markerColor = "orange";

        } else if (
            driver.status === "CUSTOMER ON BOARD"
        ) {

            markerColor = "red";

        } else if (
            driver.status === "ON JOB"
        ) {

            markerColor = "orange";

        }


        // ==========================
        // MARKER ICON
        // ==========================

        const markerIcon = L.divIcon({

            className: "",

            html: `

                <div style="
                    width: 20px;
                    height: 20px;
                    background: ${markerColor};
                    border: 3px solid white;
                    border-radius: 50%;
                    box-shadow:
                        0 2px 8px rgba(0,0,0,0.4);
                "></div>

            `,

            iconSize: [26, 26],

            iconAnchor: [13, 13]

        });


        // ==========================
        // POPUP
        // ==========================

        const popupContent = `

            <strong>
                🚗 ${driver.name}
            </strong>

            <br><br>

            <strong>
                Status:
            </strong>

            ${driver.status}

            <br>

            <strong>
                GPS:
            </strong>

            ${Number(driver.latitude).toFixed(5)},
            ${Number(driver.longitude).toFixed(5)}

        `;


        // ==========================
        // UPDATE EXISTING MARKER
        // ==========================

        if (markers[driver.auth_id]) {

            markers[driver.auth_id]
                .setLatLng([
                    driver.latitude,
                    driver.longitude
                ]);

            markers[driver.auth_id]
                .setIcon(markerIcon);

            markers[driver.auth_id]
                .setPopupContent(
                    popupContent
                );

        }


        // ==========================
        // CREATE MARKER
        // ==========================

        else {

            markers[driver.auth_id] =
                L.marker(

                    [
                        driver.latitude,
                        driver.longitude
                    ],

                    {
                        icon: markerIcon
                    }

                )
                .addTo(map)
                .bindPopup(
                    popupContent
                );

        }

    });

}


// ==========================
// BOOKINGS
// ==========================

async function loadBookings() {

    const { data, error } =
        await window.supabaseClient
        .from("Bookings")
        .select("*")
        .order(
            "created_at",
            {
                ascending: false
            }
        );


    if (error) {

        alert(error.message);

        console.error(error);

        return;

    }


    // ==========================
    // PENDING / ACTIVE / COMPLETED
    // ==========================

    const pendingJobs =
        data.filter(b =>
            String(b.status).toUpperCase() === "PENDING"
        );


    const activeJobs =
        data.filter(b => {

            const status =
                String(b.status).toUpperCase();

            return (
                status === "ON JOB" ||
                status === "ON THE WAY" ||
                status === "PICKED UP" ||
                status === "CUSTOMER ON BOARD"
            );

        });


    const today =
        new Date()
            .toISOString()
            .split("T")[0];


    const completedJobs =
        data.filter(b => {

            const status =
                String(b.status).toUpperCase();

            return (
                status === "COMPLETED" &&
                b.booking_date === today
            );

        });


    document.getElementById(
        "pendingCount"
    ).textContent =
        pendingJobs.length;


    document.getElementById(
        "activeCount"
    ).textContent =
        activeJobs.length;


    document.getElementById(
        "completeCount"
    ).textContent =
        completedJobs.length;


    // ==========================
    // DISPATCH LIST
    // ==========================

    const dispatchList =
        document.getElementById(
            "dispatchList"
        );

    dispatchList.innerHTML = "";


    data
        .filter(
            b =>
                String(b.status).toUpperCase() ===
                "PENDING"
        )
        .forEach(b => {

            let pickup = "-";

            let destination = "-";


            try {

                pickup =
                    Array.isArray(b.pickups)
                        ? b.pickups[0]
                        : JSON.parse(b.pickups)[0];

            } catch {

                pickup =
                    b.pickups || "-";

            }


            try {

                destination =
                    Array.isArray(b.destinations)
                        ? b.destinations[0]
                        : JSON.parse(b.destinations)[0];

            } catch {

                destination =
                    b.destinations || "-";

            }


            dispatchList.innerHTML += `

                <div class="dispatch-card">

                    <div class="dispatch-top">

                        <div class="dispatch-ref">

                            VH-${b.reference_no}

                        </div>

                        <div class="dispatch-status">

                            ${b.status}

                        </div>

                    </div>


                    <div class="dispatch-name">

                        👤 ${b.customer_name}

                    </div>


                    <div class="dispatch-route">

                        📍 ${pickup}

                        <br>

                        ↓

                        <br>

                        📍 ${destination}

                    </div>


                    <div class="dispatch-bottom">

                        <div class="dispatch-time">

                            🕒
                            ${b.booking_date}
                            •
                            ${b.booking_time}

                        </div>


                        <button
                            class="open-btn"
                            onclick="
                                location.href=
                                'ops-booking.html?id=${b.id}'
                            "
                        >

                            OPEN

                        </button>

                    </div>

                </div>

            `;

        });

}


// ==========================
// LIVE MAP
// ==========================

function initMap() {

    map =
        L.map(
            "driverMap"
        ).setView(
            [1.3521, 103.8198],
            12
        );


    // ==========================
    // SINGAPORE MAP BOUNDS
    // ==========================

    const singaporeBounds =
        L.latLngBounds(

            [1.15, 103.60],

            [1.48, 104.08]

        );


    // Prevent dragging far away

    map.setMaxBounds(
        singaporeBounds
    );


    // Prevent zooming out too far

    map.setMinZoom(
        map.getBoundsZoom(
            singaporeBounds
        )
    );


    // Keep map inside Singapore area

    map.on(
        "drag",
        function () {

            map.panInsideBounds(
                singaporeBounds,
                {
                    animate: false
                }
            );

        }
    );


    // ==========================
    // MAP TILES
    // ==========================

    L.tileLayer(

        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",

        {

            attribution:
                "&copy; OpenStreetMap contributors"

        }

    ).addTo(map);

}


// ==========================
// LIVE DRIVER GPS + STATUS
// ==========================

window.supabaseClient

    .channel(
        "live-driver-gps"
    )

    .on(

        "postgres_changes",

        {

            event: "UPDATE",

            schema: "public",

            table: "Drivers"

        },

        payload => {

            const driver =
                payload.new;


            console.log(
                "Driver update:",
                driver.name,
                driver.status,
                driver.latitude,
                driver.longitude
            );


            // ==========================
            // OFF DUTY
            // ==========================

            if (
                driver.status ===
                "OFF DUTY"
            ) {

                if (
                    markers[
                        driver.auth_id
                    ]
                ) {

                    map.removeLayer(
                        markers[
                            driver.auth_id
                        ]
                    );

                    delete markers[
                        driver.auth_id
                    ];

                }

                return;

            }


            // ==========================
            // NO GPS
            // ==========================

            if (
                driver.latitude === null ||
                driver.longitude === null
            ) {

                return;

            }


            // ==========================
            // MARKER COLOUR
            // ==========================

            let markerColor =
                "green";


            if (
                driver.status ===
                "ON THE WAY"
            ) {

                markerColor =
                    "orange";

            } else if (
                driver.status ===
                "CUSTOMER ON BOARD"
            ) {

                markerColor =
                    "red";

            } else if (
                driver.status ===
                "ON JOB"
            ) {

                markerColor =
                    "orange";

            }


            // ==========================
            // MARKER ICON
            // ==========================

            const markerIcon =
                L.divIcon({

                    className: "",

                    html: `

                        <div style="
                            width: 20px;
                            height: 20px;
                            background:
                                ${markerColor};
                            border:
                                3px solid white;
                            border-radius:
                                50%;
                            box-shadow:
                                0 2px 8px
                                rgba(0,0,0,0.4);
                        "></div>

                    `,

                    iconSize:
                        [26, 26],

                    iconAnchor:
                        [13, 13]

                });


            // ==========================
            // POPUP
            // ==========================

            const popupContent = `

                <strong>
                    🚗 ${driver.name}
                </strong>

                <br><br>

                <strong>
                    Status:
                </strong>

                ${driver.status}

                <br>

                <strong>
                    GPS:
                </strong>

                ${Number(
                    driver.latitude
                ).toFixed(5)},

                ${Number(
                    driver.longitude
                ).toFixed(5)}

            `;


            // ==========================
            // EXISTING MARKER
            // ==========================

            if (
                markers[
                    driver.auth_id
                ]
            ) {

                markers[
                    driver.auth_id
                ].setLatLng([

                    driver.latitude,

                    driver.longitude

                ]);


                markers[
                    driver.auth_id
                ].setIcon(
                    markerIcon
                );


                markers[
                    driver.auth_id
                ].setPopupContent(
                    popupContent
                );

            }


            // ==========================
            // NEW MARKER
            // ==========================

            else {

                markers[
                    driver.auth_id
                ] =

                    L.marker(

                        [

                            driver.latitude,

                            driver.longitude

                        ],

                        {

                            icon:
                                markerIcon

                        }

                    )

                    .addTo(map)

                    .bindPopup(
                        popupContent
                    );

            }

        }

    )

    .subscribe();


// ==========================
// LIVE BOOKING UPDATES
// ==========================

window.supabaseClient

    .channel(
        "live-booking-updates"
    )

    .on(

        "postgres_changes",

        {

            event: "*",

            schema: "public",

            table: "Bookings"

        },

        async payload => {

            console.log(
                "BOOKING UPDATE:",
                payload.eventType,
                payload.new
            );


            await loadBookings();

        }

    )

    .subscribe(

        status => {

            console.log(
                "Booking realtime:",
                status
            );

        }

    );