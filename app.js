// ========================================
// Supabase 接続
// ========================================

const SUPABASE_URL =
  'https://bekopbgpjvhjwjgntldb.supabase.co';

const SUPABASE_KEY =
  'sb_publishable_vikI_atnygiPs9Yvoqs_ug_NHX2XEzb';

const supabaseClient =
  supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );


// ========================================
// 状態
// ========================================

let selectedCountryCode = null;
let selectedCountryName = null;

let countryLayers = {};
let visitCounts = {};

let currentPhotoUrl1 = null;
let currentPhotoUrl2 = null;


// ========================================
// HTML
// ========================================

const loginArea =
  document.getElementById(
    'login-area'
  );

const loggedInArea =
  document.getElementById(
    'logged-in-area'
  );

const saveButton =
  document.getElementById(
    'saveButton'
  );

const viewOnlyMessage =
  document.getElementById(
    'view-only-message'
  );

const editFields =
  document.querySelectorAll(
    '.edit-field'
  );

const photoInput1 =
  document.getElementById(
    'photoInput1'
  );

const photoInput2 =
  document.getElementById(
    'photoInput2'
  );


// ========================================
// 管理者URL判定
// ========================================

const urlParams =
  new URLSearchParams(
    window.location.search
  );

const isAdminPage =
  urlParams.get(
    'admin'
  ) === '1';


// ========================================
// 編集モード
// ========================================

function setEditMode(
  isLoggedIn
) {

  editFields.forEach(
    field => {

      field.disabled =
        !isLoggedIn;

    }
  );


  document
    .querySelectorAll(
      '.edit-only-photo'
    )
    .forEach(
      element => {

        element.style.display =
          isLoggedIn
            ? 'flex'
            : 'none';

      }
    );


  if (isLoggedIn) {

    loginArea
      .classList
      .add('hidden');

    loggedInArea
      .classList
      .remove('hidden');

    saveButton
      .classList
      .remove('hidden');

    viewOnlyMessage
      .classList
      .add('hidden');

  } else {

    loggedInArea
      .classList
      .add('hidden');

    saveButton
      .classList
      .add('hidden');

    viewOnlyMessage
      .classList
      .remove('hidden');


    if (isAdminPage) {

      loginArea
        .classList
        .remove('hidden');

    } else {

      loginArea
        .classList
        .add('hidden');

    }

  }

}


// ========================================
// ログイン状態
// ========================================

async function checkLogin() {

  const {
    data: {
      session
    }
  } =
    await supabaseClient
      .auth
      .getSession();


  setEditMode(
    !!session
  );

}

checkLogin();


// ========================================
// ログイン
// ========================================

document
  .getElementById(
    'loginButton'
  )
  .addEventListener(
    'click',
    async function () {

      const email =
        document
          .getElementById(
            'loginEmail'
          )
          .value
          .trim();

      const password =
        document
          .getElementById(
            'loginPassword'
          )
          .value;


      if (
        !email ||
        !password
      ) {

        alert(
          'メールアドレスとパスワードを入力してください'
        );

        return;

      }


      const {
        error
      } =
        await supabaseClient
          .auth
          .signInWithPassword({
            email,
            password
          });


      if (error) {

        console.error(
          error
        );

        alert(
          'ログインできませんでした。\n' +
          error.message
        );

        return;

      }


      setEditMode(
        true
      );

      alert(
        'ログインしました'
      );

    }
  );


// ========================================
// ログアウト
// ========================================

document
  .getElementById(
    'logoutButton'
  )
  .addEventListener(
    'click',
    async function () {

      await supabaseClient
        .auth
        .signOut({
          scope: 'local'
        });


      setEditMode(
        false
      );

      alert(
        'ログアウトしました'
      );

    }
  );


// ========================================
// 国名
// ========================================

function getCountryName(
  feature
) {

  return (
    feature.properties.name ||
    feature.properties.ADMIN ||
    feature.properties.NAME ||
    'Unknown'
  );

}


// ========================================
// 国コード
// ========================================

function getCountryCode(
  feature
) {

  return (

    feature.properties[
      'ISO3166-1-Alpha-2'
    ] ||

    feature.properties
      .ISO_A2 ||

    feature.properties
      .iso_a2 ||

    feature.properties
      .ISO3166_1_Alpha_2 ||

    getCountryName(
      feature
    )

  );

}


// ========================================
// 地図色
// ========================================

