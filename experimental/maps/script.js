/**
 * Test Script that loads Google Maps
 * 1. Creates Marker
 * 2. Creates Info Box
 * 3. Creates event handlers
 */

var MealShareApp = window.MealShareApp || {};

(function() {
    var map = null;
    
    MealShareApp.initializeMap = function() {
        console.log('Initializing Map')
        var myLatitude = 40.8076492;
        var myLongitude = -73.9651691;
        map = new google.maps.Map(document.getElementById('map'), {
            center: {
               lat: myLatitude, 
               lng: myLongitude
            },
            zoom: 16
        });
        
        var markerLatitude = 40.808033;
        var markerLongitude = -73.9642572;
        var markerTitle = 'The Subway Station';
        var infoWindowContent = "<h3>The 1 Train Station</h3><img src='https://www.motherjones.com/wp-content/uploads/photo/harry-headshot.jpg?w=96' />"
        MealShareApp.addMarkerToMap(markerLatitude, markerLongitude, markerTitle, infoWindowContent);
    };
    
    MealShareApp.addMarkerToMap = function(latitude, longitude, title, infoWindowContent) {
        console.log('Adding marker at ' + latitude + ', ' + longitude);
        var coordinates = {
            lat: latitude,
            lng: longitude
        };
        var marker = new google.maps.Marker({
            position: coordinates,
            map: map,
            title: title
        });
        
        var infoWindow = new google.maps.InfoWindow({
            content: infoWindowContent
        });
        marker.addListener('click', function() {
            infoWindow.open(map, marker);
        });
    };
    
    MealShareApp.getDistances = function() {
        var origins = ['Columbia University'];
        var destinations = ['Washington Square Park'];
        
        var service = new google.maps.DistanceMatrixService();
        service.getDistanceMatrix({
            origins: origins,
            destinations: destinations,
            travelMode: 'WALKING',
            unitSystem: google.maps.UnitSystem.IMPERIAL
        }, function (response, status) {
            console.log(response);
            console.log(status);
        });
    };
    
    MealShareApp.getLatitudeAndLongitude = function() {
        var service =   
    };
})();