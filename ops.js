// =====================================
// VALETHOLIC OPS
// OPERATIONS DASHBOARD
// =====================================

let map = null;

let markers = {};

console.log(
    "OPS JS Loaded"
);


// =====================================
// START
// =====================================

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        console.log(
            "OPS Dashboard starting..."
        );


        // =================================
        // LOGOUT BUTTON
        // =================================

        const logoutButton =
            document.querySelector(
                ".logout-btn"
            );


        if (logoutButton) {

            logoutButton.addEventListener(
                "click",
                logout
            );

        }


        // =================================
        // MAP
        // =================================

        initMap();


        // =================================
        // LOAD DASHBOARD
        // =================================

        await loadDashboard();

    }
);



// =====================================
// DASHBOARD
// =====================================

async function loadDashboard() {

    await loadDrivers();

    await loadBookings();

}



// =====================================
// DRIVERS
// =====================================

async function loadDrivers() {

    console.log(
        "Loading approved drivers..."
    );


    const {
        data,
        error
    } =
        await window.supabaseClient
            .from("Drivers")
            .select("*")
            .eq(
                "approved",
                true
            )
            .eq(
                "approval_status",
                "APPROVED"
            );


    // =================================
    // DATABASE ERROR
    // =================================

    if (error) {

        console.error(
            "Driver loading error:",
            error
        );

        alert(
            error.message
        );

        return;

    }


    const drivers =
        data || [];


    console.log(
        "APPROVED DRIVERS:",
        drivers
    );


    // =================================
    // DRIVER COUNT
    // =================================

    const dutyCount =
        document.getElementById(
            "dutyCount"
        );


    if (dutyCount) {

        dutyCount.textContent =
            drivers.filter(
                driver =>
                    driver.status ===
                    "ON DUTY"
            ).length;

    }


    // =================================
    // DRIVER LIST
    // =================================

    const driverList =
        document.getElementById(
            "driverList"
        );


    if (!driverList) {

        return;

    }


    driverList.innerHTML = "";


    // =================================
    // CURRENT DRIVER IDS
    // =================================
    //
    // Used to remove stale map markers
    // if a driver was removed/deleted.
    //

    const currentDriverAuthIds =
        new Set(
            drivers
                .map(
                    driver =>
                        driver.auth_id
                )
                .filter(Boolean)
        );


    // =================================
    // REMOVE STALE MARKERS
    // =================================

    Object.keys(
        markers
    ).forEach(
        authId => {

            if (
                !currentDriverAuthIds.has(
                    authId
                )
            ) {

                console.log(
                    "Removing stale driver marker:",
                    authId
                );


                if (
                    map &&
                    markers[authId]
                ) {

                    map.removeLayer(
                        markers[authId]
                    );

                }


                delete markers[
                    authId
                ];

            }

        }
    );


    // =================================
    // NO APPROVED DRIVERS
    // =================================

    if (
        drivers.length === 0
    ) {

        driverList.innerHTML = `

            <div class="driver-card">

                <div>
                    No approved drivers.
                </div>

                <div class="driver-status off-duty">

                    NONE

                </div>

            </div>

        `;

        return;

    }


    // =================================
    // RENDER DRIVERS
    // =================================

    drivers.forEach(
        driver => {

            const status =
                driver.status ||
                "OFF DUTY";


            const statusClass =
                status === "ON DUTY"
                    ? "on-duty"
                    : status === "ON JOB"
                        ? "on-job"
                        : "off-duty";


            driverList.innerHTML += `

                <div class="driver-card">

                    <div>

                        ${escapeHTML(
                            driver.name ||
                            "Driver"
                        )}

                    </div>


                    <div class="
                        driver-status
                        ${statusClass}
                    ">

                        ${escapeHTML(
                            status
                        )}

                    </div>

                </div>

            `;


            // =================================
            // DRIVER GPS MARKER
            // =================================

            updateDriverMarker(
                driver
            );

        }
    );

}



// =====================================
// UPDATE DRIVER MARKER
// =====================================

