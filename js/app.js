//---------------------------------
// Model
//---------------------------------

// Define locations for markers
var locationCategories = ['All', 'Culture', 'Dining', 'Nightlife', 'Other'];

// Initialize blank array for visible markers 
var viewMarkers = [];

//---------------------------------
// Google Maps
//---------------------------------

// Define variables in global scope
var map;
var infoWindow;
var geocoder;
var mapErrorMsg;

// Initialize Google Map
function initMap() {

	// Initialize map
	map = new google.maps.Map(document.getElementById('map'), {
		center: {lat: 52.5200, lng: 13.4050},
		zoom: 13
	});

	infoWindow = new google.maps.InfoWindow({maxWidth: 400}); 
	geocoder = new google.maps.Geocoder();

	// Create map markers
	for (i = 0, len = initialLocations.length; i < len; i++) {
		var address = initialLocations[i].address;
		var name = initialLocations[i].name;
		var category = initialLocations[i].category;
		
		geocodeMarker(address, name, category);
	}

}

// Error handler for Google Maps API load issues
function errorMap() {
    var $mapError = $('#map-error');
	$mapError.text('Warning: Google Maps API failed to load.');
}

// Create marker by geocoding address into latlong values
function geocodeMarker(address, name, category) {
	geocoder.geocode({'address': address}, function(results, status) {
  		if (status == 'OK') {
	    	var marker = new google.maps.Marker({
	        	title: name,
	        	category: category,
	        	map: map,
	        	position: results[0].geometry.location,
	        	animation: google.maps.Animation.DROP
			});   	

			marker.addListener('click', function() {
				// Animation
				if (marker.getAnimation() !== null) {
		        	marker.setAnimation(null);
		        } else {
		        	marker.setAnimation(google.maps.Animation.BOUNCE);
		        	setTimeout(function(){ marker.setAnimation(null); }, 750);
		        }

		        // Queries Wikipedia API and creates infowindow with information
		        wikiAPI(marker);
			});

			viewMarkers.push(marker);

  		} else {
    		alert('Geocode was not successful for the following reason: ' + status);
  		}
	});
}

// Create marker infowindow
function createInfoWindow(marker, description) {
	contentString = marker.title + ' (' + marker.category + ')' + 
				 '<p>' + description + '</p>';

	infoWindow.setContent(contentString);

	infoWindow.open(map, marker);
}

//---------------------------------
// Wikipedia API
//---------------------------------

// Query Wikipedia API based on title of each marker
function wikiAPI(marker) {
    var apiURL = 'https://en.wikipedia.org/w/api.php?format=json&action=query&prop=extracts&exintro=&explaintext=&titles=';
    apiURL += marker.title;

    $.ajax({
        url: apiURL, 
        dataType: 'jsonp',
        success: function(response) {
        	var wikiResult = response.query.pages;
        	wikiResult = Object.values(wikiResult)[0];
        	var pageTitle = wikiResult.title;
    		var wikiSummary = wikiResult.extract;
    		var wikiSummaryShortened = wikiSummary.substring(0, 200);

    		if (wikiSummaryShortened.slice(-1) != '.') {
    			wikiSummaryShortened += '...';
    		}

    		wikiSummaryShortened += '</p><p><a href="https://en.wikipedia.org/wiki/' + pageTitle + '">Read More</a>';

    		createInfoWindow(marker, wikiSummaryShortened);
        },
        error: function() {
    		var $wikiError = $('#wiki-error');
        	$wikiError.text('Warning: Wikipedia articles failed to load.');
        }
    });	
}

//---------------------------------
// View Model
//---------------------------------

var MapViewModel = function(locations) {
	var self = this;

	// Translate locations into KO observable array
    self.locations = ko.observableArray(ko.utils.arrayMap(locations, function(location) {
    	return {name: location.name,
    			address: location.address,
    			category: location.category,
    			description: ''};
    }));

    // Observables for drop-down list to filter locations by category
    self.filters = ko.observableArray(locationCategories);
    self.filter = ko.observable('');

    // Filters list of locations shown based on category selection by user
    self.filteredLocations = ko.computed(function() {
    	var filter = self.filter();
    	if (!filter || filter == 'All') {
    		return self.locations();
    	} else {
    		return ko.utils.arrayFilter(self.locations(), function(i) {
    			return i.category == filter;
    		});
    	}
    });

    // Filters which markers are shown based on category selection by user
    self.updateMarkers = function() {
    	var filter = self.filter();
    	for (i = 0; i < viewMarkers.length; i++) {
        	marker = viewMarkers[i];
	        if (marker.category == filter || filter === 'All') {
	            marker.setVisible(true);
	        }
	        else {
	            marker.setVisible(false);
	        }
    	}
    };

    // Animates active marker
	self.activeMarker = function(place) {
		viewMarkers.forEach(function(marker) {
			if (marker.title == place) {
				google.maps.event.trigger(marker, 'click');
			}
		});
	};

	// Loop through the markers and show them all
	self.showMarkers = function(markers) {
		var bounds = new google.maps.LatLngBounds();
		// Extend the boundaries of the map for each marker and display the marker
		for (var i = 0; i < markers.length; i++) {
			markers[i].setMap(map);
			bounds.extend(markers[i].position);
		}
		map.fitBounds(bounds);
	};

	// Loop through the markers and hide them all
	self.hideMarkers = function(markers) {
		for (var i = 0; i < markers.length; i++) {
			markers[i].setMap(null);
		}
	};

};

ko.applyBindings(new MapViewModel(initialLocations));