const width = 500;
const height = 400;
const svg = d3.select("#mapSvg");

const projection = d3.geoMercator()
  .scale(75)
  .translate([width / 2, height / 2]);

const path = d3.geoPath().projection(projection);

// 背景画像を追加
svg.append("image")
  .attr("xlink:href", "img/黒 WQHD.png")
  .attr("x", 0)
  .attr("y", 0)
  .attr("width", width)
  .attr("height", height)
  .lower();

// 地図データの読み込みと描画
d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson")
  .then(function (data) {
    svg.selectAll("path")
      .data(data.features)
      .enter()
      .append("path")
      .attr("d", path)
      .attr("fill", "none")
      .attr("stroke", "#00ffe0")
      .attr("stroke-width", 0.1);

    const geoGrid = [];

    // 緯線（−80〜80度、10度刻み）
    for (let lat = -80; lat <= 80; lat += 10) {
      geoGrid.push({
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: Array.from({ length: 37 }, (_, i) => [-180 + i * 10, lat])
        }
      });
    }

    // 経線（−180〜180度、10度刻み）
    for (let lon = -180; lon <= 180; lon += 10) {
      geoGrid.push({
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: Array.from({ length: 17 }, (_, i) => [lon, -80 + i * 10])
        }
      });
    }


    // 描画
    svg.selectAll(".geo-grid")
      .data(geoGrid)
      .enter()
      .append("path")
      .attr("class", "geo-grid")
      .attr("d", path)
      .attr("stroke", "#666")
      .attr("stroke-width", 0.3)
      .attr("fill", "none");
    // 時計
    svg.append("text")
      .attr("id", "dateTimeText")
      .attr("x", 10)
      .attr("y", 20)
      .attr("fill", "#fff")
      .attr("font-size", "12px")
      .text(""); // 初期は空
  });

const zoom = d3.zoom()
  .scaleExtent([1, 200]); // 最小1倍〜最大200倍

function handleZoom(event) {
  svg.selectAll("image").attr("transform", event.transform);
  svg.selectAll("path").attr("transform", event.transform);
  svg.selectAll("circle").attr("transform", event.transform);
  svg.selectAll(".geo-grid").attr("transform", event.transform);
}
svg.call(zoom.on("zoom", handleZoom));

// 🌍 状態管理
let autoMode = false;
let intervalId = null;

// 🌦️ 天気取得関数
function fetchWeather(lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;

  fetch(url)
    .then(res => res.json())
    .then(data => {
      const weather = data.current_weather;
      // 🧠 天気コード変換テーブル
      const weatherCodeMap = {
        0: "CLEAR",
        1: "MAINLY CLEAR",
        2: "PARTLY CLOUDY",
        3: "OVERCAST",
        45: "FOG",
        48: "DEPOSITING FOG",
        51: "LIGHT DRIZZLE",
        61: "LIGHT RAIN",
        71: "LIGHT SNOW",
        80: "RAIN SHOWERS",
        95: "THUNDERSTORM"
      };

      const description = weatherCodeMap[weather.weathercode] || `CODE ${weather.weathercode}`;

      document.getElementById("location").textContent = `Lat: ${lat}, Lon: ${lon}`;
      document.getElementById("temp").textContent = `Temp: ${weather.temperature}°C`;
      document.getElementById("condition").textContent = `Condition: ${description}`;
      document.getElementById("wind").textContent = `Wind: ${weather.windspeed} m/s`;
    })
    .catch(err => console.error("API error:", err));
}

// 🎯 ランダム座標生成
function getRandomCoordinates(bounds) {
  const lat = bounds.south + Math.random() * (bounds.north - bounds.south);
  const lon = bounds.west + Math.random() * (bounds.east - bounds.west);
  return { lat: lat.toFixed(6), lon: lon.toFixed(6) };
}

// 🔁 自動取得処理
function fetchCoordinates() {
  const bounds = {
    north: 70.0,
    south: -70.0,
    east: 170.0,
    west: -170.0
  };
  const { lat, lon } = getRandomCoordinates(bounds);
  fetchWeather(lat, lon);
  const screenCoords = projection([parseFloat(lon), parseFloat(lat)]);
  const [x, y] = screenCoords;

  svg.append("circle")
    .attr("cx", x)
    .attr("cy", y)
    .attr("class", "glow")
    .on("animationend", function () { d3.select(this).remove(); });
}

