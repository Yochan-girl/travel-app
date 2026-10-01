const SUPABASE_URL = 'https://bekopbgpjvhjwjgntldb.supabase.co';

const SUPABASE_KEY = 'sb_publishable_vikI_atnygiPs9Yvoqs_ug_NHX2XEzb';

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

let selectedCountryCode = null;
let selectedCountryName = null;

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

          document.getElementById('selected-country').textContent = countryName;

        });

      }

    }).addTo(map);

  });

  food:
        document.getElementById('food').value,

      memory:
        document.getElementById('memory').value,

      memo:
        document.getElementById('memo').value

    };

    const { error } = await supabaseClient
      .from('travel_records')
      .upsert(
        record,
        {
          onConflict: 'country_code'
        }
      );

    if (error) {

      console.error(error);

      alert(
        '保存に失敗しました。\n' +
        error.message
      );

      return;
    }

    alert('保存しました！');

  });
