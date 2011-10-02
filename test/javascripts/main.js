(function($) {
    $(document).ready(function() {
        $("#canvas")
            .bind($.cartography.events.Geocode.SUCCESS, function(e, value) {
                console.log(value.id + "'s address is " + value.results[0].formatted_address + ".");
            })
            .bind($.cartography.events.Geolocation.SUCCESS, function(e, position) {
                $(this)
                    .cartography("geocode", {
                        id: "My location",
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    })
                    .cartography("mark", {
                        id: "My location",
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    });
            })
            .cartography({
                center: {
                    latitude: 25.759066,
                    longitude: -80.373833
                },
                geocode: [{
                    id: "Magic Kingdom",
                    address: "Disney Magic Kingdom, FL"
                }, {
                    id: "White House",
                    address: "White House, Washington DC"
                }],
                geolocate: true,
                markers: [{
                    id: "FIU",
                    address: "11200 SW 8th St, Miami, FL 33199"
                }],
                zoom: 10
            });
    });
})(jQuery);