// 🖱️ 地図クリック（手動モード時のみ）
svg.on("click", function (event) {
  if (!autoMode) {
    const [x, y] = d3.pointer(event);
    const transform = d3.zoomTransform(svg.node());
    const [tx, ty] = transform.invert([x, y]); // ズーム・パンの逆変換
    const coords = projection.invert([tx, ty]);
    const lat = coords[1].toFixed(4);
    const lon = coords[0].toFixed(4);

    svg.append("circle")
      .attr("cx", x)
      .attr("cy", y)
      .attr("class", "glow")
      .on("animationend", function () { d3.select(this).remove(); });

    fetchWeather(lat, lon);
  }
});


// 📝 手動フォーム送信（手動モード時のみ）
document.getElementById("manualForm").addEventListener("submit", function (e) {
  e.preventDefault();
  if (!autoMode) {
    const lat = document.getElementById("manualLat").value;
    const lon = document.getElementById("manualLon").value;
    fetchWeather(lat, lon);
  }
});

// 🔘 モード切り替えボタン
document.getElementById("toggleMode").addEventListener("click", function () {
  autoMode = !autoMode;
  if (autoMode) {
    this.innerHTML = '<span class="glow-text auto-button-2">AUTO</span>';
    intervalId = setInterval(fetchCoordinates, 3000);

    // 🌍 ズームとパンを初期状態に戻す
    svg.transition()
      .duration(750)
      .call(zoom.transform, d3.zoomIdentity);

    // 🚫 ズーム・パンを禁止
    svg.on(".zoom", null);
  } else {
    this.innerHTML = '<span class="auto-button">AUTO</span>';
    clearInterval(intervalId);

    // ✅ ズーム・パンを再有効化
    svg.call(zoom.on("zoom", handleZoom));
  }
});

// 初期化：グラフ描画
function initChart() {
  const ctx = document.getElementById('trafficChart').getContext('2d');
  // すでにグラフが存在していたら破棄
  if (window.trafficChart && typeof window.trafficChart.destroy === 'function') {
    window.trafficChart.destroy();
  }
  window.trafficChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['10:23', '10:24', '10:25', '10:26'],
      datasets: [{
        label: 'Throughput (MB/s)',
        data: [30, 45, 38, 50],
        borderColor: '#00ffff',
        backgroundColor: 'rgba(0,255,255,0.1)',
        fill: true,
        tension: 0.3
      }]
    },
    options: {
      scales: {
        x: { ticks: { color: '#cceeff' } },
        y: { ticks: { color: '#cceeff' } }
      },
      plugins: {
        legend: { labels: { color: '#cceeff' } }
      }
    }
  });
}

// ターゲット移動処理
function moveTarget(targetId, angleDegrees, radius) {
  const target = document.getElementById(targetId);
  const angle = angleDegrees * (Math.PI / 180);
  const centerX = 100;
  const centerY = 100;
  const x = centerX + radius * Math.cos(angle);
  const y = centerY + radius * Math.sin(angle);
  target.setAttribute("cx", x);
  target.setAttribute("cy", y);
}

// Threat Matrix に脅威を追加
function addThreat(id, type, severity) {
  const threatList = document.getElementById('threat-list');
  const li = document.createElement('li');
  li.innerHTML = `<strong>${id}</strong> – ${type} – <span class="${severity.toLowerCase()}">Severity: ${severity}</span>`;
  threatList.appendChild(li);

  if (threatList.children.length > 10) {
    threatList.removeChild(threatList.firstChild);
  }
}

// タイムスタンプ生成
function getTimestamp() {
  const now = new Date();
  return `[${now.toLocaleTimeString('en-GB')}]`;
}

