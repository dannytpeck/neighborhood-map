// These are the pizza locations the app initializes with
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

var Locale = function(data) {
  this.title = ko.observable(data.title);
  this.location = ko.observable(data.location);
  this.foursquareId = ko.observable(data.foursquareId);
};

var ViewModel = function() {
  var self = this;

  // Array to store markers
  var markers = [];
  var largeInfowindow = new google.maps.InfoWindow();

  this.locations = ko.observableArray([]);

  // Loops through the markers and filters them based on user search
  this.filterMarkers = function() {
    var searchText = document.querySelector('#filter-text').value.toLowerCase();
    var filtered = markers.filter(function(marker) {
      return marker.title.toLowerCase().includes(searchText);
    });

    // Clear all markers from the map
    markers.forEach(function(marker) {
      marker.setMap(null);
    });

    // Display markers based on filter
    filtered.forEach(function(marker) {
      marker.setMap(self.map);
    });
  };

  // Filter locations based on user search
  this.filterLocations = function() {
    var searchText = document.querySelector('#filter-text').value.toLowerCase();

    // Clear locations observable array
    self.locations.removeAll();

    // Cycle through initial Locations and only add ones that match the search Text
    initialLocations.forEach(function(location) {
      if (location.title.toLowerCase().includes(searchText)) {
        self.locations.push(new Locale(location))
      }
    });

    self.filterMarkers();
  };

  // Get marker by title
  this.getMarker = function(title) {
    var foundMarker;
    markers.forEach(function(marker) {
      if (marker.title === title) {
        foundMarker = marker;
      }
    });
    return foundMarker;
  };

  // Click handler, closes infowindow and centers map
  this.handleClick = function(data) {
    var marker = self.getMarker(data.title());
    populateInfoWindow(marker, largeInfowindow);
    // largeInfowindow.close();
    // self.map.setCenter(new google.maps.LatLng(data.location.lat, data.location.lng));
    // self.map.setZoom(12);
  };

  // initially show all the locations
  initialLocations.forEach(function(location) {
    self.locations.push(new Locale(location));
  });

  // Constructor creates a new map - only center and zoom are required.
  this.map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 47.652042, lng: -122.3646713},
    zoom: 13,
    mapTypeControl: false
  });

  // Create an array of markers
  for (var i = 0; i < initialLocations.length; i++) {
    // Get the position from the location array.
    var position = initialLocations[i].location;
    var title = initialLocations[i].title;
    var foursquareId = initialLocations[i].foursquareId;

    // Create a marker per location, and put into markers array.
    var marker = new google.maps.Marker({
      position: position,
      title: title,
      animation: google.maps.Animation.DROP,
      id: i,
      foursquareId: foursquareId
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
    markers[i].setMap(self.map);
    bounds.extend(markers[i].position);
  }

  // Extend the boundaries of the map for each marker and display the marker
  self.map.fitBounds(bounds);

};

// Populates infowindow when clicked
function populateInfoWindow(marker, infowindow) {
  // Foursquare API deets
  var clientId = '114EPTUAI3MLHVF24X4M2I3E5CUFL0UFONDKFCDOB410OPEI';
  var clientSecret = 'RRNXSXF4Q5HOJQXKLTIAHYP25KPL3A5TBIHDSIGEXYXVK3GM';
  var foursquareId = marker.foursquareId;

  // Check to make sure the infowindow is not already opened on this marker.
  if (infowindow.marker != marker) {
    // Clear the infowindow content to give the streetview time to load.
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

      console.log(data);
      var htmlContent = '<div class="title">' + marker.title + '</div>';

      if (description) {
        htmlContent += `<div class="text">${description}</div>`;
      }

      if (phoneNumber) {
        htmlContent += `<div class="text">Contact: ${phoneNumber}</div>`
      }

      htmlContent += '<img class="image" src="' + imgSrc + '"} />';
      infowindow.setContent(htmlContent);

      // Open the infowindow on the correct marker.
      infowindow.open(self.map, marker);
    }).fail(function() {
      infowindow.setContent('<div class="title">' + marker.title + '</div><div class="text">No Street View Found</div>');

      // Open the infowindow on the correct marker.
      infowindow.open(self.map, marker);
    });
  }
}

// Begin app by initializing knockout
ko.applyBindings(new ViewModel());