function getCountryColor(
  count
) {

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
// 訪問国数
// ========================================

async function loadCountryCount() {

  const {
    data,
    error
  } =
    await supabaseClient
      .from(
        'travel-app'
      )
      .select(
        'country_code'
      );


  if (error) {

    console.error(
      '訪問国数取得エラー',
      error
    );

    return;

  }


  const countries =
    new Set();


  data.forEach(
    record => {

      if (
        record.country_code
      ) {

        countries.add(
          record.country_code
        );

      }

    }
  );


  const element =
    document
      .getElementById(
        'country-count'
      );


  if (element) {

    element.textContent =
      countries.size;

  }

}


// ========================================
// 訪問回数
// ========================================

async function loadVisitCounts() {

  const {
    data,
    error
  } =
    await supabaseClient
      .from(
        'travel-app'
      )
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


  data.forEach(
    record => {

      const dates = [

        record.visit_date_1,
        record.visit_date_2,
        record.visit_date_3,
        record.visit_date_4,
        record.visit_date_5

      ];


      const count =
        dates
          .filter(
            date => date
          )
          .length;


      if (
        record.country_code
      ) {

        visitCounts[
          record.country_code
        ] = count;

      }


      if (
        record.country_name
      ) {

        visitCounts[
          record.country_name
        ] = count;

      }

    }
  );


  updateMapColors();

}


// ========================================
// 地図色更新
// ========================================

function updateMapColors() {

  Object
    .keys(
      countryLayers
    )
    .forEach(
      key => {

        const item =
          countryLayers[
            key
          ];


        const count =

          visitCounts[
            item.countryCode
          ] ??

          visitCounts[
            item.countryName
          ] ??

          0;


        item.layer
          .setStyle({

            fillColor:
              getCountryColor(
                count
              ),

            fillOpacity:
              0.8

          });

      }
    );

}


// ========================================
// Leaflet
// ========================================

const map =
  L.map(
    'map'
  )
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
).addTo(
  map
);


// ========================================
// 写真表示
// ========================================

function showPhoto(
  number,
  url
) {

  const preview =
    document
      .getElementById(
        `photoPreview${number}`
      );

  const placeholder =
    document
      .getElementById(
        `photoPlaceholder${number}`
      );


  if (url) {

    preview.src =
      url;

    preview
      .classList
      .remove(
        'hidden'
      );

    placeholder
      .classList
      .add(
        'hidden'
      );

  } else {

    preview.src =
      '';

    preview
      .classList
      .add(
        'hidden'
      );

    placeholder
      .classList
      .remove(
        'hidden'
      );

  }

}


// ========================================
// 選択直後の写真プレビュー
// ========================================

function setLocalPhotoPreview(
  input,
  number
) {

  const file =
    input.files[0];


  if (!file) {
    return;
  }


  if (
    !file.type
      .startsWith(
        'image/'
      )
  ) {

    alert(
      '画像ファイルを選択してください'
    );

    input.value = '';

    return;

  }


  const url =
    URL.createObjectURL(
      file
    );


  showPhoto(
    number,
    url
  );

}


photoInput1
  .addEventListener(
    'change',
    function () {

      setLocalPhotoPreview(
        photoInput1,
        1
      );

    }
  );


photoInput2
  .addEventListener(
    'change',
    function () {

      setLocalPhotoPreview(
        photoInput2,
        2
      );

    }
  );


// ========================================
// フォームを空にする
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
    .getElementById(
      'food'
    )
    .value = '';


  document
    .getElementById(
      'memory'
    )
    .value = '';


  document
    .getElementById(
      'memo'
    )
    .value = '';


  photoInput1.value =
    '';

  photoInput2.value =
    '';


  currentPhotoUrl1 =
    null;

  currentPhotoUrl2 =
    null;


  showPhoto(
    1,
    null
  );

  showPhoto(
    2,
    null
  );

}


// ========================================
// 国のデータ読込
// ========================================

async function loadCountryData(
  countryCode,
  countryName
) {

  clearForm();


  let {
    data,
    error
  } =
    await supabaseClient
      .from(
        'travel-app'
      )
      .select('*')
      .eq(
        'country_code',
        countryCode
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
        .from(
          'travel-app'
        )
        .select('*')
        .eq(
          'country_name',
          countryName
        )
        .maybeSingle();


    if (
      result.error
    ) {

      console.error(
        '国データ取得エラー',
        result.error
      );

      return;

    }


    data =
      result.data;

  }


  if (!data) {

    selectedCountryCode =
      countryCode;

    return;

  }


  selectedCountryCode =
    data.country_code ||
    countryCode;


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
    .getElementById(
      'food'
    )
    .value =
      data.food || '';


  document
    .getElementById(
      'memory'
    )
    .value =
      data.memory || '';


  document
    .getElementById(
      'memo'
    )
    .value =
      data.memo || '';


  currentPhotoUrl1 =
    data.photo_url_1 ||
    null;

  currentPhotoUrl2 =
    data.photo_url_2 ||
    null;


  showPhoto(
    1,
    currentPhotoUrl1
  );

  showPhoto(
    2,
    currentPhotoUrl2
  );

}