// ログ追加処理（すべての連動を統合）
function addLogEntry() {
  const logMessages = [
    "Connection established to node #A17",
    "Handshake protocol completed",
    "Data stream initiated (Protocol: AES-256)",
    "Packet integrity verified",
    "Incoming request from IP: 192.168.0.254",
    "Authentication success (User: admin)",
    "Command executed: /sys/scan --deep",
    "Anomaly detected: ID#A47X (Severity: Medium)",
    "Alert dispatched to monitoring node #B03",
    "Response protocol initiated",
    "Threat containment procedure active",
    "Status: STABLE / Monitoring continues",
    "Critical breach detected: ID#X99Z (Severity: High)"
  ];

  const message = logMessages[Math.floor(Math.random() * logMessages.length)];
  const timestamp = getTimestamp();
  const logContainer = document.getElementById('event-log');
  const li = document.createElement('li');
  li.textContent = `${timestamp} ${message}`;
  logContainer.appendChild(li);
  if (logContainer.children.length > 50) {
    logContainer.removeChild(logContainer.firstChild);
  }

  logContainer.scrollTop = logContainer.scrollHeight;

  // レーダー反応
  const radarPanel = document.getElementById('radar-panel');
  const targetDot = document.getElementById('target-dot');
  if (message.includes("Critical breach detected")) {
    radarPanel.classList.add("radar-alert");
    targetDot.classList.add("blinking");
    setTimeout(() => {
      radarPanel.classList.remove("radar-alert");
      targetDot.classList.remove("blinking");
    }, 5000);

    // Threat Matrix に重大な脅威を追加
    addThreat("ID#" + Math.floor(Math.random() * 1000), "System Breach", "High");
  }
  if (message.includes("Anomaly detected")) {
    radarPanel.classList.add("radar-alert");
    targetDot.classList.add("blinking");
    setTimeout(() => {
      radarPanel.classList.remove("radar-alert");
      targetDot.classList.remove("blinking");
    }, 5000);

    // Threat Matrix に追加
    addThreat("ID#" + Math.floor(Math.random() * 1000), "Cyber Intrusion", "Medium");
  }
  if (message.includes("Critical breach detected")) {
    radarPanel.classList.add("radar-alert");
    targetDot.classList.add("blinking");
    setTimeout(() => {
      radarPanel.classList.remove("radar-alert");
      targetDot.classList.remove("blinking");
    }, 5000);

    // Threat Matrix に重大な脅威を追加
    addThreat("ID#" + Math.floor(Math.random() * 1000), "System Breach", "High");
  }

  // グラフ更新
  const label = timestamp.slice(1, 6);
  let value = Math.floor(Math.random() * 40) + 30;
  if (message.includes("Anomaly detected")) {
    value += 50;
  }

  trafficChart.data.labels.push(label);
  trafficChart.data.datasets[0].data.push(value);
  if (trafficChart.data.labels.length > 20) {
    trafficChart.data.labels.shift();
    trafficChart.data.datasets[0].data.shift();
  }
  trafficChart.update();
}

// ターゲット移動ループ
let angle1 = 0;
let angle2 = 180;
setInterval(() => {
  moveTarget("target1", angle1, 40);
  moveTarget("target2", angle2, 70);
  angle1 = (angle1 + 5) % 360;
  angle2 = (angle2 + 3) % 360;
}, 100);

// 初期化とログ更新開始
document.addEventListener('DOMContentLoaded', () => {
  // すでにグラフが存在していたら破棄
  if (window.trafficChart && typeof window.trafficChart.destroy === 'function') {
    window.trafficChart.destroy();
  }
  initChart();
  setInterval(addLogEntry, 3000);
});
function updateSystemStatus() {
  const cpu = Math.floor(Math.random() * 40) + 30; // 30〜70%
  const memUsed = (Math.random() * 12 + 2).toFixed(1); // 2〜14GB
  const biosVersions = ["A17X-3.4.2", "B03Z-5.1.0", "C88Y-2.9.8"];
  const biosDates = ["2025-03-12", "2024-11-08", "2023-07-21"];
  const makers = ["CyberCore Systems", "NeuroTek Labs", "QuantumForge"];

  // ゲージの更新（style.width と表示テキスト）
  document.getElementById('gauge-cpu').style.width = `${cpu}%`;
  document.getElementById('val-cpu').textContent = `${cpu}%`;
  document.getElementById('cpu-usage').textContent = `${cpu}%`;

  const temp = Math.floor(Math.random() * 30) + 40;
  document.getElementById('gauge-temp').style.width = `${temp}%`;
  document.getElementById('val-temp').textContent = `${temp}°C`;

  const memPercent = Math.floor((memUsed / 16) * 100);
  document.getElementById('gauge-mem').style.width = `${memPercent}%`;
  document.getElementById('val-mem').textContent = `${memUsed} / 16 GB`;
  document.getElementById('memory-usage').textContent = `${memUsed} / 16 GB`;

  const threat = Math.floor(Math.random() * 30);
  document.getElementById('gauge-threat').style.width = `${threat}%`;
  document.getElementById('val-threat').textContent = `${threat}%`;

  const disk = Math.floor(Math.random() * 50) + 40;
  document.getElementById('gauge-disk').style.width = `${disk}%`;
  document.getElementById('val-disk').textContent = `${disk}%`;

  // BIOS情報の更新
  document.getElementById('bios-version').textContent = biosVersions[Math.floor(Math.random() * biosVersions.length)];
  document.getElementById('bios-date').textContent = biosDates[Math.floor(Math.random() * biosDates.length)];
  document.getElementById('bios-maker').textContent = makers[Math.floor(Math.random() * makers.length)];
}

