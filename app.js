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
// 状態
// ========================================

let selectedCountryCode = null;
let selectedCountryName = null;

let visitCounts = {};

// 国レイヤーを配列で管理
// 同じJPコードのFeatureが複数あっても対応
let countryLayers = [];

let currentPhotoUrl1 = null;
let currentPhotoUrl2 = null;

let isOwnerMode = false;


// ========================================
// HTML要素
// ========================================

const adminPanel =
  document.getElementById(
    'admin-panel'
  );

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

const deletePhoto1 =
  document.getElementById(
    'deletePhoto1'
  );

const deletePhoto2 =
  document.getElementById(
    'deletePhoto2'
  );


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
// 写真削除ボタン表示
// ========================================

function updateDeleteButtons() {

  if (deletePhoto1) {

    if (
      isOwnerMode &&
      currentPhotoUrl1
    ) {

      deletePhoto1.classList.remove(
        'hidden'
      );

      deletePhoto1.style.display =
        'flex';

    } else {

      deletePhoto1.classList.add(
        'hidden'
      );

      deletePhoto1.style.display =
        'none';

    }

  }


  if (deletePhoto2) {

    if (
      isOwnerMode &&
      currentPhotoUrl2
    ) {

      deletePhoto2.classList.remove(
        'hidden'
      );

      deletePhoto2.style.display =
        'flex';

    } else {

      deletePhoto2.classList.add(
        'hidden'
      );

      deletePhoto2.style.display =
        'none';

    }

  }

}


// ========================================
// 編集モード
// ========================================

function setEditMode(
  isOwner
) {

  isOwnerMode =
    isOwner;


  // 入力欄
  editFields.forEach(
    field => {

      field.disabled =
        !isOwner;

    }
  );


  // 写真選択ボタン
  document
    .querySelectorAll(
      '.photo-select-button'
    )
    .forEach(
      element => {

        element.style.display =
          isOwner
            ? 'flex'
            : 'none';

      }
    );


  if (isOwner) {

    if (adminPanel) {
      adminPanel.classList.remove(
        'hidden'
      );
    }

    if (loginArea) {
      loginArea.classList.add(
        'hidden'
      );
    }

    if (loggedInArea) {
      loggedInArea.classList.remove(
        'hidden'
      );
    }

    if (saveButton) {
      saveButton.classList.remove(
        'hidden'
      );
    }

    if (viewOnlyMessage) {
      viewOnlyMessage.classList.add(
        'hidden'
      );
    }

  } else {

    if (loggedInArea) {
      loggedInArea.classList.add(
        'hidden'
      );
    }

    if (saveButton) {
      saveButton.classList.add(
        'hidden'
      );
    }

    if (viewOnlyMessage) {
      viewOnlyMessage.classList.remove(
        'hidden'
      );
    }


    if (isAdminPage) {

      if (adminPanel) {
        adminPanel.classList.remove(
          'hidden'
        );
      }

      if (loginArea) {
        loginArea.classList.remove(
          'hidden'
        );
      }

    } else {

      if (adminPanel) {
        adminPanel.classList.add(
          'hidden'
        );
      }

      if (loginArea) {
        loginArea.classList.add(
          'hidden'
        );
      }

    }

  }


  updateDeleteButtons();

}


// ========================================
// ログイン状態確認
// ========================================

async function checkLogin() {

  const {
    data: { user },
    error
  } =
    await supabaseClient
      .auth
      .getUser();


  if (
    error ||
    !user
  ) {

    setEditMode(
      false
    );

    return;

  }


  const isOwner =
    isAdminPage &&
    user.id === ADMIN_USER_ID;


  setEditMode(
    isOwner
  );

}


// ========================================
// ログイン
// ========================================

const loginButton =
  document.getElementById(
    'loginButton'
  );