// ========================================
// 写真アップロード
// ========================================

async function uploadPhoto(
  file,
  countryCode,
  number
) {

  if (!file) {
    return null;
  }


  const extension =
    file.name
      .split('.')
      .pop()
      .toLowerCase();


  const path =
    `${countryCode}/photo_${number}.${extension}`;


  const {
    error
  } =
    await supabaseClient
      .storage
      .from(
        'travel-photos'
      )
      .upload(
        path,
        file,
        {

          upsert:
            true,

          contentType:
            file.type,

          cacheControl:
            '3600'

        }
      );


  if (error) {

    console.error(
      '写真アップロードエラー',
      error
    );

    throw error;

  }


  const {
    data
  } =
    supabaseClient
      .storage
      .from(
        'travel-photos'
      )
      .getPublicUrl(
        path
      );


  return (
    data.publicUrl +
    '?v=' +
    Date.now()
  );

}


// ========================================
// 地図初期化
// ========================================

async function initializeMap() {

  await loadVisitCounts();


  fetch(
    'countries.geo.json'
  )

    .then(
      response =>
        response.json()
    )

    .then(
      data => {

        L.geoJSON(
          data,
          {

            style:
              function (
                feature
              ) {

                const countryCode =
                  getCountryCode(
                    feature
                  );

                const countryName =
                  getCountryName(
                    feature
                  );


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
                  getCountryCode(
                    feature
                  );

                const countryName =
                  getCountryName(
                    feature
                  );


                countryLayers[
                  countryCode
                ] = {

                  layer,
                  countryCode,
                  countryName

                };


                layer.on(
                  'click',
                  async function () {

                    selectedCountryName =
                      countryName;

                    selectedCountryCode =
                      countryCode;


                    const nameElement =
                      document
                        .getElementById(
                          'selected-country-name'
                        );


                    if (
                      nameElement
                    ) {

                      nameElement
                        .textContent =
                          countryName;

                    }


                    await loadCountryData(
                      countryCode,
                      countryName
                    );

                  }
                );

              }

          }

        ).addTo(
          map
        );


        updateMapColors();

      }
    )

    .catch(
      error => {

        console.error(
          '地図読み込みエラー',
          error
        );

      }
    );

}


// ========================================
// 初期処理
// ========================================

initializeMap();

loadCountryCount();


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


      try {

        saveButton.disabled =
          true;

        saveButton.textContent =
          '保存中...';


        let photoUrl1 =
          currentPhotoUrl1;

        let photoUrl2 =
          currentPhotoUrl2;


        const file1 =
          photoInput1
            .files[0];

        const file2 =
          photoInput2
            .files[0];


        if (file1) {

          photoUrl1 =
            await uploadPhoto(
              file1,
              selectedCountryCode,
              1
            );

        }


        if (file2) {

          photoUrl2 =
            await uploadPhoto(
              file2,
              selectedCountryCode,
              2
            );

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
              .value,


          photo_url_1:
            photoUrl1,

          photo_url_2:
            photoUrl2

        };


        const {
          error
        } =
          await supabaseClient
            .from(
              'travel-app'
            )
            .upsert(
              record,
              {
                onConflict:
                  'country_code'
              }
            );


        if (error) {

          throw error;

        }


        currentPhotoUrl1 =
          photoUrl1;

        currentPhotoUrl2 =
          photoUrl2;


        showPhoto(
          1,
          currentPhotoUrl1
        );

        showPhoto(
          2,
          currentPhotoUrl2
        );


        photoInput1.value =
          '';

        photoInput2.value =
          '';


        await loadVisitCounts();

        await loadCountryCount();


        alert(
          '保存しました！'
        );

      } catch (
        error
      ) {

        console.error(
          '保存エラー',
          error
        );


        alert(
          '保存に失敗しました。\n' +
          (
            error.message ||
            'エラーが発生しました'
          )
        );

      } finally {

        saveButton.disabled =
          false;

        saveButton.innerHTML =
          '<i class="bi bi-floppy"></i> 保存';

      }

    }
  );
