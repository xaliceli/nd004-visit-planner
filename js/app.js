//---------------------------------
// Model
//---------------------------------

// Define locations for markers
var locationCategories = ['All', 'Culture', 'Dining', 'Nightlife', 'Other'];

var initialLocations = [
    {name: 'Tresor', address: 'Köpenicker Str. 70, 10179 Berlin, Germany', category: 'Nightlife', description: ''},
    {name: 'Berghain', address: 'Am Wriezener Bahnhof, 10243 Berlin, Germany', category: 'Nightlife', description: ''},
    {name: 'East Side Gallery', address: 'Mühlenstraße, 10243 Berlin, Germany', category: 'Culture', description: ''},
    {name: 'Pergamon Museum', address: 'Pergamonmuseum, 10117 Berlin, Germany', category: 'Culture', description: ''},
    {name: 'Kaufhaus des Westens', address: 'Tauentzienstraße 21-24, 10789 Berlin, Germany', category: 'Dining', description: ''}    
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
		
		geocodeMarker(address, name, category);
	}

	// Show all markers
	document.getElementById('show-all').addEventListener('click', function() {
		showMarkers(viewMarkers);
	});

	// Hide all markers
	document.getElementById('hide-all').addEventListener('click', function() {
		hideMarkers(viewMarkers);
	});
}

// Error handler for Google Maps API load issues
function errorMap() {
	$('#map-message').text('Error: API did not return data.');
}

// Loop through the markers and show them all
function showMarkers(markers) {
	var bounds = new google.maps.LatLngBounds();
	// Extend the boundaries of the map for each marker and display the marker
	for (var i = 0; i < markers.length; i++) {
		markers[i].setMap(map);
		bounds.extend(markers[i].position);
	}
	map.fitBounds(bounds);
}

// Loop through the markers and hide them all
function hideMarkers(markers) {
	for (var i = 0; i < markers.length; i++) {
		markers[i].setMap(null);
	}
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
	var infoWindow = new google.maps.InfoWindow({
		content: marker.title + ' (' + marker.category + ')' + 
				 '<p>' + description + '</p>'
	});

	infoWindow.open(map, marker);
}

//---------------------------------
// Wikipedia API
//---------------------------------

function wikiAPI(marker) {
    var apiURL = 'https://en.wikipedia.org/w/api.php?format=json&action=query&prop=extracts&exintro=&explaintext=&titles=';
    apiURL += marker.title;

    var $wikiError = $('#wiki-error');

    $.ajax({
        url: apiURL, 
        dataType: 'jsonp',
        success: function(response) {
        	var wikiResult = response.query.pages;
        	wikiResult = Object.values(wikiResult)[0];
    		var wikiSummary = wikiResult.extract;

    		createInfoWindow(marker, wikiSummary);
        },
        error: function() {
        	$wikiError.text('Warning: Wikipedia articles failed to load.');
        }
    });	
}

//---------------------------------
// View Model
//---------------------------------

var MapViewModel = function(locations) {
	var self = this;

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

};

ko.applyBindings(new MapViewModel(initialLocations));
