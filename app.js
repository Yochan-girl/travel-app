// ===============================
// Supabase 接続
// ===============================

const SUPABASE_URL =
  'https://bekopbgpjvhjwjgntldb.supabase.co';

const SUPABASE_KEY =
  'sb_publishable_vikI_atnygiPs9Yvoqs_ug_NHX2XEzb';

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);


// ===============================
// 選択中の国
// ===============================

let selectedCountryCode = null;
let selectedCountryName = null;


// ===============================
// 世界地図
// ===============================

const map = L.map('map').setView([20, 0], 2);

L.tileLayer(
  'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap'
  }
).addTo(map);


// ===============================
// 国境データを読み込む
// ===============================

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

          const countryName =
            feature.properties.name;

          const countryCode =
            feature.properties.ISO3166_1_Alpha_2 ||
            feature.properties.iso_a2 ||
            feature.properties.ISO_A2 ||
            countryName;

          selectedCountryName = countryName;
          selectedCountryCode = countryCode;

          document
            .getElementById('selected-country')
            .textContent = countryName;

        });

      }

    }).addTo(map);

  })
  .catch(error => {

    console.error(
      '地図データの読み込みに失敗しました',
      error
    );

  });


// ===============================
// 保存ボタン
// ===============================

document
  .getElementById('saveButton')
  .addEventListener(
    'click',
    async function () {

      if (
        !selectedCountryCode ||
        !selectedCountryName
      ) {

        alert(
          '先に地図から国を選択してください'
        );

        return;
      }


      const record = {

        country_code:
          selectedCountryCode,

        country_name:
          selectedCountryName,


        visit_date_1:
          document
            .getElementById('visitDate1')
            .value || null,

        visit_city_1:
          document
            .getElementById('visitCity1')
            .value,


        visit_date_2:
          document
            .getElementById('visitDate2')
            .value || null,

        visit_city_2:
          document
            .getElementById('visitCity2')
            .value,


        visit_date_3:
          document
            .getElementById('visitDate3')
            .value || null,

        visit_city_3:
          document
            .getElementById('visitCity3')
            .value,


        visit_date_4:
          document
            .getElementById('visitDate4')
            .value || null,

        visit_city_4:
          document
            .getElementById('visitCity4')
            .value,


        visit_date_5:
          document
            .getElementById('visitDate5')
            .value || null,

        visit_city_5:
          document
            .getElementById('visitCity5')
            .value,


        food:
          document
            .getElementById('food')
            .value,

        memory:
          document
            .getElementById('memory')
            .value,

        memo:
          document
            .getElementById('memo')
            .value

      };


      const { error } =
        await supabaseClient
          .from('travel-app')
          .upsert(
            record,
            {
              onConflict:
                'country_code'
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

    }
  );
