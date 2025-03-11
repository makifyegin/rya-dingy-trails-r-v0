// Initialize the map
const map = L.map('map').setView([52.961, 1.024], 13); // Adjusted for Blakeney Harbour

// Add OpenStreetMap tiles as the base layer
const openStreetMap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Add OpenSeaMap tiles as an overlay
const openSeaMap = L.tileLayer('https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png', {
    attribution: '© OpenSeaMap contributors',
    opacity: 0.7 // Adjust opacity for better visibility
}).addTo(map);

// Add layer control to toggle the OpenSeaMap overlay
const overlayLayers = {
    "OpenSeaMap Overlay": openSeaMap
};
L.control.layers(null, overlayLayers).addTo(map);

// Add coordinates display control
const coordinatesControl = L.control({ position: 'bottomright' });
coordinatesControl.onAdd = function () {
    this._div = L.DomUtil.create('div', 'leaflet-control-coordinates');
    this._div.innerHTML = 'Move the mouse over the map';
    return this._div;
};
coordinatesControl.addTo(map);

// Update coordinates on mouse move
map.on('mousemove', (e) => {
    const { lat, lng } = e.latlng;
    coordinatesControl._div.innerHTML = `Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}`;
});

// Initialize the draw control
const drawnItems = new L.FeatureGroup();
map.addLayer(drawnItems);

// Load saved features from local storage
let savedFeatures = localStorage.getItem('drawnFeatures');
if (savedFeatures) {
    try {
        savedFeatures = JSON.parse(savedFeatures);
    } catch (e) {
        console.error('Error parsing saved features:', e);
        savedFeatures = { blakeney: [], others: [] }; // Fallback to an empty object if parsing fails
    }
} else {
    savedFeatures = { blakeney: [], others: [] }; // Initialize with empty arrays for Blakeney and other drawings
}

console.log('Loaded features from local storage:', savedFeatures); // Debugging

// Add saved features to the map
savedFeatures.blakeney.forEach(feature => {
    const layer = L.geoJSON(feature).addTo(drawnItems);
    layer.options.blakeney = true; // Mark this layer as a Blakeney drawing
    console.log('Added Blakeney layer from local storage:', layer); // Debugging
});

savedFeatures.others.forEach(feature => {
    const layer = L.geoJSON(feature).addTo(drawnItems);
    console.log('Added other layer from local storage:', layer); // Debugging
});

const drawControl = new L.Control.Draw({
    edit: {
        featureGroup: drawnItems
    },
    draw: {
        polygon: true,
        polyline: true,
        rectangle: true,
        circle: true,
        marker: true
    }
});
map.addControl(drawControl); // Ensure this line is present

// Save drawn features to local storage
map.on(L.Draw.Event.CREATED, (e) => {
    const layer = e.layer;
    layer.options.blakeney = true; // Mark this layer as a Blakeney drawing
    drawnItems.addLayer(layer);

    // Convert drawn items to GeoJSON
    const features = {
        blakeney: [],
        others: []
    };

    drawnItems.eachLayer(layer => {
        const geoJSON = layer.toGeoJSON();
        if (layer.options.blakeney) {
            features.blakeney.push(geoJSON);
        } else {
            features.others.push(geoJSON);
        }
    });

    console.log('Saving features to local storage:', features); // Debugging

    // Save the drawn features to local storage
    localStorage.setItem('drawnFeatures', JSON.stringify(features));
});

// Handle feature deletion
map.on(L.Draw.Event.DELETED, () => {
    const features = {
        blakeney: [],
        others: []
    };

    drawnItems.eachLayer(layer => {
        const geoJSON = layer.toGeoJSON();
        if (layer.options.blakeney) {
            features.blakeney.push(geoJSON);
        } else {
            features.others.push(geoJSON);
        }
    });

    console.log('Updating features after deletion:', features); // Debugging

    // Save the updated features to local storage
    localStorage.setItem('drawnFeatures', JSON.stringify(features));
});

// Add search functionality using Leaflet Control Geocoder
const geocoder = L.Control.Geocoder.nominatim();
const searchControl = L.Control.geocoder({
    defaultMarkGeocode: false,
    geocoder: geocoder
}).addTo(map);

searchControl.on('markgeocode', (e) => {
    const { center, name } = e.geocode;
    map.setView(center, 14); // Zoom to the searched location
    L.marker(center).addTo(map).bindPopup(name).openPopup();
});