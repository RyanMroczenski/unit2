var map;
//function to instantiate the Leaflet map
function createMap(){
    //create the map
    map = L.map('map', {
        center: [20, 0],
        zoom: 2
    });

    //add OSM base tilelayer
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    }).addTo(map);

    //call getData function
    getData();
};

function calcMinValue(data){
    //create empty array to store all data values
    var allValues = [];
    var years = [2004, 2010, 2015, 2019, 2020, 2021, 2022];
    for (var feature of data.features) {
        // Extract properties of the current feature
        var properties = feature.properties;
        // Loop through each year
        for (var year of years) {
            // Get population for current year
            var value = properties[String(year)];
              allValues.push(value);
        }
    }
    //get minimum value of our array
    var minValue = Math.min(...allValues)

    return minValue;
}

//calculate the radius of each proportional symbol
function calcPropRadius(attValue) {
    //constant factor adjusts symbol sizes evenly
    var minRadius = 5;
    //Flannery Appearance Compensation formula
    var radius = 1.0083 * Math.pow(attValue/minValue,0.5715) * minRadius

    return radius;
};
function createPropSymbols(data, attributes) {
    // Step 4: Determine which attribute to visualize with proportional symbols
    var attribute = attributes[0];

    // Create marker options
    var geojsonMarkerOptions = {
        fillColor: "#ff7800",
        color: "#fff",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8
    };

    // Create a Leaflet GeoJSON layer and add it to the map
    L.geoJson(data, {
        pointToLayer: function (feature, latlng, attributes) {
            // For each feature, determine its value for the selected attribute
            var attValue = Number(feature.properties[attribute]);
            
            // Give each feature's circle marker a radius based on its attribute value
            geojsonMarkerOptions.radius = calcPropRadius(attValue);
            
            // Create circle marker layer
            var layer = L.circleMarker(latlng, geojsonMarkerOptions);
            
            // Build popup content string
            var popupContent = "<p><b>Country:</b> " + feature.properties.Country + "</p>";
            popupContent += "<p><b>Threatened Species in " + attribute + ":</b> " + attValue + " species</p>";
            
            // Bind the popup to the circle marker
            layer.bindPopup(popupContent, {
                offset: new L.Point(0, -geojsonMarkerOptions.radius) 
            });

            // Return the circle marker to the L.geoJson pointToLayer option
            return layer;
        }
    }).addTo(map);
};

//Step 1: Create new sequence controls
function createSequenceControls(attributes){
     //create range input element (slider)
     var slider = "<input class='range-slider' type='range'></input>";
     document.querySelector("#panel").insertAdjacentHTML('beforeend',slider);
 
     //set slider attributes
     document.querySelector(".range-slider").max = 6;
     document.querySelector(".range-slider").min = 0;
     document.querySelector(".range-slider").value = 0;
     document.querySelector(".range-slider").step = 1;

     // Create buttons without content
     document.querySelector('#panel').insertAdjacentHTML('beforeend','<button class="step" id="reverse">Reverse</button>');
     document.querySelector('#panel').insertAdjacentHTML('beforeend','<button class="step" id="forward">Forward</button>');

     //replace button content with images
     document.querySelector('#reverse').insertAdjacentHTML('beforeend',"<img src='img/reverse.png'>")
     document.querySelector('#forward').insertAdjacentHTML('beforeend',"<img src='img/forward.png'>")

     document.querySelectorAll('.step').forEach(function (step) {
        step.addEventListener("click", function () {
            var index = document.querySelector('.range-slider').value;

            // Increment or decrement depending on button clicked
            if (step.id == 'forward') {
                index++;
                // If past the last attribute, wrap around to first attribute
                index = index > 6 ? 0 : index;
            } else if (step.id == 'reverse') {
                index--;
                // If past the first attribute, wrap around to last attribute
                index = index < 0 ? (attributes.length - 1) : index;
            };

            // Update slider
            document.querySelector('.range-slider').value = index;
            // Call function to update proportional symbols
            updatePropSymbols(attributes[index]);
        })
    });
     // Step 5: input listener for slider
     document.querySelector('.range-slider').addEventListener('input', function () {
        // Get the new index value
        var index = this.value;
        // Call function to update proportional symbols
        updatePropSymbols(attributes[index]);
    });
};

function updatePropSymbols(attribute) {
    map.eachLayer(function (layer) {
        if (layer.feature && layer.feature.properties[attribute]) {
            var props = layer.feature.properties;
            var radius = calcPropRadius(props[attribute]);
            layer.setRadius(radius);

            var popupOffset = new L.Point(0, -radius);

            // Update popup content if needed
            var popupContent = "<p><b>Country:</b> " + props["Country"] + "</p>";
            popupContent += "<p><b>Threatened Species in " + attribute + ":</b> " + props[attribute] + " species</p>";
            popup = layer.getPopup();
            popup.setContent(popupContent).update();
            popup.options.offset = popupOffset;
            popup.update();
        };
    });
};

//Above Example 3.10...Step 3: build an attributes array from the data
function processData(data){
    //empty array to hold attributes
    var attributes = [];

    //properties of the first feature in the dataset
    var properties = data.features[0].properties;

    //push each attribute name into attributes array
    for (var attribute in properties){
        //only take attributes with population values
        if (attribute.indexOf("2") > -1){
            attributes.push(attribute);
        };
    };

    //check result
    console.log(attributes);

    return attributes;
};

//Step 2: Import GeoJSON data
function getData(){
    //load the data
    fetch("data/Lab1Data.geojson")
        .then(function(response){
            return response.json();
        })
        .then(function(json){
            //create an attributes array
            var attributes = processData(json);
            //calculate minimum data value
            minValue = calcMinValue(json);
            //call function to create proportional symbols
            createPropSymbols(json,attributes);
            createSequenceControls(attributes);
        })
};

document.addEventListener('DOMContentLoaded',createMap)