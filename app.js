const express = require('express');
const bodyParser = require('body-parser');

const app = express();

var cors = require('cors');
app.use(cors());
app.use(bodyParser.json());

var verifiedLocations = [];
var locationCoordinates = [];
var response = []

const protocol = "https://";
const googlePlacesDomain = "maps.googleapis.com/"
const googlePlacesSearchParameters = "maps/api/place/findplacefromtext/json?input=";
const API_KEY = "AIzaSyC9VCYHJUjZKap_qj22RkOYCYH5POTlje4";
const googleApiKeyParemeters = "&inputtype=textquery&fields=formatted_address,name,geometry&key=" + API_KEY;

async function parseLocations(locations) {
    locations.forEach(location => {
        fetchCoordinatesForLocation(location);
        verifiedLocations.push(location);
    });
}

async function fetchCoordinatesForLocation(locationName) {

    var locationParameter = locationName.split(' ').join('%20');

    var googlePlaceSearchURL = protocol + googlePlacesDomain + googlePlacesSearchParameters + locationParameter + googleApiKeyParemeters;

    const request = require('request');
    await request(googlePlaceSearchURL, async function (error, response, body) {
        if (error) {
            console.log("error: ");
            console.log(error);
        } else {            
            // Converting JSON-encoded string to JS object
            var locationsJSON = JSON.parse(body);
            const name = locationsJSON['candidates'][0]['name'];
            const latitude = locationsJSON['candidates'][0]['geometry']['location']['lat'];
            const longitude = locationsJSON['candidates'][0]['geometry']['location']['lng'];
        
            var blanketLocation = {};
            blanketLocation.name = name;
            blanketLocation.latitude = latitude;
            blanketLocation.longitude = longitude;
            locationCoordinates.push(blanketLocation);
        
            // await parseAndAddCoordinates(locationsJSON);
        }
    });

}

// Define recursive function to print nested values
async function parseAndAddCoordinates(locationsJSON) {

    const name = locationsJson['candidates'][0]['name'];
    const latitude = locationsJson['candidates'][0]['geometry']['location']['lat'];
    const longitude = locationsJson['candidates'][0]['geometry']['location']['lng'];

    var blanketLocation = {};
    blanketLocation.name = name;
    blanketLocation.latitude = latitude;
    blanketLocation.longitude = longitude;
    locationCoordinates.push(blanketLocation);

    // console.log("All coordinates");
    // console.log(locationCoordinates);

};

async function findNearestNeighbors() {

    var shortestDistance = 100000;
    var shortestPlaceInBetween = "";

    console.log("Location Coordinates length");
    console.log(locationCoordinates.length);

    for (var i = 0; i < locationCoordinates.length; i++) {
        var longitude = locationCoordinates[i].longitude;
        var latitude = locationCoordinates[i].latitude;
        for (var j = 0; j < locationCoordinates.length; j++) {
            if (j !== i) {
                var longitude2 = locationCoordinates[j].longitude;
                var latitude2 = locationCoordinates[j].latitude;
                var lng = longitude - longitude2;
                var lat = latitude - latitude2;
                // Calculate the distance between two points

                const dist = Math.sqrt((Math.pow(lng, 2) + Math.pow(lat, 2)));
                if (dist < shortestDistance) {
                    shortestDistance = dist;
                    shortestPlaceInBetween = locationCoordinates[j].name;
                }
            }
        }

        var locationResponse = {};
        locationResponse.name = locationCoordinates[i].name;
        locationResponse.nearestLocation = shortestPlaceInBetween;
        response.push(locationResponse);
        shortestDistance = 100000;
        shortestPlaceInBetween = "";

    }

    locationCoordinates = [];
    verifiedLocations = [];

}

function validateInput() {
    if (verifiedLocations.length < 50 || verifiedLocations.length > 100) return false;
    return true;
}

// Initialize the app.
const server = app.listen(process.env.PORT || 8080, function () {
    var port = server.address().port;
    console.log("App now running on port", port);
});

app.get('/health', (req, res) => res.send('Application is healthy'));

app.get('/Blanket/Locations', (req, res) => {

    // Validate Locations input 
    parseLocations(req.body.locations);

    if (!validateInput()) res.send("Number of Locations must between 50 and 100");

    findNearestNeighbors().then(res.send(response));

});