// 2秒ごとに更新
setInterval(updateSystemStatus, 2000);
function updateMetricsPanel() {
  const cpu = Math.floor(Math.random() * 40) + 30;
  const temp = Math.floor(Math.random() * 30) + 40;
  const mem = Math.floor(Math.random() * 60) + 20;
  const threat = Math.floor(Math.random() * 30);
  const disk = Math.floor(Math.random() * 50) + 40;

  const metrics = [
    { id: 'cpu', value: cpu, suffix: '%' },
    { id: 'temp', value: temp, suffix: '°C' },
    { id: 'mem', value: mem, suffix: '%' },
    { id: 'threat', value: threat, suffix: '%' },
    { id: 'disk', value: disk, suffix: '%' }
  ];

  metrics.forEach(m => {
    const bar = document.getElementById(`gauge-${m.id}`);
    const label = document.getElementById(`val-${m.id}`);
    if (bar && label) {
      bar.style.width = `${m.value}%`;
      label.textContent = `${m.value}${m.suffix}`;
    }
  });
}

// 初期化時に追加
document.addEventListener('DOMContentLoaded', () => {
  // すでにグラフが存在していたら破棄
  if (window.trafficChart && typeof window.trafficChart.destroy === 'function') {
    window.trafficChart.destroy();
  }
  initChart();
  setInterval(addLogEntry, 3000);
  setInterval(updateSystemStatus, 5000);
  setInterval(updateMetricsPanel, 3000); // ← これが必要
});
const mapImages = [
  "img/地球のモニター映像.png",
  "img/9765538-1.jpg",
  "img/9765538-2.jpg",
  "img/AKDP周辺.png",
];
let currentIndex = 0;

// グローバルスコープで関数を定義
function updateMap() {
  const img = document.getElementById("world-map-image");
  if (!img) {
    console.error("画像要素が見つかりません");
    return;
  }
  setTimeout(() => {
    img.src = mapImages[currentIndex];
  });
}
function nextMap() {
  currentIndex = (currentIndex + 1) % mapImages.length;
  updateMap();
}

function prevMap() {
  currentIndex = (currentIndex - 1 + mapImages.length) % mapImages.length;
  updateMap();
}

// メインの初期化処理に統合
document.addEventListener('DOMContentLoaded', () => {
  // すでにグラフが存在していたら破棄
  if (window.trafficChart && typeof window.trafficChart.destroy === 'function') {
    window.trafficChart.destroy();
  }
  initChart();
  setInterval(addLogEntry, 3000);
  setInterval(updateSystemStatus, 5000);
  setInterval(updateMetricsPanel, 3000);

  // マップ切り替え機能の初期化
  const img = document.getElementById("world-map-image");
  if (img) {
    updateMap(); // 初期画像の設定
  }
});

// 日付と時刻
function updateDateTime() {
  const now = new Date();
  const formatted = now.toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });

  // SVG内に表示する場合
  d3.select("#dateTimeText").text(formatted);

  // HTML側に表示する場合
  const display = document.getElementById("dateTimeDisplay");
  if (display) display.textContent = formatted;
}

// 初回表示
updateDateTime();

// 1秒ごとに更新
setInterval(updateDateTime, 1000);

// サークルゲージ
function initGauge(selector, percent, radius) {
  const circle = document.querySelector(selector);
  const circumference = 2 * Math.PI * radius;

  circle.setAttribute("stroke-dasharray", circumference);
  circle.setAttribute("stroke-dashoffset", circumference);

  setTimeout(() => {
    const offset = circumference * (1 - percent / 100);
    circle.setAttribute("stroke-dashoffset", offset);
  }, 100);
}

function updateGauge(selector, percent, radius) {
  const circle = document.querySelector(selector);
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - percent / 100);

  circle.setAttribute("stroke-dasharray", circumference);
  circle.setAttribute("stroke-dashoffset", offset);
}