if (loginButton) {

  loginButton.addEventListener(
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
        data,
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
          'ログインエラー',
          error
        );

        alert(
          'ログインできませんでした。\n' +
          error.message
        );

        return;

      }


      if (
        !data.user ||
        data.user.id !==
          ADMIN_USER_ID
      ) {

        await supabaseClient
          .auth
          .signOut();

        setEditMode(
          false
        );

        alert(
          'このアカウントには編集権限がありません'
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

}


// ========================================
// ログアウト
// ========================================

const logoutButton =
  document.getElementById(
    'logoutButton'
  );

if (logoutButton) {

  logoutButton.addEventListener(
    'click',
    async function () {

      const {
        error
      } =
        await supabaseClient
          .auth
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


      setEditMode(
        false
      );

      alert(
        'ログアウトしました'
      );

    }
  );

}


// ========================================
// 国名取得
// ========================================

function getCountryName(
  feature
) {

  return (
    feature.properties?.name ||
    feature.properties?.ADMIN ||
    feature.properties?.NAME ||
    'Unknown'
  );

}


// ========================================
// 国コード取得
// ========================================

function getCountryCode(
  feature
) {

  return (

    feature.properties?.[
      'ISO3166-1-Alpha-2'
    ] ||

    feature.properties?.ISO_A2 ||

    feature.properties?.iso_a2 ||

    feature.properties
      ?.ISO3166_1_Alpha_2 ||

    getCountryName(
      feature
    )

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

    visitCounts[
      countryCode
    ] ??

    visitCounts[
      countryName
    ] ??

    0

  );

}


// ========================================
// 訪問回数による色
// ========================================

function getCountryColor(
  count
) {

  if (count >= 5) {
    return '#0f4f3f';
  }

  if (count === 4) {
    return '#24705c';
  }

  if (count === 3) {
    return '#4a9b83';
  }

  if (count === 2) {
    return '#7cc5ad';
  }

  if (count === 1) {
    return '#b8e3d5';
  }

  return '#e8ecea';

}


// ========================================
// 選択中か
// ========================================

function isSelectedCountry(
  countryCode
) {

  return (
    selectedCountryCode !== null &&
    countryCode ===
      selectedCountryCode
  );

}


// ========================================
// 国スタイル
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


  const selected =
    isSelectedCountry(
      countryCode
    );


  // 選択中
  if (selected) {

    return {

      color:
        '#174f43',

      weight:
        3,

      opacity:
        1,

      fillColor:
        getCountryColor(
          count
        ),

      fillOpacity:
        count > 0
          ? 0.95
          : 0.62

    };

  }


  // 未選択
  return {

    color:
      '#9da9a5',

    weight:
      0.8,

    opacity:
      0.8,

    fillColor:
      getCountryColor(
        count
      ),

    fillOpacity:
      count > 0
        ? 0.9
        : 0.52

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
      .from(
        'travel-app'
      )
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


  data.forEach(
    record => {

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

    }
  );


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
// 訪問回数読み込み
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
            date => Boolean(date)
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
// すべての国のスタイル更新
//
// 同じJPコードのFeatureが複数でも
// 全部まとめて更新される
// ========================================

function updateMapColors() {

  countryLayers.forEach(
    item => {

      item.layer.setStyle(

        getCountryStyle(
          item.countryCode,
          item.countryName
        )

      );

    }
  );

}


// ========================================
// 世界地図の範囲
// ========================================

const worldBounds =
  L.latLngBounds(
    [
      [-85, -180],
      [85, 180]
    ]
  );


// ========================================
// 地図作成
// ========================================

const map =
  L.map(
    'map',
    {

      zoomControl:
        true,

      // 世界の外へ移動しない
      maxBounds:
        worldBounds,

      maxBoundsViscosity:
        1.0,

      worldCopyJump:
        false,

      zoomSnap:
        0.25,

      zoomDelta:
        0.5

    }
  );


// ========================================
// OpenStreetMapは使わない
//
// 海の色だけ設定
// ========================================

const mapElement =
  document.getElementById(
    'map'
  );

if (mapElement) {

  mapElement.style.background =
    '#c8e3e8';

}


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
    !preview ||
    !placeholder
  ) {

    return;

  }


  if (
    url &&
    url.trim() !== ''
  ) {

    preview.src =
      url;

    preview.classList.remove(
      'hidden'
    );

    placeholder.classList.add(
      'hidden'
    );

  } else {

    preview.src =
      '';

    preview.classList.add(
      'hidden'
    );

    placeholder.classList.remove(
      'hidden'
    );

  }


  updateDeleteButtons();

}


// ========================================
// 写真選択プレビュー
// ========================================

