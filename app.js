// ========================================
// Supabase 接続
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
// 現在選択している国
// ========================================

let selectedCountryCode = null;
let selectedCountryName = null;


// ========================================
// 地図の国データ
// ========================================

let countryLayers = {};
let visitCounts = {};


// ========================================
// HTML要素
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
// 管理者ページ判定
// ========================================

const urlParams =
  new URLSearchParams(
    window.location.search
  );

const isAdminPage =
  urlParams.get('admin') === '1';


// ========================================
// 編集モード切り替え
// ========================================

function setEditMode(isLoggedIn) {

  editFields.forEach(field => {
    field.disabled = !isLoggedIn;
  });


  if (isLoggedIn) {

    // ログイン中

    loginArea.classList.add('hidden');

    loggedInArea.classList.remove('hidden');

    saveButton.classList.remove('hidden');

    viewOnlyMessage.classList.add('hidden');

  } else {

    // 未ログイン

    loggedInArea.classList.add('hidden');

    saveButton.classList.add('hidden');

    viewOnlyMessage.classList.remove('hidden');


    // ?admin=1 のときだけログイン欄を表示
    if (isAdminPage) {

      loginArea.classList.remove('hidden');

    } else {

      loginArea.classList.add('hidden');

    }

  }

}


// ========================================
// 最初にログイン状態を確認
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
// ログイン
// ========================================

document
  .getElementById('loginButton')
  .addEventListener(
    'click',
    async function () {

      const email =
        document
          .getElementById('loginEmail')
          .value
          .trim();

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
        await supabaseClient.auth
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


      setEditMode(true);

      alert('ログインしました');

    }
  );


// ========================================
// ログアウト
// ========================================

document
  .getElementById('logoutButton')
  .addEventListener(
    'click',
    async function () {

      await supabaseClient.auth.signOut();

      setEditMode(false);

      alert('ログアウトしました');

    }
  );


// ========================================
// 国名を取得
// ========================================

function getCountryName(feature) {

  return (
    feature.properties.name ||
    feature.properties.ADMIN ||
    feature.properties.NAME ||
    'Unknown'
  );

}


// ========================================
// 国コードを取得
// ========================================

function getCountryCode(feature) {

  return (

    feature.properties[
      'ISO3166-1-Alpha-2'
    ] ||

    feature.properties.ISO_A2 ||

    feature.properties.iso_a2 ||

    feature.properties.ISO3166_1_Alpha_2 ||

    getCountryName(feature)

  );

}


// ========================================
// 訪問回数による色
// ========================================

function getCountryColor(count) {

  if (count >= 5) {
    return '#174f43';
  }

  if (count === 4) {
    return '#2f7565';
  }

  if (count === 3) {
    return '#5b9d8d';
  }

  if (count === 2) {
    return '#8fc5b8';
  }

  if (count === 1) {
    return '#c4e2da';
  }

  return '#d9dedc';

}


// ========================================
// Supabaseから訪問回数を取得
// ========================================

async function loadVisitCounts() {

  const {
    data,
    error
  } =
    await supabaseClient

      .from('travel-app')

      .select(`
        country_code,
        country_name,
        visit_date_1,
        visit_date_2,
        visit_date_3,
        visit_date_4,
        visit_date_5
      `);


  if (error) {

    console.error(
      '訪問回数取得エラー',
      error
    );

    return;

  }


  visitCounts = {};


  data.forEach(record => {

    const dates = [

      record.visit_date_1,
      record.visit_date_2,
      record.visit_date_3,
      record.visit_date_4,
      record.visit_date_5

    ];


    const count =
      dates.filter(date => date).length;


    if (record.country_code) {

      visitCounts[
        record.country_code
      ] = count;

    }


    if (record.country_name) {

      visitCounts[
        record.country_name
      ] = count;

    }

  });


  updateMapColors();

}


// ========================================
// 地図の色を更新
// ========================================

function updateMapColors() {

  Object.keys(
    countryLayers
  ).forEach(key => {

    const item =
      countryLayers[key];

    const count =
      visitCounts[item.countryCode] ??
      visitCounts[item.countryName] ??
      0;


    item.layer.setStyle({

      fillColor:
        getCountryColor(count),

      fillOpacity:
        0.8

    });

  });

}


// ========================================
// Leaflet 地図
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

  for (
    let i = 1;
    i <= 5;
    i++
  ) {

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
// 国の保存データを読み込む
// ========================================

async function loadCountryData(
  detectedCountryCode,
  countryName
) {

  clearForm();


  let {
    data,
    error
  } =
    await supabaseClient

      .from('travel-app')

      .select('*')

      .eq(
        'country_code',
        detectedCountryCode
      )

      .maybeSingle();


  if (error) {

    console.error(
      '国データ取得エラー',
      error
    );

    return;

  }


  if (!data) {

    const result =
      await supabaseClient

        .from('travel-app')

        .select('*')

        .eq(
          'country_name',
          countryName
        )

        .maybeSingle();


    if (result.error) {

      console.error(
        '国データ取得エラー',
        result.error
      );

      return;

    }


    data = result.data;

  }


  if (!data) {

    selectedCountryCode =
      detectedCountryCode;

    return;

  }


  selectedCountryCode =
    data.country_code ||
    detectedCountryCode;


  for (
    let i = 1;
    i <= 5;
    i++
  ) {

    document
      .getElementById(
        `visitDate${i}`
      )
      .value =
        data[
          `visit_date_${i}`
        ] || '';


    document
      .getElementById(
        `visitCity${i}`
      )
      .value =
        data[
          `visit_city_${i}`
        ] || '';

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
// 地図初期化
// ========================================

async function initializeMap() {

  await loadVisitCounts();


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
            function (feature) {

              const countryCode =
                getCountryCode(feature);

              const countryName =
                getCountryName(feature);


              const count =

                visitCounts[
                  countryCode
                ] ??

                visitCounts[
                  countryName
                ] ??

                0;


              return {

                color:
                  '#ffffff',

                weight:
                  1,

                fillColor:
                  getCountryColor(
                    count
                  ),

                fillOpacity:
                  0.8

              };

            },


          onEachFeature:
            function (
              feature,
              layer
            ) {

              const countryCode =
                getCountryCode(feature);

              const countryName =
                getCountryName(feature);


              countryLayers[
                countryCode
              ] = {

                layer:
                  layer,

                countryCode:
                  countryCode,

                countryName:
                  countryName

              };


              layer.on(
                'click',
                async function () {

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
                    countryCode,
                    countryName
                  );

                }
              );

            }

        }

      ).addTo(map);


      updateMapColors();

    })

    .catch(error => {

      console.error(
        '地図読み込みエラー',
        error
      );

    });

}


// ========================================
// 地図初期化
// ========================================

initializeMap();


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

        console.error(
          '保存エラー',
          error
        );


        alert(
          '保存に失敗しました。\n' +
          error.message
        );

        return;

      }


      await loadVisitCounts();


      alert(
        '保存しました！'
      );

    }
  );