document.addEventListener("DOMContentLoaded", () => {
  // 起動時アニメーション
  initGauge(".fg1", 45, 54);
  initGauge(".fg2", 67, 48);
  initGauge(".fg3", 23, 42);

  // 定期更新（ダミー）
  setInterval(() => {
    updateGauge(".fg1", Math.floor(Math.random() * 100), 54);
    updateGauge(".fg2", Math.floor(Math.random() * 100), 48);
    updateGauge(".fg3", Math.floor(Math.random() * 100), 42);
  }, 2000);
});

document.body.style.backgroundImage = "url('img/cyber-background.png')";

function changeBackground() {
  document.body.style.backgroundImage = "url('img/DSC_0412.webp')";
}

function greenBackground() {
  document.body.style.backgroundImage = "url('img/黒背景.png')";
}

function defaultsBackground() {
  document.body.style.backgroundImage = "url('img/cyber-background.png')";
}

function handleSubmit(event) {
  event.preventDefault();
  const mapImage = document.getElementById("world-map-image");
  const input = document.getElementById("micaInput").value.trim().toLowerCase();
  const header = document.getElementById("micaHeader");
  const foxKeywords = ["fox", "きつね", "狐", "ミカ", "赤い動物"]; // ヘッダーの色変更（例）
  const luciferKeywords = ["lucifer", "ルシファー", "rusifa-", "rusifa"];
  const wyvernKeywords = ["wyvern", "ワイバーン", "waiba-nn"];
  const krakenKeywords = ["kraken", "クラーケン"];
  const porterKeywords = ["porter", "ポーター"];

  mapImage.classList.add("warp-effect");
  setTimeout(() => {
    mapImage.classList.remove("warp-effect");
  }, 1500); // 1.5秒後に解除

  // ヘッダーの色変更（例）
  if (foxKeywords.includes(input)) {
    header.style.backgroundColor = "#ffa07a";
  } else {
    header.style.backgroundColor = "";
  }

  // 隠し画像の表示
  if (luciferKeywords.includes(input)) {
    mapImage.src = "img/lucifer_1.5.png"; // ← ここに隠し画像のパスを入れてね
    mapImage.alt = "隠された世界";
  } else if (wyvernKeywords.includes(input)) {
    mapImage.src = "img/wyvern_s.png"; // ← ここに隠し画像のパスを入れてね
    mapImage.alt = "謎の世界";
  } else if (krakenKeywords.includes(input)) {
    mapImage.src = "img/kraken_1.2.png"; // ← ここに隠し画像のパスを入れてね
    mapImage.alt = "自衛の世界";
  } else if (porterKeywords.includes(input)) {
    mapImage.src = "img/porter_1.0.JPG"; // ← ここに隠し画像のパスを入れてね
    mapImage.alt = "鳩の世界";
  } else {
    mapImage.src = "img/地球のモニター映像.png"; // 元の画像に戻す
    mapImage.alt = "世界地図";
  }
}

// CSV読み込みのメイン処理
document.getElementById('upload-csv').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    Papa.parse(file, {
        skipEmptyLines: true, // 空白行を無視
        complete: function(results) {
            // 1行目をラベル、2行目をデータとして取得
            const labels = results.data[0];
            const values = results.data[1].map(v => parseFloat(v));

            // 数値が正しく読み込めているか確認
            if (labels.length > 0 && !isNaN(values[0])) {
                initEnvironmentalChart(labels, values);
            } else {
                console.error("CSVデータの形式が正しくありません。");
            }
        }
    });
});

