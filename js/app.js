//---------------------------------
// Model
//---------------------------------

var initialLocations = [
    { name: "Well-Travelled Kitten", sales: 352, price: 75.95 },
    { name: "Speedy Coyote", sales: 89, price: 190.00 },
    { name: "Furious Lizard", sales: 152, price: 25.00 },
    { name: "Indifferent Monkey", sales: 1, price: 99.95 },
    { name: "Brooding Dragon", sales: 0, price: 6350 },
    { name: "Ingenious Tadpole", sales: 39450, price: 0.35 },
    { name: "Optimistic Snail", sales: 420, price: 1.50 }
];

//---------------------------------
// Google Maps
//---------------------------------

// Construct new map
function initMap() {
	map = new google.maps.Map(document.getElementById('map'), {
		center: {lat: 52.5200, lng: 13.4050},
		zoom: 13
	});
}

function errorMap() {
	$('#map-message').text('Error: API did not return data.')
}

//---------------------------------
// View Model
//---------------------------------