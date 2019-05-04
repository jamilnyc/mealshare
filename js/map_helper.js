var MealShareApp = window.MealShareApp || {};

(function scopeWrapper($) {
    MealShareApp.geocoder = null;
    MealShareApp.map = null;

    MealShareApp.initializeMap = function(mapId, title, address) {

        var callback = function(location) {
            console.log('inside callback');
            console.log(location);
            var mapElement = document.getElementById(mapId);
            MealShareApp.map = new google.maps.Map(mapElement, {
                center: {
                   lat: location.lat, 
                   lng: location.lng
                },
                zoom: 16
            });

            var markerTitle = title;
            var infoWindowContent = "<h3>" + markerTitle + "</h3><img src='/img/event.jpg' />";
            MealShareApp.addMarkerToMap(location, markerTitle, infoWindowContent);
        };

        MealShareApp.getLatitudeAndLongitude(address, callback);
    };

    MealShareApp.getLatitudeAndLongitude = function(address, callback) {
        MealShareApp.geocoder = new google.maps.Geocoder();
        MealShareApp.geocoder.geocode({'address': address}, function (results, status) {
            if (status === "OK") {
                var lat = results[0].geometry.location.lat();
                var lng = results[0].geometry.location.lng();
                var location = {
                    'lat': lat,
                    'lng': lng
                };
                if (callback) {
                    callback(location);
                }
            } else {
                console.error('Unable to load location for ' + address);
            }
        });
    };

    MealShareApp.addMarkerToMap = function(coordinates, title, infoWindowContent) {
        console.log('Adding marker at ' + coordinates.lat + ', ' + coordinates.lng);

        var marker = new google.maps.Marker({
            'position': coordinates,
            'map': MealShareApp.map,
            'title': title
        });
        
        var infoWindow = new google.maps.InfoWindow({
            'content': infoWindowContent
        });
        marker.addListener('click', function() {
            infoWindow.open(MealShareApp.map, marker);
        });
    };

})($);