function initEnvironmentalChart(labels, dataValues) {
    const ctx = document.getElementById('radarChart').getContext('2d');
    
    // 既存のチャートがある場合は確実に破棄してメモリを解放
    if (window.envRadarChart instanceof Chart) {
        window.envRadarChart.destroy();
    }

    // チャートの生成
    window.envRadarChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: labels,
            datasets: [{
                label: 'ENVIRONMENTAL SCAN',
                data: dataValues,
                backgroundColor: 'rgba(0, 242, 255, 0.15)',
                borderColor: '#00f2ff',
                pointBackgroundColor: '#00f2ff',
                pointBorderColor: '#fff',
                pointHoverRadius: 5,
                borderWidth: 2,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                r: {
                    angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    pointLabels: {
                        color: '#00f2ff',
                        font: { size: 11, family: "'Share Tech Mono', monospace" }
                    },
                    ticks: { display: false },
                    suggestedMin: 0,
                    suggestedMax: 100
                }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}
// ページ読み込み完了時に自動的にCSVを取得する
window.addEventListener('DOMContentLoaded', () => {
    // ファイルパスを指定（index.htmlと同じ階層にある想定）
    const csvFilePath = 'environment_data.csv';

    Papa.parse(csvFilePath, {
        download: true,         // 外部ファイルをダウンロードして読み込む
        header: false,          // 1行目をヘッダーとして扱わず配列で取得
        skipEmptyLines: true,
        complete: function(results) {
            if (results.data && results.data.length >= 2) {
                const labels = results.data[0];
                const values = results.data[1].map(v => parseFloat(v));
                
                // 既に作成した描画関数を呼び出す
                initEnvironmentalChart(labels, values);
                console.log("Environment data loaded automatically.");
            }
        },
        error: function(err) {
            console.warn("自動読み込み待ち: サーバー環境、またはファイルが配置されていません。", err);
        }
    });
});

// HTML上の画像要素を取得
const mapImageElement = document.getElementById('world-map-image');

mapImageElement.addEventListener('click', () => {
    const targetDataRow = currentIndex + 2;
    console.log("ターゲット行:", targetDataRow);

    fetch("environment_data.csv")
        .then(res => res.text())
        .then(csv => {
            const rows = csv.trim().split('\n').map(r => r.split(','));
            const newData = rows[targetDataRow - 1].map(v => Number(v.trim()));

            // 【ここが重要】
            // 1. 既存のグラフのデータを直接書き換える
            window.trafficChart.data.datasets[0].data = newData;
            // 2. 更新を反映させる
            window.trafficChart.update();

            console.log("グラフを更新しました:", newData);
        })
        .catch(err => console.error("エラー:", err));
});

/**
 * 指定した行のデータを読み込んでグラフを更新する関数（例）
 */
// 画像クリックイベント内の処理
const targetDataRow = currentIndex + 2; 

fetch("environment_data.csv")
    .then(response => response.text())
    .then(csv => {
        // 1. CSVを行ごとに分割
        const rows = csv.split('\n').map(row => row.split(','));
        
        // 2. ラベル（1行目）とデータ（targetDataRow行目）を取得
        const labels = rows[0].map(label => label.trim());
        const rawData = rows[targetDataRow - 1]; 

        if (!rawData) {
            console.error("指定された行にデータが見つかりません:", targetDataRow);
            return;
        }

        // 3. データを数値配列に変換（ここが重要！）
        const numericData = rawData.map(val => Number(val.trim()));

        // 4. 既存のグラフ (trafficChart) の中身を書き換え
        if (window.trafficChart) {
            // ラベルの更新
            window.trafficChart.data.labels = labels;
            // 数値の更新（最初のデータセットを書き換え）
            window.trafficChart.data.datasets[0].data = numericData;
            
            // 5. グラフを再描画
            window.trafficChart.update();
            
            console.log(`${targetDataRow}行目のデータでグラフを更新しました:`, numericData);
        } else {
            console.error("グラフオブジェクト 'trafficChart' が見つかりません。");
        }
    })
    .catch(error => console.error("CSV読み込みエラー:", error));

// CSVを読み込んでグラフを更新する関数
async function loadAndGraphData(rowNumber) {
  try {
    // 1. CSVファイルを読み込む（キャッシュ対策で時間を付与）
    const response = await fetch("environment_data.csv?v=" + new Date().getTime());
    const csvText = await response.text();

    // 2. 行ごとに分割
    const rows = csvText.trim().split('\n').map(row => row.split(','));

    // 3. データを取り出す
    // rows[0] が1行目(ラベル)、rows[rowNumber-1] が指定のデータ行
    const labels = rows[0].map(label => label.trim());
    const rawData = rows[rowNumber - 1];

    if (!rawData) {
      console.error("指定された行にデータがありません:", rowNumber);
      return;
    }

    // 4. 文字列を数値に変換
    const numericData = rawData.map(val => parseFloat(val.trim()));

    // 5. 既存のグラフ (trafficChart) を更新する
    if (window.trafficChart) {
      window.trafficChart.data.labels = labels;
      window.trafficChart.data.datasets[0].data = numericData;
      window.trafficChart.update(); // 画面を書き換え
      console.log(`成功: ${rowNumber}行目のデータを反映しました`, numericData);
    }
  } catch (error) {
    console.error("CSVの読み込み中にエラーが発生しました:", error);
  }
}