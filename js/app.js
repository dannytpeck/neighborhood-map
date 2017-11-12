// Globals
var map;
var markers = [];
var bounds;
var largeInfowindow;

// These are the locations the app initializes with
var initialLocations = [
  {title: 'Purple Cafe & Wine Bar', location: {lat: 47.6140101, lng: -122.1988555}, foursquareId: '4aad43e3f964a5205a5f20e3'},
  {title: 'Bellevue Brewing Company', location: {lat: 47.6265565, lng: -122.1661568}, foursquareId: '4ffb0b30e4b0b8fdabb4a1af'},
  {title: 'Black Bottle Postern', location: {lat: 47.6186143, lng: -122.2018311}, foursquareId: '4d5755821270236a8aaf8859'},
  {title: 'Geaux Brewing', location: {lat: 47.6303201, lng: -122.1795937}, foursquareId: '51915f16011cc2fb720bdd6e'},
  {title: 'The Pumphouse Bar & Grill', location: {lat: 47.6177487, lng: -122.1830852}, foursquareId: '4a83909cf964a52070fb1fe3'},
  {title: 'Sideline Sports Bar', location: {lat: 47.5773441, lng: -122.1687762}, foursquareId: '41117880f964a520de0b1fe3'},
  {title: 'Monsoon East', location: {lat: 47.6101889, lng: -122.2031894}, foursquareId: '4a8dcfe5f964a520f41020e3'},
  {title: 'Bin On The Lake', location: {lat: 47.6569991, lng: -122.2074092}, foursquareId: '4ba41c13f964a5207c8238e3'}
];

var Locale = function(location) {
  var self = this;

  self.title = ko.observable(location.title);
  self.location = ko.observable(location.location);
  self.foursquareId = ko.observable(location.foursquareId);

  // Create this location's marker
  self.marker = new google.maps.Marker({
    map: map,
    position: self.location(),
    animation: google.maps.Animation.DROP,
    title: self.title(),
    foursquareId: self.foursquareId()
  });

  // Add this marker to the markers array
  markers.push(self.marker);

  // Extend map bounds
  bounds.extend(self.marker.position);

  // Click on marker to make it animate and show infowindow
  self.marker.addListener('click', function() {
    toggleMarker(self.marker);
  });

};

var ViewModel = function() {
  var self = this;

  // Add all initial locations to the locations array
  this.locations = ko.observableArray([]);
  initialLocations.forEach(function(location) {
    self.locations.push(new Locale(location));
  });

  // Update map bounds now that all the locations are loaded
  map.fitBounds(bounds);

  // Use first location as the initial currentLocation
  this.currentLocation = ko.observable(this.locations()[0]);

  this.selectLocation = function(clickedLocation) {
    self.currentLocation(clickedLocation);
    toggleMarker(self.currentLocation().marker);
  }

  this.searchText = ko.observable('');

  // Filtered locations based on user search
  this.filteredLocations = ko.computed(function() {
    return self.locations().filter(function(location) {
      var visibility = true;
      if (self.searchText()) {
        if (location.title().toLowerCase().includes(self.searchText())) {
          visibility = true;
        } else {
          visibility = false;
        }
      }

      // Set map marker based on visibility
      location.marker.setVisible(visibility);

      return visibility;
    });
  });

};

// Initialize Google Map
function initMap() {
  // Constructor creates a new map
  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 47.652042, lng: -122.3646713},
    zoom: 13,
    mapTypeControl: false
  });

  // Create bounds
  bounds = new google.maps.LatLngBounds();

  // Create info window
  largeInfowindow = new google.maps.InfoWindow();

  // Resize map when window is resized
  google.maps.event.addDomListener(window, 'resize', function() {
    map.fitBounds(bounds);
  });
}

// Populates infowindow when clicked
function populateInfoWindow(marker, infowindow) {
  // Foursquare API deets
  var clientId = '114EPTUAI3MLHVF24X4M2I3E5CUFL0UFONDKFCDOB410OPEI';
  var clientSecret = 'RRNXSXF4Q5HOJQXKLTIAHYP25KPL3A5TBIHDSIGEXYXVK3GM';
  var foursquareId = marker.foursquareId;

  // Check to make sure the infowindow is not already opened on this marker.
  if (infowindow.marker != marker) {
    // Clear the infowindow content
    infowindow.setContent('');
    infowindow.marker = marker;
    // Make sure the marker property is cleared if the infowindow is closed.
    infowindow.addListener('closeclick', function() {
      infowindow.marker = null;
    });

    var url = `https://api.foursquare.com/v2/venues/${foursquareId}?v=20171101&client_id=${clientId}&client_secret=${clientSecret}`;
    $.getJSON(url).done(function(data) {
      var bestPhoto = data.response.venue.bestPhoto;
      var description = data.response.venue.description
      var phoneNumber = data.response.venue.contact.formattedPhone;
      var imgSrc = bestPhoto.prefix + '200x200' + bestPhoto.suffix;

      var htmlContent = '<div class="title">' + marker.title + '</div>';

      if (description) {
        htmlContent += `<div class="text">${description}</div>`;
      }

      if (phoneNumber) {
        htmlContent += `<div class="text">Contact: ${phoneNumber}</div>`
      }

      htmlContent += '<img class="image" src="' + imgSrc + '"} />';
      htmlContent += '<div class="text">Data collected from Foursquare</div>';
      infowindow.setContent(htmlContent);

      // Open the infowindow on the correct marker.
      infowindow.open(map, marker);
    }).fail(function() {
      infowindow.setContent('<div class="title">' + marker.title + '</div><div class="text">No Foursquare Data Found</div>');

      // Open the infowindow on the correct marker.
      infowindow.open(map, marker);
    });
  }
}

function stopAnimatingMarkers() {
  markers.forEach(function(marker) {
    marker.setAnimation(null);
  })
}

function toggleMarker(marker) {
  // Stop all marker animations
  stopAnimatingMarkers();

  // Make this marker bounce
  marker.setAnimation(google.maps.Animation.BOUNCE);

  // Open infowindow at marker
  populateInfoWindow(marker, largeInfowindow);
}

// Initialize app by initializing map and knockout
var initApp = function() {
  initMap();
  ko.applyBindings(new ViewModel());
};

var googleError = function() {
  console.log('Google maps API cannot be accessed. Reload page.');
  $('#error').show();
};

// Event handler for hamburger menu
$('#hamburger').click(function() {
  $optionsBox = $('.options-box');

  $optionsBox.toggle();
  $optionsBox.toggleClass('hidden');

  if ($optionsBox.hasClass('hidden')) {
    $('#hamburger').css('left', '10px');
    $('#map').css('width', '100%');
  } else {
    $('#hamburger').css('left', '36%');
    $('#map').css('width', '65%');
  }
});
