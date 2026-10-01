// ========================================
// Supabase
// ========================================

const SUPABASE_URL =
  'https://bekopbgpjvhjwjgntldb.supabase.co';

const SUPABASE_KEY =
  'sb_publishable_vikI_atnygiPs9Yvoqs_ug_NHX2XEzb';

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);


// ========================================
// 選択中の国
// ========================================

let selectedCountryCode = null;
let selectedCountryName = null;


// ========================================
// HTML
// ========================================

const loginArea =
  document.getElementById('login-area');

const loggedInArea =
  document.getElementById('logged-in-area');

const saveButton =
  document.getElementById('saveButton');

const viewOnlyMessage =
  document.getElementById('view-only-message');

const editFields =
  document.querySelectorAll('.edit-field');


// ========================================
// 編集モード切替
// ========================================

function setEditMode(isLoggedIn) {

  editFields.forEach(field => {
    field.disabled = !isLoggedIn;
  });


  if (isLoggedIn) {

    loginArea.classList.add('hidden');

    loggedInArea.classList.remove('hidden');

    saveButton.classList.remove('hidden');

    viewOnlyMessage.classList.add('hidden');

  } else {

    loginArea.classList.remove('hidden');

    loggedInArea.classList.add('hidden');

    saveButton.classList.add('hidden');

    viewOnlyMessage.classList.remove('hidden');

  }

}


// ========================================
// 最初にログイン状態確認
// ========================================

async function checkLogin() {

  const {
    data: { session }
  } =
    await supabaseClient.auth.getSession();


  setEditMode(!!session);

}

checkLogin();


// ========================================
// Login
// ========================================

document
  .getElementById('loginButton')
  .addEventListener(
    'click',
    async function () {

      const email =
        document
          .getElementById('loginEmail')
          .value;

      const password =
        document
          .getElementById('loginPassword')
          .value;


      if (!email || !password) {

        alert(
          'メールアドレスとパスワードを入力してください'
        );

        return;

      }


      const { error } =
        await supabaseClient
          .auth
          .signInWithPassword({
            email: email,
            password: password
          });


      if (error) {

        console.error(error);

        alert(
          'ログインできませんでした。\n' +
          error.message
        );

        return;

      }


      alert('ログインしました');

      setEditMode(true);

    }
  );


// ========================================
// Logout
// ========================================

document
  .getElementById('logoutButton')
  .addEventListener(
    'click',
    async function () {

      await supabaseClient
        .auth
        .signOut({
          scope: 'local'
        });

      setEditMode(false);

      alert('ログアウトしました');

    }
  );


// ========================================
// Leaflet map
// ========================================

const map =
  L.map('map')
    .setView(
      [20, 0],
      2
    );


L.tileLayer(
  'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  {
    maxZoom: 19,

    attribution:
      '&copy; OpenStreetMap'
  }
).addTo(map);


// ========================================
// 入力欄を空にする
// ========================================

function clearForm() {

  for (let i = 1; i <= 5; i++) {

    document
      .getElementById(
        `visitDate${i}`
      )
      .value = '';

    document
      .getElementById(
        `visitCity${i}`
      )
      .value = '';

  }


  document
    .getElementById('food')
    .value = '';

  document
    .getElementById('memory')
    .value = '';

  document
    .getElementById('memo')
    .value = '';

}


// ========================================
// 保存済みデータを表示
// ========================================

async function loadCountryData(
  countryCode
) {

  clearForm();


  const {
    data,
    error
  } =
    await supabaseClient

      .from('travel-app')

      .select('*')

      .eq(
        'country_code',
        countryCode
      )

      .maybeSingle();


  if (error) {

    console.error(
      '読み込みエラー',
      error
    );

    return;

  }


  if (!data) {
    return;
  }


  for (let i = 1; i <= 5; i++) {

    document
      .getElementById(
        `visitDate${i}`
      )
      .value =
        data[`visit_date_${i}`] || '';

    document
      .getElementById(
        `visitCity${i}`
      )
      .value =
        data[`visit_city_${i}`] || '';

  }


  document
    .getElementById('food')
    .value =
      data.food || '';

  document
    .getElementById('memory')
    .value =
      data.memory || '';

  document
    .getElementById('memo')
    .value =
      data.memo || '';

}


// ========================================
// GeoJSON
// ========================================

fetch('countries.geo.json')

  .then(
    response =>
      response.json()
  )

  .then(data => {

    L.geoJSON(
      data,
      {

        style:
          function () {

            return {

              color:
                '#ffffff',

              weight:
                1,

              fillColor:
                '#cccccc',

              fillOpacity:
                0.7

            };

          },


        onEachFeature:
          function (
            feature,
            layer
          ) {

            layer.on(
              'click',
              async function () {

                const countryName =
                  feature
                    .properties
                    .name;


                const countryCode =
                  feature.properties
                    .ISO3166_1_Alpha_2 ||

                  feature.properties
                    .iso_a2 ||

                  feature.properties
                    .ISO_A2 ||

                  countryName;


                selectedCountryName =
                  countryName;

                selectedCountryCode =
                  countryCode;


                document
                  .getElementById(
                    'selected-country-name'
                  )
                  .textContent =
                    countryName;


                await loadCountryData(
                  countryCode
                );

              }
            );

          }

      }
    ).addTo(map);

  })

  .catch(error => {

    console.error(
      '地図読み込みエラー',
      error
    );

  });


// ========================================
// 保存
// ========================================

saveButton
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
            .getElementById(
              'visitDate1'
            )
            .value || null,

        visit_city_1:
          document
            .getElementById(
              'visitCity1'
            )
            .value,


        visit_date_2:
          document
            .getElementById(
              'visitDate2'
            )
            .value || null,

        visit_city_2:
          document
            .getElementById(
              'visitCity2'
            )
            .value,


        visit_date_3:
          document
            .getElementById(
              'visitDate3'
            )
            .value || null,

        visit_city_3:
          document
            .getElementById(
              'visitCity3'
            )
            .value,


        visit_date_4:
          document
            .getElementById(
              'visitDate4'
            )
            .value || null,

        visit_city_4:
          document
            .getElementById(
              'visitCity4'
            )
            .value,


        visit_date_5:
          document
            .getElementById(
              'visitDate5'
            )
            .value || null,

        visit_city_5:
          document
            .getElementById(
              'visitCity5'
            )
            .value,


        food:
          document
            .getElementById(
              'food'
            )
            .value,

        memory:
          document
            .getElementById(
              'memory'
            )
            .value,

        memo:
          document
            .getElementById(
              'memo'
            )
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


      alert(
        '保存しました！'
      );

    }
  );
