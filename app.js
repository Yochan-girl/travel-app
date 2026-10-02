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
// 管理者UID
// ========================================

const ADMIN_USER_ID =
  '2e2166ba-564d-49a6-a54f-136b1fa9077c';


// ========================================
// 現在選択中の国
// ========================================

let selectedCountryCode = null;
let selectedCountryName = null;


// ========================================
// 地図用
// ========================================

let countryLayers = {};
let visitCounts = {};


// ========================================
// 写真URL
// ========================================

let currentPhotoUrl1 = null;
let currentPhotoUrl2 = null;


// ========================================
// HTML要素
// ========================================

const adminPanel =
  document.getElementById('admin-panel');

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

const photoInput1 =
  document.getElementById('photoInput1');

const photoInput2 =
  document.getElementById('photoInput2');


// ========================================
// 管理者URL判定
// ========================================

const urlParams =
  new URLSearchParams(
    window.location.search
  );

const isAdminPage =
  urlParams.get('admin') === '1';


// ========================================
// 編集モード
// ========================================

function setEditMode(isOwner) {

  editFields.forEach(field => {
    field.disabled = !isOwner;
  });


  // 写真選択ボタン
  document
    .querySelectorAll('.edit-only-photo')
    .forEach(element => {

      element.style.display =
        isOwner
          ? 'flex'
          : 'none';

    });


  // -----------------------------
  // 編集できる場合
  // -----------------------------

  if (isOwner) {

    adminPanel.classList.remove('hidden');

    loginArea.classList.add('hidden');

    loggedInArea.classList.remove('hidden');

    saveButton.classList.remove('hidden');

    viewOnlyMessage.classList.add('hidden');

    return;
  }


  // -----------------------------
  // 編集できない場合
  // -----------------------------

  loggedInArea.classList.add('hidden');

  saveButton.classList.add('hidden');

  viewOnlyMessage.classList.remove('hidden');


  // 管理者URLだけログイン欄を表示
  if (isAdminPage) {

    adminPanel.classList.remove('hidden');

    loginArea.classList.remove('hidden');

  } else {

    adminPanel.classList.add('hidden');

    loginArea.classList.add('hidden');

  }

}


// ========================================
// ログイン状態確認
// ========================================

async function checkLogin() {

  const {
    data: { user },
    error
  } =
    await supabaseClient.auth.getUser();


  if (
    error ||
    !user
  ) {

    setEditMode(false);

    return;
  }


  const isOwner =
    isAdminPage &&
    user.id === ADMIN_USER_ID;


  setEditMode(isOwner);

}


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
        data,
        error
      } =
        await supabaseClient.auth
          .signInWithPassword({
            email,
            password
          });


      if (error) {

        console.error(
          'ログインエラー',
          error
        );

        alert(
          'ログインできませんでした。\n' +
          error.message
        );

        return;
      }


      // 管理者本人か確認
      if (
        !data.user ||
        data.user.id !== ADMIN_USER_ID
      ) {

        await supabaseClient.auth.signOut();

        setEditMode(false);

        alert(
          'このアカウントには編集権限がありません'
        );

        return;
      }


      setEditMode(true);

      alert(
        'ログインしました'
      );

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

      const {
        error
      } =
        await supabaseClient.auth
          .signOut({
            scope: 'local'
          });


      if (error) {

        console.error(
          'ログアウトエラー',
          error
        );

        alert(
          'ログアウトに失敗しました'
        );

        return;
      }


      setEditMode(false);

      alert(
        'ログアウトしました'
      );

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
// 訪問回数取得
// ========================================

function getVisitCount(
  countryCode,
  countryName
) {

  return (

    visitCounts[countryCode] ??

    visitCounts[countryName] ??

    0

  );

}


// ========================================
// 訪問回数による色
// ========================================

function getCountryColor(count) {

  // 5回以上
  if (count >= 5) {
    return '#0f4f3f';
  }

  // 4回
  if (count === 4) {
    return '#24705c';
  }

  // 3回
  if (count === 3) {
    return '#4a9b83';
  }

  // 2回
  if (count === 2) {
    return '#7cc5ad';
  }

  // 1回
  if (count === 1) {
    return '#b8e3d5';
  }

  // 未訪問
  return '#e8ecea';

}


