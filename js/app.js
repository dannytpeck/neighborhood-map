// These are the pizza locations the app initializes with
var initialLocations = [
  {title: 'Big Mario\'s Pizza', location: {lat: 47.6601293, lng: -122.3655865}, yelpId: 'big-marios-pizza-seattle-6'},
  {title: 'Frēlard Pizza Company', location: {lat: 47.6537991, lng: -122.3597635}, yelpId: 'frelard-pizza-company-seattle'},
  {title: 'Chinapie', location: {lat: 47.6523581, lng: -122.356624}, yelpId: 'chinapie-seattle-3'},
  {title: 'Via Tribunali', location: {lat: 47.6588171, lng: -122.3500846}, yelpId: 'via-tribunali-seattle-6'},
  {title: 'Ballard Pizza Company', location: {lat: 47.6612894, lng: -122.3306091}, yelpId: 'ballard-pizza-company-seattle'},
  {title: 'Pagliacci Pizza', location: {lat: 47.6539202, lng: -122.3437461}, yelpId: 'pagliacci-pizza-seattle-3'},
  {title: 'Zeeks Pizza', location: {lat: 47.648321, lng: -122.3559744}, yelpId: 'zeeks-pizza-seattle'},
  {title: 'Ballroom', location: {lat: 47.6516998, lng: -122.3532554}, yelpId: 'the-ballroom-seattle'}
];

var Joint = function(data) {
  this.title = ko.observable(data.title);
  this.location = ko.observable(data.location);
  this.yelpId = ko.observable(data.yelpId);
};

var ViewModel = function() {
  var self = this;

  this.locations = ko.observableArray([]);

  this.filterLocations = function() {
    var searchText = document.querySelector('#filter-text').value.toLowerCase();

    // Clear locations observable array
    self.locations.removeAll();

    // Cycle through initial Locations and only add ones that match the search Text
    initialLocations.forEach(function(location) {
      if (location.title.toLowerCase().includes(searchText)) {
        self.locations.push(new Joint(location))
      }
    });
  };

  initialLocations.forEach(function(location) {
    self.locations.push(new Joint(location));
  });
};

var map;

// Create a new blank array for all the listing markers.
var markers = [];

function initMap() {
  // Constructor creates a new map - only center and zoom are required.
  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 47.652042, lng: -122.3646713},
    zoom: 13,
    mapTypeControl: false
  });

  var largeInfowindow = new google.maps.InfoWindow();

  // The following group uses the location array to create an array of markers on initialize.
  for (var i = 0; i < initialLocations.length; i++) {
    // Get the position from the location array.
    var position = initialLocations[i].location;
    var title = initialLocations[i].title;
    // Create a marker per location, and put into markers array.
    var marker = new google.maps.Marker({
      position: position,
      title: title,
      animation: google.maps.Animation.DROP,
      id: i
    });
    // Push the marker to our array of markers.
    markers.push(marker);
    // Create an onclick event to open the large infowindow at each marker.
    marker.addListener('click', function() {
      populateInfoWindow(this, largeInfowindow);
    });
  }

  // Show all markers by default
  var bounds = new google.maps.LatLngBounds();
  for (var i = 0; i < markers.length; i++) {
    markers[i].setMap(map);
    bounds.extend(markers[i].position);
  }
  // Extend the boundaries of the map for each marker and display the marker
  map.fitBounds(bounds);

}

// This function populates the infowindow when the marker is clicked. We'll only allow
// one infowindow which will open at the marker that is clicked, and populate based
// on that markers position.
function populateInfoWindow(marker, infowindow) {
  // Check to make sure the infowindow is not already opened on this marker.
  if (infowindow.marker != marker) {
    // Clear the infowindow content to give the streetview time to load.
    infowindow.setContent('');
    infowindow.marker = marker;
    // Make sure the marker property is cleared if the infowindow is closed.
    infowindow.addListener('closeclick', function() {
      infowindow.marker = null;
    });
    var streetViewService = new google.maps.StreetViewService();
    var radius = 50;

    // In case the status is OK, which means the pano was found, compute the
    // position of the streetview image, then calculate the heading, then get a
    // panorama from that and set the options
    function getStreetView(data, status) {
      if (status == google.maps.StreetViewStatus.OK) {
        var nearStreetViewLocation = data.location.latLng;
        var heading = google.maps.geometry.spherical.computeHeading(
          nearStreetViewLocation, marker.position);
          infowindow.setContent('<div>' + marker.title + '</div><div id="pano"></div>');
          var panoramaOptions = {
            position: nearStreetViewLocation,
            pov: {
              heading: heading,
              pitch: 30
            }
          };
        var panorama = new google.maps.StreetViewPanorama(
          document.getElementById('pano'), panoramaOptions);
      } else {
        infowindow.setContent('<div>' + marker.title + '</div>' +
          '<div>No Street View Found</div>');
      }
    }

    // Use streetview service to get the closest streetview image within
    // 50 meters of the markers position
    streetViewService.getPanoramaByLocation(marker.position, radius, getStreetView);

    // Open the infowindow on the correct marker.
    infowindow.open(map, marker);
  }
}

// Loops through the markers and filters them based on user search
function filterMarkers() {
  var searchText = document.querySelector('#filter-text').value.toLowerCase();
  var filtered = markers.filter(function(marker) {
    return marker.title.toLowerCase().includes(searchText);
  });

  clearMarkers();
  filtered.forEach(function(marker) {
    marker.setMap(map);
  });
}

// Clear all markers from the map
function clearMarkers() {
  markers.forEach(function(marker) {
    marker.setMap(null);
  });
}

// Begin app by initializing knockout and google map
ko.applyBindings(new ViewModel());
initMap();

// Event handlers
$('#filter-text').keyup(filterMarkers);
$('#filter-button').click(filterMarkers);

// https://api.foursquare.com/v2/venues/${foursquareId}?v=20171101&client_id=${clientId}&client_secret=${clientSecret}

var foursquareId = '4aad43e3f964a5205a5f20e3';
var clientId = '114EPTUAI3MLHVF24X4M2I3E5CUFL0UFONDKFCDOB410OPEI';
var clientSecret = 'RRNXSXF4Q5HOJQXKLTIAHYP25KPL3A5TBIHDSIGEXYXVK3GM';

$.ajax({

  url: `https://api.yelp.com/v3/businesses/${foursquareId}`,
  type: 'GET',
  headers: {'Authorization': 'Bearer Mb84WblpHpm47Sa2Vwh5fqS6GlrYz69ZTKEhxrtOuQRdNwLGFgRen1Fa4pq8hS5tr9GKTpLSwns9ONYqzpqnnxNAmZ4MIhlbG-gBA7EI-j50FmzKTJP08timIr4EWnYx'},
  jsonpCallback: 'cb',
  cache: true,
  success: function(data) {
    console.log('SUCCESS');
  }
$.getJSON('https://api.foursquare.com/v2/venues/search?v=20171101&ll=41.878114%2C%20-87.629798&query=coffee&intent=checkin&client_id=114EPTUAI3MLHVF24X4M2I3E5CUFL0UFONDKFCDOB410OPEI&client_secret=RRNXSXF4Q5HOJQXKLTIAHYP25KPL3A5TBIHDSIGEXYXVK3GM').done((data) => console.log(data));
  // Fetch the stored token from localStorage and set in the header
  // headers: {"Authorization": localStorage.getItem('token')}
});
