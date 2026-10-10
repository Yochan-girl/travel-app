
 // ========================================
 // Leaflet 地図
 // ========================================

const map = L.map('map', {
  zoomControl: true,

  // 世界地図を繰り返さない
  worldCopyJump: false,

  // 地図の移動範囲を制限
  maxBounds: [
    [-85.0511, -180],
    [85.0511, 180]
  ],

  maxBoundsViscosity: 1.0,

  // 細かいズーム調整
  zoomSnap: 0.01,
  zoomDelta: 0.5,

  maxZoom: 8
});

// ========================================
// OpenStreetMap
// ========================================

L.tileLayer(
  'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  {
    maxZoom: 19,

    // 左右の地図の繰り返しを防止
    noWrap: true,

    opacity: 0.58,

    attribution: '&copy; OpenStreetMap'
  }
).addTo(map);

// ========================================
// 世界地図の自動サイズ調整
// ========================================

function fitWorldMap() {

  // 地図の表示サイズを再取得
  map.invalidateSize({
    pan: false
  });

  // 世界地図の表示範囲
  const worldBounds = L.latLngBounds(
    [-85, -180],
    [85, 180]
  );

  // PC・スマホの表示領域に合わせる
  const fitZoom = map.getBoundsZoom(
    worldBounds,
    false,
    L.point(4, 4)
  );

  // 世界全体を表示できる最小ズーム
  map.setMinZoom(fitZoom);

  // 地図の中心とズームを設定
  map.setView(
    [0, 0],
    fitZoom,
    {
      animate: false
    }
  );
}

// ========================================
// 初期表示
// ========================================

fitWorldMap();

// ========================================
// PC・スマホの画面サイズ変更
// ========================================

let mapResizeTimer;

window.addEventListener(
  'resize',
  function () {

    clearTimeout(mapResizeTimer);

    mapResizeTimer = setTimeout(
      function () {
        fitWorldMap();
      },
      150
    );

  }
);