function setLocalPhotoPreview(
  input,
  number
) {

  const file =
    input?.files?.[0];


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


if (photoInput1) {

  photoInput1.addEventListener(
    'change',
    function () {

      setLocalPhotoPreview(
        photoInput1,
        1
      );

    }
  );

}


if (photoInput2) {

  photoInput2.addEventListener(
    'change',
    function () {

      setLocalPhotoPreview(
        photoInput2,
        2
      );

    }
  );

}


// ========================================
// フォーム初期化
// ========================================

function clearForm() {

  for (
    let i = 1;
    i <= 5;
    i++
  ) {

    const date =
      document.getElementById(
        `visitDate${i}`
      );

    const city =
      document.getElementById(
        `visitCity${i}`
      );


    if (date) {
      date.value = '';
    }

    if (city) {
      city.value = '';
    }

  }


  const food =
    document.getElementById(
      'food'
    );

  const memory =
    document.getElementById(
      'memory'
    );

  const memo =
    document.getElementById(
      'memo'
    );


  if (food) {
    food.value = '';
  }

  if (memory) {
    memory.value = '';
  }

  if (memo) {
    memo.value = '';
  }


  if (photoInput1) {
    photoInput1.value = '';
  }

  if (photoInput2) {
    photoInput2.value = '';
  }


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


  // 国コードで見つからなかった場合
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


  // 未登録国
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

    const date =
      document.getElementById(
        `visitDate${i}`
      );

    const city =
      document.getElementById(
        `visitCity${i}`
      );


    if (date) {

      date.value =
        data[
          `visit_date_${i}`
        ] || '';

    }


    if (city) {

      city.value =
        data[
          `visit_city_${i}`
        ] || '';

    }

  }


  const food =
    document.getElementById(
      'food'
    );

  const memory =
    document.getElementById(
      'memory'
    );

  const memo =
    document.getElementById(
      'memo'
    );


  if (food) {
    food.value =
      data.food || '';
  }

  if (memory) {
    memory.value =
      data.memory || '';
  }

  if (memo) {
    memo.value =
      data.memo || '';
  }


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


  updateDeleteButtons();

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
// 写真削除
// ========================================

async function deleteStoredPhoto(
  number
) {

  const {
    data: { user }
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


  if (
    !selectedCountryCode
  ) {

    alert(
      '先に国を選択してください'
    );

    return;

  }


  const currentUrl =
    number === 1
      ? currentPhotoUrl1
      : currentPhotoUrl2;


  if (!currentUrl) {

    alert(
      '削除する写真がありません'
    );

    return;

  }


  const confirmed =
    confirm(
      `写真${number}を削除しますか？`
    );


  if (!confirmed) {
    return;
  }


  try {

    const cleanUrl =
      currentUrl
        .split('?')[0];


    const fileName =
      cleanUrl
        .split('/')
        .pop();


    const filePath =
      `${selectedCountryCode}/${fileName}`;


    // Storageから削除
    const {
      error: storageError
    } =
      await supabaseClient
        .storage
        .from(
          'travel-photos'
        )
        .remove([
          filePath
        ]);


    if (
      storageError
    ) {

      throw storageError;

    }


    // DB側URLをnull
    const updateData =
      number === 1

        ? {
            photo_url_1:
              null
          }

        : {
            photo_url_2:
              null
          };


    const {
      error: dbError
    } =
      await supabaseClient
        .from(
          'travel-app'
        )
        .update(
          updateData
        )
        .eq(
          'country_code',
          selectedCountryCode
        );


    if (
      dbError
    ) {

      throw dbError;

    }


    if (
      number === 1
    ) {

      currentPhotoUrl1 =
        null;

      if (photoInput1) {
        photoInput1.value = '';
      }

    } else {

      currentPhotoUrl2 =
        null;

      if (photoInput2) {
        photoInput2.value = '';
      }

    }


    showPhoto(
      number,
      null
    );


    updateDeleteButtons();


    alert(
      `写真${number}を削除しました`
    );


  } catch (
    error
  ) {

    console.error(
      '写真削除エラー',
      error
    );


    alert(
      '写真の削除に失敗しました。\n' +
      (
        error.message ||
        'エラーが発生しました'
      )
    );

  }

}


// ========================================
// 写真削除ボタン
// ========================================

if (deletePhoto1) {

  deletePhoto1.addEventListener(
    'click',
    async function () {

      await deleteStoredPhoto(
        1
      );

    }
  );

}


if (deletePhoto2) {

  deletePhoto2.addEventListener(
    'click',
    async function () {

      await deleteStoredPhoto(
        2
      );

    }
  );

}


// ========================================
// 地図初期化
// ========================================

async function initializeMap() {

  await loadVisitCounts();


  try {

    // ====================================
    // 新しいGeoJSONを読み込む
    //
    // ?v= はキャッシュ回避
    // ====================================

    const response =
      await fetch(
        'countries-japan-government-position.geo.json?v=20261002-3',
        {
          cache:
            'no-store'
        }
      );


    if (
      !response.ok
    ) {

      throw new Error(
        'GeoJSONを読み込めませんでした。HTTP ' +
        response.status
      );

    }


    const data =
      await response.json();


    // 以前のレイヤー情報を初期化
    countryLayers = [];


    const geoJsonLayer =
      L.geoJSON(
        data,
        {

          // ------------------------------
          // 国の通常スタイル
          // ------------------------------

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


              return getCountryStyle(
                countryCode,
                countryName
              );

            },


          // ------------------------------
          // 国ごとの処理
          // ------------------------------

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


              // 配列へ追加
              // 同じJPが複数あっても保持
              countryLayers.push({

                layer:
                  layer,

                countryCode:
                  countryCode,

                countryName:
                  countryName

              });


              // ==================================
              // Hover
              //
              // 見た目は変更しない
              // ==================================

              layer.on(
                'mouseover',
                function () {

                  layer.setStyle(

                    getCountryStyle(
                      countryCode,
                      countryName
                    )

                  );

                }
              );


              // ==================================
              // Hover解除
              // ==================================

              layer.on(
                'mouseout',
                function () {

                  layer.setStyle(

                    getCountryStyle(
                      countryCode,
                      countryName
                    )

                  );

                }
              );


              // ==================================
              // 国クリック
              // ==================================

              layer.on(
                'click',
                async function () {

                  selectedCountryCode =
                    countryCode;

                  selectedCountryName =
                    countryName;


                  // 全Featureを再描画
                  // 同じJPコードは全部太枠になる
                  updateMapColors();


                  const nameElement =
                    document
                      .getElementById(
                        'selected-country-name'
                      );


                  if (
                    nameElement
                  ) {

                    nameElement.textContent =
                      countryName;

                  }


                  await loadCountryData(
                    countryCode,
                    countryName
                  );


                  // DB読み込み後も再描画
                  updateMapColors();

                }
              );

            }

        }
      )
      .addTo(
        map
      );


    // ====================================
    // 世界全体を1つだけ表示
    // ====================================

    const geoBounds =
      geoJsonLayer.getBounds();


    if (
      geoBounds.isValid()
    ) {

      map.fitBounds(
        geoBounds,
        {
          padding:
            [8, 8],

          animate:
            false
        }
      );


      // 現在の世界表示ズームを
      // 最小ズームにする
      const initialZoom =
        map.getZoom();


      map.setMinZoom(
        initialZoom
      );

    } else {

      map.fitBounds(
        worldBounds
      );

    }


    map.setMaxBounds(
      worldBounds
    );


    updateMapColors();


  } catch (
    error
  ) {

    console.error(
      '地図読み込みエラー',
      error
    );


    alert(
      '地図の読み込みに失敗しました。\n' +
      error.message
    );

  }

}


