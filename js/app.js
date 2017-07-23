//---------------------------------
// Model
//---------------------------------

// Initialize locations for markers
var initialLocations = [
    {name: 'Tresor', address: 'Köpenicker Str. 70, 10179 Berlin, Germany', category: 'Nightlife'},
    {name: 'Berghain', address: 'Am Wriezener Bahnhof, 10243 Berlin, Germany', category: 'Nightlife'}
];

// Initialize blank array for visible markers 
var viewMarkers = [];

//---------------------------------
// Google Maps
//---------------------------------

// Define variables in global scope
var map;
var geocoder;

function initMap() {

	// Initialize map
	map = new google.maps.Map(document.getElementById('map'), {
		center: {lat: 52.5200, lng: 13.4050},
		zoom: 13
	});

	geocoder = new google.maps.Geocoder();

	// Create map markers
	for (i = 0; i < initialLocations.length; i++) {
		var address = initialLocations[i].address;
		var name = initialLocations[i].name;
		var category = initialLocations[i].category;

		wikiAPI(name);

		geocodeMarker(address, name, category);

	};

	document.getElementById('show-all').addEventListener('click', function() {
		showMarkers(viewMarkers);
	});

	document.getElementById('hide-all').addEventListener('click', function() {
		hideMarkers(viewMarkers);
	});
};

// Error handler for API load issues
function errorMap() {
	$('#map-message').text('Error: API did not return data.')
};

// Loop through the markers and show them all
function showMarkers(markers) {
	var bounds = new google.maps.LatLngBounds();
	// Extend the boundaries of the map for each marker and display the marker
	for (var i = 0; i < markers.length; i++) {
		markers[i].setMap(map);
		bounds.extend(markers[i].position);
	}
	map.fitBounds(bounds);
};

// Loop through the markers and hide them all
function hideMarkers(markers) {
	for (var i = 0; i < markers.length; i++) {
		markers[i].setMap(null);
	}
};

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

	    	createAnimation(marker);
	    	createInfoWindow(marker);
			viewMarkers.push(marker);
  		} else {
    		alert('Geocode was not successful for the following reason: ' + status);
  		}
	});
};

function createAnimation(marker) {
	marker.addListener('click', function() {
		if (marker.getAnimation() !== null) {
        	marker.setAnimation(null);
        } else {
        	marker.setAnimation(google.maps.Animation.BOUNCE);
        	setTimeout(function(){ marker.setAnimation(null); }, 750);
        }
	});
};

function createInfoWindow(marker) {
	var infoWindow = new google.maps.InfoWindow({
		content: marker.title + ' (' + marker.category + ')' +
				 "<p>" + marker.description + "</p>"
	});

	marker.addListener('click', function() {
		infoWindow.open(map, marker);
	});	
};

//---------------------------------
// Wikipedia API
//---------------------------------

function wikiAPI(name) {
    var apiURL = 'https://en.wikipedia.org/w/api.php?format=json&action=query&prop=extracts&exintro=&explaintext=&titles=';
    apiURL += name;

    $.ajax({
        url: apiURL, 
        dataType: 'jsonp',
        success: function(response) {
        	var wikiResult = response['query']['pages'];
        	var wikiResult = Object.values(wikiResult)[0];
    		var wikiSummary = wikiResult['extract'];

			for (var i = 0; i < initialLocations.length; i++) {
				if (initialLocations[i].name == name) {
					initialLocations[i].description = wikiSummary;
				};
        	};
        }
    });
};

//---------------------------------
// View Model
//---------------------------------

var MapViewModel = function(locations) {
	var self = this;

    self.locations = ko.observableArray(ko.utils.arrayMap(locations, function(location) {
    	return {name: location.name,
    			address: location.address,
    			category: location.category,
    			description: location.description};    			
    }));

    // Observables for drop-down list to filter locations by category
    self.filters = ko.observableArray(['All', 'Culture', 'Dining', 'Nightlife', 'Other']);
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

};

ko.applyBindings(new MapViewModel(initialLocations));
