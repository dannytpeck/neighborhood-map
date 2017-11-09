var map;

// Create a new blank array for all the listing markers.
var markers = [];

// This global polygon variable is to ensure only ONE polygon is rendered.
var polygon = null;

function initMap() {
  // Constructor creates a new map - only center and zoom are required.
  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 47.652042, lng: -122.3646713},
    zoom: 13,
    mapTypeControl: false
  });

  // https://api.yelp.com/oauth2/token
  // client_id: nkAiQEV6rXonD1gIUTXhdQ
  // client_secret: 6dtZFXhBVhVrJ1utJZwwz5KZ1ytLeRy3qHhj4OsUV91sX9O5mxULUAcJpBovUUC5
  // grant_type: client_credentials
  // => { access_token: blahblah }

  // https://api.yelp.com/v3/businesses/north-india-restaurant-san-francisco
  // Bearer Mb84WblpHpm47Sa2Vwh5fqS6GlrYz69ZTKEhxrtOuQRdNwLGFgRen1Fa4pq8hS5tr9GKTpLSwns9ONYqzpqnnxNAmZ4MIhlbG-gBA7EI-j50FmzKTJP08timIr4EWnYx
  // => { image_url, display_phone, rating }

  // These are the pizza locations that will be shown to the user.
  // Normally we'd have these in a database instead.
  var locations = [
    {title: 'Big Mario\'s Pizza', location: {lat: 47.6601293, lng: -122.3655865}, yelpId: 'big-marios-pizza-seattle-6'},
    {title: 'Frēlard Pizza Company', location: {lat: 47.6537991, lng: -122.3597635}, yelpId: 'frelard-pizza-company-seattle'},
    {title: 'Chinapie', location: {lat: 47.6523581, lng: -122.356624}, yelpId: 'chinapie-seattle-3'},
    {title: 'Via Tribunali', location: {lat: 47.6588171, lng: -122.3500846}, yelpId: 'via-tribunali-seattle-6'},
    {title: 'Ballard Pizza Company', location: {lat: 47.6612894, lng: -122.3306091}, yelpId: 'ballard-pizza-company-seattle'},
    {title: 'Pagliacci Pizza', location: {lat: 47.6539202, lng: -122.3437461}, yelpId: 'pagliacci-pizza-seattle-3'},
    {title: 'Zeeks Pizza', location: {lat: 47.648321, lng: -122.3559744}, yelpId: 'zeeks-pizza-seattle'},
    {title: 'Ballroom', location: {lat: 47.6516998, lng: -122.3532554}, yelpId: 'the-ballroom-seattle'}
  ];

  var largeInfowindow = new google.maps.InfoWindow();

  // The following group uses the location array to create an array of markers on initialize.
  for (var i = 0; i < locations.length; i++) {
    // Get the position from the location array.
    var position = locations[i].location;
    var title = locations[i].title;
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

  document.getElementById('show-listings').addEventListener('click', showListings);
  document.getElementById('hide-listings').addEventListener('click', hideListings);

  document.getElementById('zoom-to-area').addEventListener('click', function() {
    zoomToArea();
  });

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

// This function will loop through the markers array and display them all.
function showListings() {
  var bounds = new google.maps.LatLngBounds();
  // Extend the boundaries of the map for each marker and display the marker
  for (var i = 0; i < markers.length; i++) {
    markers[i].setMap(map);
    bounds.extend(markers[i].position);
  }
  map.fitBounds(bounds);
}

// This function will loop through the listings and hide them all.
function hideListings() {
  for (var i = 0; i < markers.length; i++) {
    markers[i].setMap(null);
  }
}

// This function takes the input value in the find nearby area text input
// locates it, and then zooms into that area. This is so that the user can
// show all listings, then decide to focus on one area of the map.
function zoomToArea() {
  // Initialize the geocoder.
  var geocoder = new google.maps.Geocoder();
  // Get the address or place that the user entered.
  var address = document.getElementById('zoom-to-area-text').value;
  // Make sure the address isn't blank.
  if (address == '') {
    window.alert('You must enter an area, or address.');
  } else {
    // Geocode the address/area entered to get the center. Then, center the map
    // on it and zoom in
    geocoder.geocode(
      { address: address,
        componentRestrictions: {locality: 'New York'}
      }, function(results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
          map.setCenter(results[0].geometry.location);
          map.setZoom(15);
        } else {
          window.alert('We could not find that location - try entering a more' +
              ' specific place.');
        }
      });
  }
}