// ========================================
// 保存
// ========================================

if (saveButton) {

  saveButton.addEventListener(
    'click',
    async function () {

      const {
        data: { user }
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


        let photoUrl1 =
          currentPhotoUrl1;

        let photoUrl2 =
          currentPhotoUrl2;


        const file1 =
          photoInput1
            ?.files?.[0];

        const file2 =
          photoInput2
            ?.files?.[0];


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


        const getValue =
          id => {

            const element =
              document.getElementById(
                id
              );

            return element
              ? element.value
              : '';

          };


        const record = {

          country_code:
            selectedCountryCode,

          country_name:
            selectedCountryName,


          visit_date_1:
            getValue(
              'visitDate1'
            ) || null,

          visit_city_1:
            getValue(
              'visitCity1'
            ),


          visit_date_2:
            getValue(
              'visitDate2'
            ) || null,

          visit_city_2:
            getValue(
              'visitCity2'
            ),


          visit_date_3:
            getValue(
              'visitDate3'
            ) || null,

          visit_city_3:
            getValue(
              'visitCity3'
            ),


          visit_date_4:
            getValue(
              'visitDate4'
            ) || null,

          visit_city_4:
            getValue(
              'visitCity4'
            ),


          visit_date_5:
            getValue(
              'visitDate5'
            ) || null,

          visit_city_5:
            getValue(
              'visitCity5'
            ),


          food:
            getValue(
              'food'
            ),

          memory:
            getValue(
              'memory'
            ),

          memo:
            getValue(
              'memo'
            ),


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


        if (
          error
        ) {

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


        if (photoInput1) {
          photoInput1.value = '';
        }

        if (photoInput2) {
          photoInput2.value = '';
        }


        updateDeleteButtons();


        await loadVisitCounts();

        await loadCountryCount();


        updateMapColors();


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

}


// ========================================
// 初期処理
// ========================================

checkLogin();

loadCountryCount();

initializeMap();