function updateDriverMarker(
    driver
) {

    if (
        !driver ||
        !driver.auth_id
    ) {

        return;

    }


    const authId =
        driver.auth_id;


    const activeDriver =
        driver.status === "ON DUTY" ||
        driver.status === "ON JOB";


    // =================================
    // DRIVER NOT ACTIVE
    // =================================

    if (!activeDriver) {

        removeDriverMarker(
            authId
        );

        return;

    }


    // =================================
    // NO GPS
    // =================================

    if (
        driver.latitude === null ||
        driver.latitude === undefined ||
        driver.longitude === null ||
        driver.longitude === undefined
    ) {

        return;

    }


    const latitude =
        Number(
            driver.latitude
        );


    const longitude =
        Number(
            driver.longitude
        );


    if (
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude)
    ) {

        return;

    }


    // =================================
    // MARKER COLOUR
    // =================================

    const markerColor =
        driver.status === "ON DUTY"
            ? "green"
            : "orange";


    // =================================
    // MARKER ICON
    // =================================

    const markerIcon =
        L.divIcon({

            className:
                "",

            html: `

                <div style="
                    width:20px;
                    height:20px;
                    background:${markerColor};
                    border:3px solid white;
                    border-radius:50%;
                    box-shadow:
                        0 2px 8px
                        rgba(0,0,0,.4);
                "></div>

            `,

            iconSize:
                [26, 26],

            iconAnchor:
                [13, 13]

        });


    // =================================
    // POPUP
    // =================================

    const popupContent = `

        <strong>
            🚗 ${escapeHTML(
                driver.name ||
                "Driver"
            )}
        </strong>

        <br><br>

        <strong>
            Status:
        </strong>

        ${escapeHTML(
            driver.status ||
            "OFF DUTY"
        )}

        <br>

        <strong>
            GPS:
        </strong>

        ${latitude.toFixed(5)},
        ${longitude.toFixed(5)}

    `;


    // =================================
    // UPDATE EXISTING MARKER
    // =================================

    if (
        markers[authId]
    ) {

        markers[authId]
            .setLatLng([
                latitude,
                longitude
            ]);


        markers[authId]
            .setIcon(
                markerIcon
            );


        markers[authId]
            .setPopupContent(
                popupContent
            );


        return;

    }


    // =================================
    // CREATE NEW MARKER
    // =================================

    markers[authId] =
        L.marker(

            [
                latitude,
                longitude
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



// =====================================
// REMOVE DRIVER MARKER
// =====================================

function removeDriverMarker(
    authId
) {

    if (
        !authId
    ) {

        return;

    }


    if (
        markers[authId]
    ) {

        if (map) {

            map.removeLayer(
                markers[authId]
            );

        }


        delete markers[
            authId
        ];

    }

}



// =====================================
// BOOKINGS
// =====================================

async function loadBookings() {

    const {
        data,
        error
    } =
        await window.supabaseClient
            .from("Bookings")
            .select("*")
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


    // =================================
    // ERROR
    // =================================

    if (error) {

        console.error(
            "Booking loading error:",
            error
        );

        alert(
            error.message
        );

        return;

    }


    const bookings =
        data || [];


    // =================================
    // PENDING
    // =================================

    const pendingJobs =
        bookings.filter(
            booking =>
                String(
                    booking.status
                ).toUpperCase() ===
                "PENDING"
        );


    // =================================
    // ACTIVE
    // =================================

    const activeJobs =
        bookings.filter(
            booking => {

                const status =
                    String(
                        booking.status
                    ).toUpperCase();


                return (
                    status === "ON JOB" ||
                    status === "ON THE WAY" ||
                    status === "PICKED UP"
                );

            }
        );


    // =================================
    // COMPLETED TODAY
    // =================================

    const today =
        new Date()
            .toISOString()
            .split("T")[0];


    const completedJobs =
        bookings.filter(
            booking => {

                const status =
                    String(
                        booking.status
                    ).toUpperCase();


                return (
                    status === "COMPLETED" &&
                    booking.booking_date ===
                        today
                );

            }
        );


    // =================================
    // UPDATE COUNTERS
    // =================================

    const pendingCount =
        document.getElementById(
            "pendingCount"
        );


    const activeCount =
        document.getElementById(
            "activeCount"
        );


    const completeCount =
        document.getElementById(
            "completeCount"
        );


    if (pendingCount) {

        pendingCount.textContent =
            pendingJobs.length;

    }


    if (activeCount) {

        activeCount.textContent =
            activeJobs.length;

    }


    if (completeCount) {

        completeCount.textContent =
            completedJobs.length;

    }


    // =================================
    // DISPATCH LIST
    // =================================

    const dispatchList =
        document.getElementById(
            "dispatchList"
        );


    if (!dispatchList) {

        return;

    }


    dispatchList.innerHTML = "";


    // =================================
    // NO PENDING JOBS
    // =================================

    if (
        pendingJobs.length === 0
    ) {

        dispatchList.innerHTML = `

            <div class="dispatch-card">

                <div class="dispatch-name">

                    No pending bookings.

                </div>

            </div>

        `;

        return;

    }


    // =================================
    // RENDER PENDING BOOKINGS
    // =================================

    pendingJobs.forEach(
        booking => {

            const pickup =
                getLocation(
                    booking.pickups
                );


            const destination =
                getLocation(
                    booking.destinations
                );


            dispatchList.innerHTML += `

                <div class="dispatch-card">


                    <div class="dispatch-top">


                        <div class="dispatch-ref">

                            VH-${escapeHTML(
                                booking.reference_no ||
                                "----"
                            )}

                        </div>


                        <div class="dispatch-status">

                            ${escapeHTML(
                                booking.status ||
                                "Pending"
                            )}

                        </div>


                    </div>



                    <div class="dispatch-name">

                        👤
                        ${escapeHTML(
                            booking.customer_name ||
                            "Customer"
                        )}

                    </div>



                    <div class="dispatch-route">

                        📍
                        ${escapeHTML(
                            pickup
                        )}

                        <br>

                        ↓

                        <br>

                        📍
                        ${escapeHTML(
                            destination
                        )}

                    </div>



                    <div class="dispatch-bottom">


                        <div class="dispatch-time">

                            🕒

                            ${escapeHTML(
                                booking.booking_date ||
                                "-"
                            )}

                            •

                            ${escapeHTML(
                                booking.booking_time ||
                                "-"
                            )}

                        </div>



                        <button
                            type="button"
                            class="open-btn"
                            onclick="
                                location.href =
                                'ops-booking.html?id=${encodeURIComponent(
                                    booking.id
                                )}'
                            "
                        >

                            OPEN

                        </button>


                    </div>


                </div>

            `;

        }
    );

}



// =====================================
// GET LOCATION
// =====================================

function getLocation(
    value
) {

    if (
        !value
    ) {

        return "-";

    }


    // =================================
    // STRING
    // =================================

    if (
        typeof value ===
        "string"
    ) {

        try {

            const parsed =
                JSON.parse(
                    value
                );


            return getLocation(
                parsed
            );

        }

        catch {

            return (
                value.trim() ||
                "-"
            );

        }

    }


    // =================================
    // ARRAY
    // =================================

    if (
        Array.isArray(value)
    ) {

        return value
            .map(
                item =>
                    getLocation(
                        item
                    )
            )
            .filter(
                item =>
                    item &&
                    item !== "-"
            )
            .join(", ")
            || "-";

    }


    // =================================
    // OBJECT
    // =================================

    if (
        typeof value ===
        "object"
    ) {

        const fields = [

            "address",
            "location",
            "name",
            "formatted_address",
            "full_address",
            "pickup",
            "destination"

        ];


        for (
            const field
            of fields
        ) {

            if (
                value[field] !==
                    undefined &&
                value[field] !==
                    null &&
                String(
                    value[field]
                ).trim() !== ""
            ) {

                return String(
                    value[field]
                ).trim();

            }

        }


        try {

            return JSON.stringify(
                value
            );

        }

        catch {

            return "-";

        }

    }


    return String(
        value
    );

}



// =====================================
// LIVE MAP
// =====================================

function initMap() {

    const mapElement =
        document.getElementById(
            "driverMap"
        );


    if (!mapElement) {

        console.error(
            "driverMap element not found."
        );

        return;

    }


    map =
        L.map(
            "driverMap"
        ).setView(
            [
                1.3521,
                103.8198
            ],
            12
        );


    // =================================
    // SINGAPORE BOUNDS
    // =================================

    const singaporeBounds =
        L.latLngBounds(

            [
                1.15,
                103.60
            ],

            [
                1.48,
                104.10
            ]

        );


    map.setMaxBounds(
        singaporeBounds
    );


    map.setMinZoom(
        map.getBoundsZoom(
            singaporeBounds
        )
    );


    // =================================
    // MAP TILES
    // =================================

    L.tileLayer(

        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",

        {

            attribution:
                "&copy; OpenStreetMap contributors"

        }

    ).addTo(map);

}



// =====================================
// LIVE DRIVER UPDATES
// =====================================

window.supabaseClient

    .channel(
        "live-driver-gps"
    )

    .on(

        "postgres_changes",

        {

            event:
                "*",

            schema:
                "public",

            table:
                "Drivers"

        },

        async payload => {

            console.log(
                "Driver realtime update:",
                payload.eventType,
                payload.new
            );


            // =================================
            // DRIVER DELETED
            // =================================

            if (
                payload.eventType ===
                "DELETE"
            ) {

                const oldDriver =
                    payload.old;


                if (
                    oldDriver &&
                    oldDriver.auth_id
                ) {

                    removeDriverMarker(
                        oldDriver.auth_id
                    );

                }


                await loadDrivers();

                return;

            }


            // =================================
            // DRIVER UPDATED
            // =================================

            if (
                payload.eventType ===
                "UPDATE"
            ) {

                const driver =
                    payload.new;


                // Removed / unapproved
                if (
                    driver.approved !== true ||
                    driver.approval_status !==
                        "APPROVED"
                ) {

                    removeDriverMarker(
                        driver.auth_id
                    );


                    await loadDrivers();

                    return;

                }


                updateDriverMarker(
                    driver
                );


                await loadDrivers();

            }

        }

    )

    .subscribe(
        status => {

            console.log(
                "Driver realtime:",
                status
            );

        }
    );



// =====================================
// LIVE BOOKING UPDATES
// =====================================

window.supabaseClient

    .channel(
        "live-booking-updates"
    )

    .on(

        "postgres_changes",

        {

            event:
                "*",

            schema:
                "public",

            table:
                "Bookings"

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



// =====================================
// LOGOUT
// =====================================

async function logout() {

    console.log(
        "OPS logout clicked."
    );


    try {

        // =================================
        // SIGN OUT FROM SUPABASE AUTH
        // =================================

        if (
            window.supabaseClient
        ) {

            const {
                error
            } =
                await window.supabaseClient
                    .auth
                    .signOut();


            if (error) {

                console.error(
                    "Supabase logout error:",
                    error
                );

            }

        }

    }

    catch (error) {

        console.error(
            "Unexpected logout error:",
            error
        );

    }


    // =================================
    // CLEAR LOCAL SESSION
    // =================================

    sessionStorage.removeItem(
        "adminLoggedIn"
    );


    sessionStorage.removeItem(
        "adminId"
    );


    sessionStorage.removeItem(
        "adminRole"
    );


    sessionStorage.removeItem(
        "adminUsername"
    );


    sessionStorage.removeItem(
        "adminName"
    );


    // =================================
    // GO TO LOGIN
    // =================================

    window.location.href =
        "login.html";

}



// =====================================
// HTML ESCAPE
// =====================================

function escapeHTML(
    value
) {

    return String(
        value ?? ""
    )
    .replace(
        /&/g,
        "&amp;"
    )
    .replace(
        /</g,
        "&lt;"
    )
    .replace(
        />/g,
        "&gt;"
    )
    .replace(
        /"/g,
        "&quot;"
    )
    .replace(
        /'/g,
        "&#039;"
    );

}