// ========================================
// 国の通常スタイル
// ========================================

function getCountryStyle(
  countryCode,
  countryName
) {

  const count =
    getVisitCount(
      countryCode,
      countryName
    );


  return {

    // 国境線
    color:
      '#71857e',

    weight:
      1.2,

    opacity:
      0.9,

    // 国の塗り
    fillColor:
      getCountryColor(count),

    // 訪問国ははっきり
    fillOpacity:
      count > 0
        ? 0.92
        : 0.58

  };

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
      .from('travel-app')
      .select(`
        country_code,
        visit_date_1,
        visit_date_2,
        visit_date_3,
        visit_date_4,
        visit_date_5
      `);


  if (error) {

    console.error(
      '訪問国数取得エラー',
      error
    );

    return;
  }


  const countries =
    new Set();


  data.forEach(record => {

    const hasVisit =
      record.visit_date_1 ||
      record.visit_date_2 ||
      record.visit_date_3 ||
      record.visit_date_4 ||
      record.visit_date_5;


    if (
      record.country_code &&
      hasVisit
    ) {

      countries.add(
        record.country_code
      );

    }

  });


  const element =
    document.getElementById(
      'country-count'
    );


  if (element) {

    element.textContent =
      countries.size;

  }

}


// ========================================
// 訪問回数を取得
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
      dates
        .filter(date => date)
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

  });


  updateMapColors();

}


// ========================================
// 地図の色を更新
// ========================================

function updateMapColors() {

  Object
    .keys(countryLayers)
    .forEach(key => {

      const item =
        countryLayers[key];


      item.layer.setStyle(

        getCountryStyle(
          item.countryCode,
          item.countryName
        )

      );

    });

}


// ========================================
// Leaflet地図
// ========================================

const map =
  L.map(
    'map',
    {
      zoomControl: true
    }
  )
  .setView(
    [20, 0],
    2
  );


// ========================================
// 背景地図
//
// opacity を下げて
// 国の色を見やすくする
// ========================================

L.tileLayer(
  'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  {

    maxZoom: 19,

    opacity:
      0.58,

    attribution:
      '&copy; OpenStreetMap'

  }
).addTo(map);


// ========================================
// 写真表示
// ========================================

function showPhoto(
  number,
  url
) {

  const preview =
    document.getElementById(
      `photoPreview${number}`
    );

  const placeholder =
    document.getElementById(
      `photoPlaceholder${number}`
    );


  if (
    url &&
    url.trim() !== ''
  ) {

    preview.src =
      url;

    preview
      .classList
      .remove('hidden');

    placeholder
      .classList
      .add('hidden');

  } else {

    preview.src =
      '';

    preview
      .classList
      .add('hidden');

    placeholder
      .classList
      .remove('hidden');

  }

}


// ========================================
// 写真選択時プレビュー
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
    !file.type.startsWith(
      'image/'
    )
  ) {

    alert(
      '画像ファイルを選択してください'
    );

    input.value =
      '';

    return;
  }


  const localUrl =
    URL.createObjectURL(
      file
    );


  showPhoto(
    number,
    localUrl
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
    .getElementById('food')
    .value = '';


  document
    .getElementById('memory')
    .value = '';


  document
    .getElementById('memo')
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
// 国データ読み込み
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
      .from('travel-app')
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


  // 過去データ対策
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


  // 未登録国
  if (!data) {

    selectedCountryCode =
      countryCode;

    return;
  }


  selectedCountryCode =
    data.country_code ||
    countryCode;


  // Date / City
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


  // Food
  document
    .getElementById('food')
    .value =
      data.food || '';


  // Memory
  document
    .getElementById('memory')
    .value =
      data.memory || '';


  // Memo
  document
    .getElementById('memo')
    .value =
      data.memo || '';


  // 写真
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


  if (
    !file.type.startsWith(
      'image/'
    )
  ) {

    throw new Error(
      '画像ファイルを選択してください'
    );
  }


  let extension =
    file.name
      .split('.')
      .pop()
      .toLowerCase();


  if (
    !extension ||
    extension === file.name
  ) {

    extension =
      'jpg';
  }


  const filePath =
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
        filePath,
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
        filePath
      );


  if (
    !data ||
    !data.publicUrl
  ) {

    throw new Error(
      '写真URLを取得できませんでした'
    );
  }


  return (
    data.publicUrl +
    '?v=' +
    Date.now()
  );

}


