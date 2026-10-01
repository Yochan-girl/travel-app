const map = L.map('map').setView([20, 0], 2);

L.tileLayer(
  'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap'
  }
).addTo(map);

fetch('countries.geo.json')
  .then(response => response.json())
  .then(data => {

    L.geoJSON(data, {

      style: function () {
        return {
          color: '#ffffff',
          weight: 1,
          fillColor: '#cccccc',
          fillOpacity: 0.7
        };
      },

      onEachFeature: function (feature, layer) {

        layer.on('click', function () {

          const countryName = feature.properties.name;

          alert(countryName);

        });

      }

    }).addTo(map);

  });