// ========================================
// GeoJSON / 世界地図
// ========================================

async function initializeMap() {

  // 先に訪問回数取得
  await loadVisitCounts();


  try {

    const response =
      await fetch(
        'countries.geo.json'
      );


    if (
      !response.ok
    ) {

      throw new Error(
        'countries.geo.jsonを読み込めませんでした'
      );
    }


    const data =
      await response.json();


    L.geoJSON(
      data,
      {

        // -----------------------------
        // 国の通常表示
        // -----------------------------

        style:
          function(feature) {

            const countryCode =
              getCountryCode(
                feature
              );

            const countryName =
              getCountryName(
                feature
              );


            return getCountryStyle(
              countryCode,
              countryName
            );

          },


        // -----------------------------
        // 国ごとの操作
        // -----------------------------

        onEachFeature:
          function(
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


            // 色更新用
            countryLayers[
              countryCode
            ] = {

              layer,
              countryCode,
              countryName

            };


            // ==========================
            // マウスを乗せた時
            // ==========================

            layer.on(
              'mouseover',
              function() {

                layer.setStyle({

                  color:
                    '#174f43',

                  weight:
                    2.4,

                  opacity:
                    1,

                  fillColor:
                    getCountryColor(
                      getVisitCount(
                        countryCode,
                        countryName
                      )
                    ),

                  fillOpacity:
                    0.98

                });


                // 国境を前面へ
                if (
                  layer.bringToFront
                ) {

                  layer.bringToFront();

                }

              }
            );


            // ==========================
            // マウスを外した時
            // ==========================

            layer.on(
              'mouseout',
              function() {

                layer.setStyle(

                  getCountryStyle(
                    countryCode,
                    countryName
                  )

                );

              }
            );


            // ==========================
            // 国クリック
            // ==========================

            layer.on(
              'click',
              async function() {

                selectedCountryCode =
                  countryCode;

                selectedCountryName =
                  countryName;


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


  } catch(error) {

    console.error(
      '地図読み込みエラー',
      error
    );

  }

}


// ========================================
// 保存
// ========================================

saveButton
  .addEventListener(
    'click',
    async function() {

      // 管理者本人確認
      const {
        data: {
          user
        }
      } =
        await supabaseClient
          .auth
          .getUser();


      if (
        !user ||
        user.id !==
          ADMIN_USER_ID
      ) {

        alert(
          '編集権限がありません'
        );

        return;
      }


      // 国未選択
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

        saveButton.innerHTML =
          '保存中...';


        // -----------------------------
        // 写真
        // -----------------------------

        let photoUrl1 =
          currentPhotoUrl1;

        let photoUrl2 =
          currentPhotoUrl2;


        const file1 =
          photoInput1.files[0];

        const file2 =
          photoInput2.files[0];


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


        // -----------------------------
        // 保存データ
        // -----------------------------

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
              .value ||
            null,

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
              .value ||
            null,

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
              .value ||
            null,

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
              .value ||
            null,

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
              .value ||
            null,

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


        // -----------------------------
        // Supabase保存
        // -----------------------------

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


        // -----------------------------
        // 写真URL更新
        // -----------------------------

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


        // -----------------------------
        // 地図色更新
        // -----------------------------

        await loadVisitCounts();


        // -----------------------------
        // 訪問国数更新
        // -----------------------------

        await loadCountryCount();


        alert(
          '保存しました！'
        );


      } catch(error) {

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


// ========================================
// 初期処理
// ========================================

// ログイン状態
checkLogin();

// 訪問国数
loadCountryCount();

// 地図
initializeMap();
